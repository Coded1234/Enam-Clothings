const validator = require("validator");

const GMAIL_DOMAIN = "@gmail.com";
const ALLOWED_SIGNUP_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
]);

const GHANA_ALLOWED_PREFIXES = new Set([
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
]);

const PHONE_BLACKLIST = new Set(["0000000000", "1234567890", "0123456789"]);

const normalizeEmail = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim().toLowerCase();
};

const isValidEmail = (value) => {
  const email = normalizeEmail(value);

  // Basic hardening: disallow control characters (header injection etc.)
  if (/[^\x20-\x7E]/.test(email) || /[\r\n\0]/.test(email)) return false;

  if (!validator.isEmail(email)) return false;

  return true;
};

const validateEmail = (value) => {
  const email = normalizeEmail(value);

  if (!email) {
    return { ok: false, email, message: "Email is required" };
  }

  if (!isValidEmail(email)) {
    return {
      ok: false,
      email,
      message: "Invalid email address.",
    };
  }

  return { ok: true, email };
};

const hasAllowedSignupEmailDomain = (value) => {
  const email = normalizeEmail(value);
  const atIndex = email.lastIndexOf("@");
  if (atIndex < 0) return false;
  const domain = email.slice(atIndex + 1);
  return ALLOWED_SIGNUP_EMAIL_DOMAINS.has(domain);
};

const validateAllowedSignupEmailDomain = (value) => {
  const email = normalizeEmail(value);
  if (!email) {
    return { ok: false, email, message: "Email is required" };
  }

  if (!hasAllowedSignupEmailDomain(email)) {
    return {
      ok: false,
      email,
      message:
        "Invalid email domain. Please use @gmail.com, @yahoo.com, or @hotmail.com.",
    };
  }

  return { ok: true, email };
};

const isValidGmailEmail = (value) => {
  const email = normalizeEmail(value);

  // Basic hardening: disallow control characters (header injection etc.)
  if (/[\r\n\0]/.test(email)) return false;

  if (!validator.isEmail(email)) return false;
  if (!email.endsWith(GMAIL_DOMAIN)) return false;

  return true;
};

const validateGmailEmail = (value) => {
  const email = normalizeEmail(value);

  if (!email) {
    return { ok: false, email, message: "Email is required" };
  }

  if (!isValidGmailEmail(email)) {
    return {
      ok: false,
      email,
      message: "Invalid email. Please use a valid @gmail.com address.",
    };
  }

  return { ok: true, email };
};

const normalizePhone = (value) => {
  if (value === null || value === undefined) return "";

  // Keep digits only
  let digits = String(value).replace(/\D/g, "");

  // Normalize leading 00233... to 233...
  if (digits.startsWith("00233")) digits = digits.slice(2);

  // Normalize 233XXXXXXXXX (12 digits) to 0XXXXXXXXX (10 digits)
  if (digits.startsWith("233") && digits.length === 12) {
    digits = `0${digits.slice(3)}`;
  }

  return digits;
};

const isValidGhanaPhone = (value) => {
  const phone = normalizePhone(value);

  if (PHONE_BLACKLIST.has(phone)) return false;

  // Strict requirement: must be local 10-digit starting with allowed prefixes
  if (!/^0\d{9}$/.test(phone)) return false;

  const prefix = phone.slice(0, 3);
  if (!GHANA_ALLOWED_PREFIXES.has(prefix)) return false;

  return true;
};

const validateGhanaPhone = (value, { required = false } = {}) => {
  const phone = normalizePhone(value);

  if (!phone) {
    if (required) {
      return { ok: false, phone, message: "Phone number is required" };
    }
    return { ok: true, phone: "" };
  }

  if (!isValidGhanaPhone(phone)) {
    return {
      ok: false,
      phone,
      message:
        "Invalid phone number. Use a valid Ghana number starting with 024, 054, 055, 059, 053, 027, 057, 026, 056, 020, 050, or 028.",
    };
  }

  return { ok: true, phone };
};

module.exports = {
  normalizeEmail,
  validateEmail,
  isValidEmail,
  validateAllowedSignupEmailDomain,
  hasAllowedSignupEmailDomain,
  validateGmailEmail,
  isValidGmailEmail,
  normalizePhone,
  validateGhanaPhone,
  isValidGhanaPhone,
  GHANA_ALLOWED_PREFIXES,
};
