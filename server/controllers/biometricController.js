const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");
const { User } = require("../models");
const { generateToken } = require("../middleware/auth");

const RP_ID =
  process.env.RP_ID ||
  (process.env.NODE_ENV === "production"
    ? "enam-clothings.vercel.app"
    : "localhost");
const RP_NAME = process.env.RP_NAME || "Enam Clothings";
// For dev: http://localhost:3000 | For prod: https://enam-clothings.vercel.app
const ORIGIN =
  process.env.WEBAUTHN_ORIGIN ||
  (process.env.NODE_ENV === "production"
    ? "https://enam-clothings.vercel.app"
    : "http://localhost:3000");

// Helper: convert base64url string → Uint8Array (Buffer)
const fromBase64url = (str) => Buffer.from(str, "base64url");
// Helper: convert Uint8Array → base64url string
const toBase64url = (buf) => Buffer.from(buf).toString("base64url");

// @desc    Generate biometric registration challenge
// @route   POST /api/auth/biometric/register-challenge
// @access  Protected (user must be logged in)
const getBiometricRegisterChallenge = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    const existingCredentials = user.webauthnCredentials || [];

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: Buffer.from(user.id),
      userName: user.email,
      userDisplayName: `${user.firstName} ${user.lastName}`,
      attestationType: "none",
      excludeCredentials: existingCredentials.map((cred) => ({
        id: cred.credentialID, // v13: expects base64url string, not Uint8Array
        type: "public-key",
        transports: cred.transports || [],
      })),
      authenticatorSelection: {
        authenticatorAttachment: "platform", // device biometrics (fingerprint / Face ID / Windows Hello)
        userVerification: "required",
        residentKey: "preferred",
      },
    });

    // Store challenge temporarily in user record
    user.webauthnChallenge = options.challenge;
    await user.save();

    res.json(options);
  } catch (error) {
    console.error("Biometric register challenge error:", error);
    res.status(500).json({
      message: "Failed to generate registration options",
      error: error.message,
    });
  }
};

// @desc    Verify and save biometric registration
// @route   POST /api/auth/biometric/register-verify
// @access  Protected
const verifyBiometricRegistration = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user.webauthnChallenge) {
      return res.status(400).json({
        message: "No registration challenge found. Please start over.",
      });
    }

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: req.body,
        expectedChallenge: user.webauthnChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
      });
    } catch (err) {
      return res.status(400).json({
        message: "Registration verification failed",
        error: err.message,
      });
    }

    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
      // v13: fields are nested under registrationInfo.credential
      const { credential, credentialDeviceType, credentialBackedUp } =
        registrationInfo;

      const newCredential = {
        credentialID: credential.id, // already a base64url string in v13
        credentialPublicKey: toBase64url(credential.publicKey), // Uint8Array → base64url
        counter: credential.counter,
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        transports:
          credential.transports || req.body.response?.transports || [],
        createdAt: new Date().toISOString(),
      };

      const existing = user.webauthnCredentials || [];
      user.webauthnCredentials = [...existing, newCredential];
      user.webauthnChallenge = null;
      await user.save();

      return res.json({
        verified: true,
        message: "Biometric login registered successfully!",
      });
    }

    res.status(400).json({ message: "Registration could not be verified" });
  } catch (error) {
    console.error("Biometric register verify error:", error);
    res.status(500).json({
      message: "Registration verification failed",
      error: error.message,
    });
  }
};

// @desc    Generate biometric login challenge
// @route   POST /api/auth/biometric/login-challenge
// @access  Public
const getBiometricLoginChallenge = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: "Account has been deactivated" });
    }

    const credentials = user.webauthnCredentials || [];
    if (credentials.length === 0) {
      return res.status(400).json({
        message:
          "No biometric credentials registered. Please set up biometric login in your profile first.",
      });
    }

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      userVerification: "required",
      allowCredentials: credentials.map((cred) => ({
        id: cred.credentialID, // v13: expects base64url string, not Uint8Array
        type: "public-key",
        transports: cred.transports || [],
      })),
    });

    // Store challenge temporarily
    user.webauthnChallenge = options.challenge;
    await user.save();

    res.json(options);
  } catch (error) {
    console.error("Biometric login challenge error:", error);
    res.status(500).json({
      message: "Failed to generate authentication options",
      error: error.message,
    });
  }
};

// @desc    Verify biometric login and return JWT
// @route   POST /api/auth/biometric/login-verify
// @access  Public
const verifyBiometricLogin = async (req, res) => {
  try {
    const { email, ...authResponse } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.webauthnChallenge) {
      return res.status(400).json({
        message: "No authentication challenge found. Please start over.",
      });
    }

    const credentials = user.webauthnCredentials || [];

    // Find matching credential by ID
    const credential = credentials.find((c) => {
      const responseId = authResponse.id;
      return c.credentialID === responseId;
    });

    if (!credential) {
      return res
        .status(400)
        .json({ message: "Credential not recognized for this account" });
    }

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: authResponse,
        expectedChallenge: user.webauthnChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        // v13: renamed from 'authenticator' to 'credential'
        credential: {
          id: credential.credentialID, // base64url string
          publicKey: fromBase64url(credential.credentialPublicKey), // Uint8Array
          counter: credential.counter,
          transports: credential.transports || [],
        },
      });
    } catch (err) {
      return res
        .status(400)
        .json({ message: "Biometric verification failed", error: err.message });
    }

    const { verified, authenticationInfo } = verification;

    if (verified) {
      // Update counter to protect against replay attacks
      user.webauthnCredentials = credentials.map((c) =>
        c.credentialID === credential.credentialID
          ? { ...c, counter: authenticationInfo.newCounter }
          : c,
      );
      user.webauthnChallenge = null;
      await user.save();

      return res.json({
        _id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        token: generateToken(user.id),
      });
    }

    res.status(401).json({ message: "Biometric authentication failed" });
  } catch (error) {
    console.error("Biometric login verify error:", error);
    res.status(500).json({
      message: "Biometric authentication failed",
      error: error.message,
    });
  }
};

// @desc    Remove a registered biometric credential
// @route   DELETE /api/auth/biometric/:credentialID
// @access  Protected
const removeBiometricCredential = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    const { credentialID } = req.params;

    const credentials = user.webauthnCredentials || [];
    const updated = credentials.filter((c) => c.credentialID !== credentialID);

    if (updated.length === credentials.length) {
      return res.status(404).json({ message: "Credential not found" });
    }

    user.webauthnCredentials = updated;
    await user.save();

    res.json({ message: "Biometric credential removed successfully" });
  } catch (error) {
    console.error("Remove biometric credential error:", error);
    res
      .status(500)
      .json({ message: "Failed to remove credential", error: error.message });
  }
};

module.exports = {
  getBiometricRegisterChallenge,
  verifyBiometricRegistration,
  getBiometricLoginChallenge,
  verifyBiometricLogin,
  removeBiometricCredential,
};
