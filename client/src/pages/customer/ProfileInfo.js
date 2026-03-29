"use client";
/* eslint-env browser */
/* eslint-disable no-unused-vars */
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateProfile } from "../../redux/slices/authSlice";
import api from "../../utils/api";
import toast from "react-hot-toast";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiEdit2,
  FiSave,
  FiX,
  FiChevronLeft,
} from "react-icons/fi";

const ProfileInfo = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, loading } = useSelector((state) => state.auth);

  const [isEditing, setIsEditing] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPhoneError("");

    // Strict pattern for Ghana phone networks
    const phoneRegex = /^(02[0345678]|05[0345679])\d{7}$/;
    const phoneStr = (profileData.phone || "").trim().replace(/\s+/g, "");

    if (phoneStr && !phoneRegex.test(phoneStr)) {
      setPhoneError("Invalid number format.");
      return;
    }

    const payload = { ...profileData, phone: phoneStr };

    try {
      await api.put("/auth/profile", payload);
      dispatch(updateProfile(payload));
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
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
          <h1 className="text-base font-semibold text-gray-800">
            Personal Information
          </h1>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="ml-auto flex items-center gap-1.5 text-sm text-primary-500 font-medium"
            >
              <FiEdit2 size={14} /> Edit
            </button>
          ) : (
            <button
              onClick={() => {
                setIsEditing(false);
                setPhoneError("");
                if (user) {
                  setProfileData({
                    ...profileData,
                    phone: user.phone || "",
                  });
                }
              }}
              className="ml-auto flex items-center gap-1.5 text-sm text-gray-500 font-medium"
            >
              <FiX size={14} /> Cancel
            </button>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm p-5 space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
              First Name
            </label>
            <div className="relative">
              <FiUser
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={15}
              />
              <input
                type="text"
                name="firstName"
                value={profileData.firstName}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 ${
                  !isEditing ? "bg-gray-50 border-gray-200" : "border-gray-300"
                }`}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              value={profileData.lastName}
              onChange={handleChange}
              disabled={!isEditing}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 ${
                !isEditing ? "bg-gray-50 border-gray-200" : "border-gray-300"
              }`}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
              Email Address
            </label>
            <div className="relative">
              <FiMail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={15}
              />
              <input
                type="email"
                name="email"
                value={profileData.email}
                disabled
                className="w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed outline-none"
                title="Email cannot be changed"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
              Phone Number
            </label>
            <div className="relative">
              <FiPhone
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={15}
              />
              <input
                type="tel"
                name="phone"
                maxLength={10}
                value={profileData.phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setProfileData({ ...profileData, phone: val });
                  setPhoneError("");
                }}
                disabled={!isEditing}
                className={`w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 ${
                  !isEditing
                    ? "bg-gray-50 border-gray-200"
                    : phoneError
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300"
                }`}
                placeholder="e.g. 0540000000"
              />
            </div>
            {phoneError && (
              <p className="mt-1 text-xs text-red-500">{phoneError}</p>
            )}
          </div>
          {isEditing && (
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary-500 text-white rounded-lg font-semibold text-sm hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FiSave size={15} />
              Save Changes
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProfileInfo;
