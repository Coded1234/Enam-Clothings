"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import React from "react";
import { FiCheckCircle, FiShield } from "react-icons/fi";

const DataDeletionStatus = () => {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[var(--bg)] flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white dark:bg-surface rounded-2xl shadow-sm p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <FiCheckCircle className="text-green-600" size={32} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-gold-light mb-3">
          Data Deletion Request Received
        </h1>

        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Your request to delete personal data associated with your Facebook
          account has been successfully processed. Your account information has
          been removed from Diamond Vogue Gallery.
        </p>

        {code && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Confirmation Code
            </p>
            <p className="text-lg font-mono font-semibold text-gray-800 dark:text-white tracking-wider">
              {code}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Keep this code for your records
            </p>
          </div>
        )}

        <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-left mb-6">
          <FiShield className="text-blue-500 mt-0.5 shrink-0" size={18} />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Order history may be retained in anonymised form to comply with
            financial record-keeping requirements, but all personally
            identifiable information has been removed.
          </p>
        </div>

        <Link
          href="/"
          className="inline-block px-6 py-3 btn-gradient rounded-xl font-semibold text-sm"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default DataDeletionStatus;
