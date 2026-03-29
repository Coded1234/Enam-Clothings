"use client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { setCredentials } from "../../redux/slices/authSlice";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { FiCheckCircle, FiXCircle, FiLoader, FiMail } from "react-icons/fi";

const VerifyEmail = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const emailFromQuery = searchParams.get("email") || "";

  const router = useRouter();
  const dispatch = useDispatch();
  const verifiedOnce = useRef(false);

  const getInitialStatus = () => {
    if (token && emailFromQuery) return "verifying";
    if (!token && emailFromQuery) return "waiting_for_click";
    return "invalid_link";
  };

  const [status, setStatus] = useState(getInitialStatus()); // verifying, success, error, invalid_link, waiting_for_click
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (status !== "verifying") return;
    if (!token || !emailFromQuery) return;

    if (verifiedOnce.current) return;
    verifiedOnce.current = true;

    const verifyToken = async () => {
      try {
        const { data } = await api.post("/auth/verify-email", {
          email: emailFromQuery,
          token,
        });

        setStatus("success");
        toast.success("Email verified successfully!");

        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
          dispatch(setCredentials(data.user));
          setTimeout(() => router.push("/"), 2000);
        }
      } catch (error) {
        const msg = error.response?.data?.message || "Verification failed";
        setErrorMessage(msg);
        setStatus("error");
      }
    };

    verifyToken();
  }, [token, emailFromQuery, status, router, dispatch]);

  if (status === "waiting_for_click") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center flex flex-col items-center">
          <FiMail className="text-primary-600 mb-4" size={64} />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Check your email
          </h2>
          <p className="text-gray-500 mb-6">
            We've sent a verification link to <strong>{emailFromQuery}</strong>.
            Please check your inbox and click the link to activate your account.
          </p>
          <Link
            href="/resend-verification"
            className="inline-block px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-medium hover:from-primary-700 hover:to-primary-800 transition-colors w-full mb-3"
          >
            Didn't receive it? Resend Link
          </Link>
        </div>
      </div>
    );
  }

  if (status === "verifying") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center flex flex-col items-center">
          <FiLoader className="text-primary-600 animate-spin mb-4" size={48} />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Verifying Email...
          </h2>
          <p className="text-gray-500">
            Please wait while we verify your email address.
          </p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <FiCheckCircle className="mx-auto text-green-500 mb-4" size={64} />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Email Verified!
          </h2>
          <p className="text-gray-500 mb-6">
            Your account is now active. You are being redirected...
          </p>
          <Link
            href="/"
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
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <FiXCircle className="mx-auto text-red-500 mb-4" size={64} />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Verification Failed
        </h2>
        <p className="text-gray-500 mb-6">
          {status === "invalid_link"
            ? "missing or invalid verification link. Please check your email and click the link from there, or request a new one."
            : errorMessage}
        </p>
        <Link
          href="/resend-verification"
          className="inline-block px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-medium hover:from-primary-700 hover:to-primary-800 transition-colors w-full mb-3"
        >
          Resend Verification Link
        </Link>
        <Link
          href="/login"
          className="inline-block px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors w-full"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmail;
