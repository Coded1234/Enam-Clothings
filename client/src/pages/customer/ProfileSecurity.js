"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../redux/slices/authSlice";
import api from "../../utils/api";
import toast from "react-hot-toast";
import {
  FiLock,
  FiEye,
  FiEyeOff,
  FiShield,
  FiTrash2,
  FiChevronLeft,
} from "react-icons/fi";

const PasswordField = ({
  label,
  name,
  show,
  onToggle,
  passwordData,
  onChange,
  error,
}) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
      {label}
    </label>
    <div className="relative">
      <FiLock
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        size={15}
      />
      <input
        type={show ? "text" : "password"}
        name={name}
        value={passwordData[name]}
        onChange={onChange}
        required
        className={`w-full pl-9 pr-10 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 ${error ? "border-red-500 bg-red-50" : "border-gray-300"}`}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
      >
        {show ? <FiEyeOff size={15} /> : <FiEye size={15} />}
      </button>
    </div>
    {error ? (
      <p className="mt-1 text-xs text-red-500">{error}</p>
    ) : (
      name === "newPassword" &&
      passwordData[name] &&
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(
        passwordData[name],
      ) && (
        <p className="text-xs text-red-500 mt-2 font-medium">
          Password must be at least 8 characters and include uppercase,
          lowercase, a number, and a special character.
        </p>
      )
    )}
  </div>
);

const ProfileSecurity = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [formErrors, setFormErrors] = useState({});
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    let errors = {};

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(
        passwordData.newPassword,
      )
    ) {
      errors.newPassword =
        "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      await api.put("/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success("Password changed successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to change password";
      if (
        error.response?.status === 400 &&
        message ===
          "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character."
      ) {
        setFormErrors({ newPassword: message });
      } else {
        if (
          message.toLowerCase().includes("incorrect password") ||
          message.toLowerCase().includes("current password")
        ) {
          setFormErrors({ currentPassword: message });
        } else {
          if (
            message.toLowerCase().includes("incorrect password") ||
            message.toLowerCase().includes("current password")
          ) {
            setFormErrors({ currentPassword: message });
          } else {
            toast.error(message);
          }
        }
      }
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await api.delete("/auth/account", {
        data: { password: deletePassword },
      });
      toast.success("Account deleted successfully");
      dispatch(logout());
      router.push("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete account");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => router.push("/profile")}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiChevronLeft size={20} />
          </button>
          <h1 className="text-base font-semibold text-gray-800">Security</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Change Password */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <FiShield className="text-primary-500" size={18} />
            <h2 className="text-sm font-semibold text-gray-800">
              Change Password
            </h2>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <PasswordField
              label="Current Password"
              error={formErrors.currentPassword}
              name="currentPassword"
              show={showCurrentPassword}
              onToggle={() => setShowCurrentPassword(!showCurrentPassword)}
              passwordData={passwordData}
              onChange={handlePasswordChange}
            />
            <PasswordField
              label="New Password"
              error={formErrors.newPassword}
              name="newPassword"
              show={showNewPassword}
              onToggle={() => setShowNewPassword(!showNewPassword)}
              passwordData={passwordData}
              onChange={handlePasswordChange}
            />
            <PasswordField
              label="Confirm New Password"
              error={formErrors.confirmPassword}
              name="confirmPassword"
              show={showConfirmPassword}
              onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
              passwordData={passwordData}
              onChange={handlePasswordChange}
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-primary-500 text-white rounded-lg font-semibold text-sm hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
            >
              <FiShield size={15} />
              Update Password
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-red-100">
          <h2 className="text-sm font-semibold text-red-600 mb-1">
            Danger Zone
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Once you delete your account, there is no going back. Please be
            certain.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full py-2.5 bg-red-500 text-white rounded-lg font-semibold text-sm hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
          >
            <FiTrash2 size={15} />
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <FiTrash2 className="text-red-600" size={18} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                Delete Account
              </h2>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              This action is <strong>permanent and cannot be undone</strong>.
              All your data will be removed.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm your password
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 text-gray-900"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword("");
                }}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading || !deletePassword}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleteLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                    Deleting...
                  </>
                ) : (
                  <>Delete My Account</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSecurity;
