import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "../../redux/slices/authSlice";
import axios from "axios";
import { FiCheckCircle, FiXCircle, FiLoader } from "react-icons/fi";

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const { data } = await axios.get(`/api/auth/verify-email/${token}`);
        setStatus("success");
        setMessage(data.message);

        // Auto-login user with returned token
        if (data.token && data.user) {
          localStorage.setItem("token", data.token);
          dispatch(setCredentials({ user: data.user, token: data.token }));
        }

        // Redirect to home after 2 seconds
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } catch (error) {
        setStatus("error");
        setMessage(
          error.response?.data?.message || "Email verification failed",
        );
      }
    };

    if (token) {
      verifyEmail();
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          {status === "verifying" && (
            <>
              <div className="mb-6">
                <FiLoader
                  className="animate-spin mx-auto text-primary-600"
                  size={64}
                />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Verifying Your Email
              </h2>
              <p className="text-gray-600">
                Please wait while we verify your email address...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mb-6">
                <FiCheckCircle className="mx-auto text-green-500" size={64} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Email Verified!
              </h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  Redirecting to home page...
                </p>
                <Link
                  to="/"
                  className="inline-block bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg font-medium hover:from-primary-700 hover:to-primary-800 transition-all"
                >
                  Go to Home Now
                </Link>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mb-6">
                <FiXCircle className="mx-auto text-red-500" size={64} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Verification Failed
              </h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-3">
                <Link
                  to="/resend-verification"
                  className="inline-block bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg font-medium hover:from-primary-700 hover:to-primary-800 transition-all"
                >
                  Resend Verification Email
                </Link>
                <div>
                  <Link
                    to="/register"
                    className="text-primary-600 hover:underline text-sm"
                  >
                    Register Again
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
