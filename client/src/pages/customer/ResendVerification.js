import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { FiMail, FiCheckCircle } from "react-icons/fi";

const ResendVerification = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(
        "/api/auth/resend-verification",
        { email }
      );
      setSuccess(true);
      toast.success(data.message);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to resend verification email"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {!success ? (
          <>
            <div className="text-center mb-8">
              <div className="mb-4">
                <FiMail className="mx-auto text-primary-600" size={64} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Resend Verification Email
              </h2>
              <p className="text-gray-600">
                Enter your email address and we'll send you a new verification
                link
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 rounded-lg font-medium hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Send Verification Email"}
              </button>

              <div className="text-center text-sm">
                <Link
                  to="/login"
                  className="text-primary-600 hover:underline font-medium"
                >
                  Back to Login
                </Link>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="mb-6">
              <FiCheckCircle className="mx-auto text-green-500" size={64} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Email Sent!
            </h2>
            <p className="text-gray-600 mb-6">
              We've sent a verification link to <strong>{email}</strong>. Please
              check your inbox and click the link to verify your account.
            </p>
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="text-primary-600 hover:underline text-sm font-medium"
              >
                Try Different Email
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResendVerification;
