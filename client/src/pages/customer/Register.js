"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  clearError,
  googleLogin,
  loadUser,
} from "../../redux/slices/authSlice";
import IMAGES from "../../config/images";
import toast from "react-hot-toast";
import api from "../../utils/api";
import { useGoogleLogin } from "@react-oauth/google";
import CompleteProfileModal from "../../components/customer/CompleteProfileModal";
import {
  FiUser,
  FiMail,
  FiLock,
  FiPhone,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiCheck,
} from "react-icons/fi";

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const dispatch = useDispatch();
  const router = useRouter();

  const { user, isAuthenticated, error } = useSelector((state) => state.auth);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const signupGoogle = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      dispatch(googleLogin(tokenResponse.access_token))
        .unwrap()
        .then((userData) => {
          // Check if profile is incomplete
          if (
            !userData.user?.firstName ||
            !userData.user?.lastName ||
            !userData.user?.phone
          ) {
            setShowProfileModal(true);
            toast.success(
              "Registration successful! Please complete your profile.",
            );
          } else {
            toast.success("Registration successful!");
          }
        })
        .catch((err) => {
          // Error handled by slice or toast
        });
    },
    onError: () => {
      toast.error("Google signup failed");
    },
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      // Role-based redirect after registration
      if (user.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/");
      }
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      // Keep only digits so users don't get blocked by hidden pattern mismatches.
      const digitsOnly = String(value || "")
        .replace(/\D/g, "")
        .slice(0, 10);
      setFormData({ ...formData, phone: digitsOnly });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  // Password strength checker
  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-blue-500",
    "bg-green-500",
  ];

  const STRONG_PASSWORD_REGEX =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
  const STRONG_PASSWORD_MESSAGE =
    "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.";

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const ALLOWED_EMAIL_DOMAINS = new Set([
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const firstName = String(formData.firstName || "").trim();
    const lastName = String(formData.lastName || "").trim();
    const email = String(formData.email || "").trim();

    // Validation
    if (!firstName || !lastName || !email || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    const emailDomain = email.toLowerCase().split("@")[1] || "";
    if (!ALLOWED_EMAIL_DOMAINS.has(emailDomain)) {
      toast.error("Enter a valid email address");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!STRONG_PASSWORD_REGEX.test(formData.password)) {
      toast.error(STRONG_PASSWORD_MESSAGE);
      return;
    }

    const phoneDigits = String(formData.phone).replace(/\D/g, "");
    const phonePrefixes = [
      "024",
      "054",
      "055",
      "059",
      "053",
      "027",
      "057",
      "026",
      "056",
      "020",
      "050",
      "028",
    ];
    const blockedNumbers = ["0000000000", "1234567890", "0123456789"];

    if (phoneDigits && !/^\d{10}$/.test(phoneDigits)) {
      toast.error(
        "Phone number must be exactly 10 digits (without country code)",
      );
      return;
    }

    if (phoneDigits && blockedNumbers.includes(phoneDigits)) {
      toast.error("Please enter a valid phone number");
      return;
    }

    if (
      phoneDigits &&
      !phonePrefixes.some((prefix) => phoneDigits.startsWith(prefix))
    ) {
      toast.error(" Enter a valid phone number");
      return;
    }

    if (!agreeTerms) {
      toast.error("Please agree to the terms and conditions");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register", {
        firstName,
        lastName,
        email,
        phone: phoneDigits,
        password: formData.password,
      });

      toast.success(
        "Registration successful! Check your email for your 6-digit OTP code.",
      );
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      const status = err.response?.status;
      const message = String(err.response?.data?.message || "").trim();

      if (status === 400 && /user already exists/i.test(message)) {
        toast.error(
          "This email is already registered. Please sign in or use another email.",
        );
        return;
      }

      if (status === 400 && /invalid email/i.test(message)) {
        toast.error("Please enter a valid email address");
        return;
      }

      if (status === 400 && /invalid email domain/i.test(message)) {
        toast.error("Please use @gmail.com, @yahoo.com, or @hotmail.com");
        return;
      }

      if (status === 400 && /invalid phone/i.test(message)) {
        toast.error("Please enter a valid phone number");
        return;
      }

      toast.error(message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="block text-center mb-8">
            <img
              src="/images/loginlogo.png"
              alt="Diamond Aura Gallery"
              className="h-10 w-auto object-contain mx-auto"
            />
          </Link>

          <>
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Create Account
              </h2>
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-primary-500 hover:text-primary-600 font-medium"
                >
                  Sign In
                </Link>
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Name Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <div className="relative">
                    <FiUser
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="First name"
                      autoComplete="off"
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder-black"
                      style={{ backgroundColor: "white", color: "black" }}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Last name"
                    autoComplete="off"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder-black"
                    style={{ backgroundColor: "white", color: "black" }}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <FiMail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    autoComplete="off"
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder-black"
                    style={{ backgroundColor: "white", color: "black" }}
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <FiPhone
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter mobile number"
                    autoComplete="off"
                    inputMode="numeric"
                    maxLength="10"
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder-black"
                    style={{ backgroundColor: "white", color: "black" }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <FiLock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    autoComplete="new-password"
                    className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder-black"
                    style={{ backgroundColor: "white", color: "black" }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <FiEyeOff size={18} />
                    ) : (
                      <FiEye size={18} />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded ${
                            i < passwordStrength
                              ? strengthColors[passwordStrength - 1]
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p
                      className={`text-xs ${
                        passwordStrength <= 2
                          ? "text-red-500"
                          : passwordStrength <= 3
                            ? "text-yellow-600"
                            : "text-green-500"
                      }`}
                    >
                      {strengthLabels[passwordStrength - 1] || "Too short"}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <FiLock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    className={`w-full pl-11 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder-black ${
                      formData.confirmPassword &&
                      formData.password !== formData.confirmPassword
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    style={{ backgroundColor: "white", color: "black" }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <FiEyeOff size={18} />
                    ) : (
                      <FiEye size={18} />
                    )}
                  </button>
                </div>
                {formData.confirmPassword &&
                  formData.password !== formData.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">
                      Passwords do not match
                    </p>
                  )}
                {formData.confirmPassword &&
                  formData.password === formData.confirmPassword && (
                    <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                      <FiCheck size={12} /> Passwords match
                    </p>
                  )}
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 mt-1 text-primary-500 rounded focus:ring-primary-500"
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="text-primary-500 hover:underline"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-primary-500 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 btn-gradient rounded-xl font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="spinner w-6 h-6 border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    Create Account
                    <FiArrowRight />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-50 text-gray-500">
                  Or sign up with
                </span>
              </div>
            </div>

            {/* Social Signup */}
            <div>
              <button
                type="button"
                onClick={() => {
                  if (!googleClientId) {
                    toast.error(
                      "Google login is not configured in this build.",
                    );
                    return;
                  }
                  signupGoogle();
                }}
                disabled={!googleClientId}
                className={`w-full flex items-center justify-center gap-2 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors ${!googleClientId ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="font-medium text-gray-700">Google</span>
              </button>
            </div>
          </>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src={IMAGES.register}
          alt="Fashion"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-primary-500/80 to-secondary-500/80 flex items-center justify-center">
          <div className="text-white text-center p-8 max-w-md">
            <h2 className="text-2xl font-bold mb-3">
              Join Diamond Aura Gallery
            </h2>
            <p className="text-base text-white/90 mb-8">
              Create an account and unlock exclusive benefits
            </p>
            <div className="space-y-4 text-left">
              {[
                "Get 20% off your first order",
                "Exclusive member-only deals",
                "Early access to new arrivals",
                "Track orders easily",
                "Save your wishlist",
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <FiCheck size={14} />
                  </div>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Complete Profile Modal */}
      <CompleteProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onComplete={(updatedUser) => {
          dispatch(loadUser());
        }}
        user={user}
      />
    </div>
  );
};

export default Register;
