import React, { useState, useRef, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "../../redux/slices/authSlice";
import axios from "axios";
import toast from "react-hot-toast";
import { FiMail, FiCheckCircle, FiRefreshCw } from "react-icons/fi";

const OTP_LENGTH = 6;

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const emailFromQuery = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailFromQuery);
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const otp = digits.join("");

  const handleDigitChange = (index, value) => {
    // Allow paste of full OTP
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, OTP_LENGTH);
      const next = Array(OTP_LENGTH).fill("");
      for (let i = 0; i < pasted.length; i++) {
        next[i] = pasted[i];
      }
      setDigits(next);
      const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
      inputRefs.current[focusIndex]?.focus();
      return;
    }
    const digit = value.replace(/\D/g, "");
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== OTP_LENGTH || digits.some((d) => d === "")) {
      toast.error("Please enter all 6 digits");
      return;
    }
    if (!email) {
      toast.error("Email is required");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post("/api/auth/verify-email", { email, otp });
      setVerified(true);
      toast.success("Email verified successfully!");

      if (data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        dispatch(setCredentials({ user: data.user, token: data.token }));
        setTimeout(() => navigate("/"), 1500);
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Verification failed";
      toast.error(msg);
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("Please enter your email address first");
      return;
    }
    setResending(true);
    try {
      const { data } = await axios.post("/api/auth/resend-verification", { email });
      toast.success(data.message);
      setCooldown(60);
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  if (verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <FiCheckCircle className="mx-auto text-green-500 mb-4" size={64} />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Email Verified!</h2>
          <p className="text-gray-500 mb-4">You're being redirected to the home page…</p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-medium hover:from-primary-700 hover:to-primary-800 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Icon + heading */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiMail className="text-primary-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Check Your Email</h2>
          <p className="text-gray-500 text-sm">We sent a 6-digit code to</p>
          {emailFromQuery ? (
            <p className="font-semibold text-gray-800 mt-1">{emailFromQuery}</p>
          ) : (
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          )}
        </div>

        {/* OTP digit boxes */}
        <form onSubmit={handleSubmit}>
          <div className="flex justify-center gap-3 mb-6">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={d}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                autoFocus={i === 0}
                className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 transition-colors ${
                  d
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-gray-300 text-gray-800"
                }`}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== OTP_LENGTH}
            className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying…" : "Verify Email"}
          </button>
        </form>

        {/* Resend */}
        <div className="mt-5 text-center text-sm text-gray-500">
          Didn't receive a code?{" "}
          {cooldown > 0 ? (
            <span className="text-gray-400">Resend in {cooldown}s</span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-primary-600 hover:underline font-medium inline-flex items-center gap-1 disabled:opacity-50"
            >
              <FiRefreshCw size={13} className={resending ? "animate-spin" : ""} />
              {resending ? "Sending…" : "Resend OTP"}
            </button>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          Code expires in 10 minutes · Check your spam folder if not received
        </p>

        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-gray-500 hover:text-primary-600">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
