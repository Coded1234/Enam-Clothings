import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateProfile } from "../../redux/slices/authSlice";
import api from "../../utils/api";
import { getImageUrl } from "../../utils/imageUrl";
import toast from "react-hot-toast";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiMapPin,
  FiCamera,
  FiEdit2,
  FiSave,
  FiX,
  FiEye,
  FiEyeOff,
  FiShield,
  FiBell,
  FiCreditCard,
  FiPackage,
  FiHeart,
  FiLogOut,
  FiTrash2,
  FiCheck,
} from "react-icons/fi";

const Profile = () => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    avatar: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promotions: true,
    newsletter: false,
    smsAlerts: true,
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        avatar: user.avatar || "",
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put("/auth/profile", profileData);
      dispatch(updateProfile(profileData));
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
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
      toast.error(error.response?.data?.message || "Failed to change password");
    }
  };

  const handleNotificationChange = async (key) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    try {
      await api.put("/auth/notifications", updated);
      toast.success("Notification preferences updated!");
    } catch (error) {
      // Revert on error
      setNotifications(notifications);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a valid image file (JPEG, PNG, or WebP)");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    setUploadingAvatar(true);
    try {
      const { data } = await api.post("/auth/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Avatar uploaded, URL:", data.avatar);

      // Update local state
      setProfileData({ ...profileData, avatar: data.avatar });

      // Update Redux state
      await dispatch(updateProfile({ avatar: data.avatar }));

      // Force re-fetch user profile to ensure consistency
      const { data: updatedUser } = await api.get("/auth/profile");
      dispatch(updateProfile(updatedUser));

      toast.success("Avatar updated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!window.confirm("Are you sure you want to remove your avatar?")) {
      return;
    }

    setUploadingAvatar(true);
    try {
      await api.delete("/auth/avatar");

      // Update local state
      setProfileData({ ...profileData, avatar: "" });

      // Update Redux state
      await dispatch(updateProfile({ avatar: "" }));

      // Force re-fetch user profile
      const { data: updatedUser } = await api.get("/auth/profile");
      dispatch(updateProfile(updatedUser));

      toast.success("Avatar removed successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: FiUser },
    { id: "security", label: "Security", icon: FiShield },
    { id: "notifications", label: "Notifications", icon: FiBell },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              Account Settings
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your account information and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Profile Card */}
              <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                <div className="text-center">
                  <div className="relative inline-block">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 p-1">
                      <div className="w-full h-full rounded-full bg-white p-1">
                        {uploadingAvatar ? (
                          <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                          </div>
                        ) : profileData.avatar ? (
                          <>
                            <img
                              src={getImageUrl(profileData.avatar)}
                              alt="Avatar"
                              className="w-full h-full rounded-full object-cover"
                              onError={(e) => {
                                console.error(
                                  "Avatar load error. URL:",
                                  getImageUrl(profileData.avatar)
                                );
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                            <div
                              style={{ display: "none" }}
                              className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center"
                            >
                              <FiUser className="text-gray-400" size={32} />
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                            <FiUser className="text-gray-400" size={32} />
                          </div>
                        )}
                      </div>
                    </div>
                    <label
                      className={`absolute bottom-0 right-0 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-600 transition-colors ${
                        uploadingAvatar ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <FiCamera className="text-white" size={14} />
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={uploadingAvatar}
                      />
                    </label>
                  </div>
                  <h3 className="font-bold text-gray-800 mt-4">
                    {profileData.firstName} {profileData.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">{profileData.email}</p>
                  <p className="text-xs text-gray-400 mt-1 px-4">
                    Click camera icon to upload
                  </p>
                  <p className="text-xs text-gray-400">
                    (JPEG, PNG, WebP - Max 2MB)
                  </p>
                  {profileData.avatar && (
                    <button
                      onClick={handleDeleteAvatar}
                      disabled={uploadingAvatar}
                      className="mt-2 text-xs text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Remove Avatar
                    </button>
                  )}
                  <span className="inline-block mt-2 px-3 py-1 bg-primary-50 text-primary-600 text-sm font-medium rounded-full">
                    {user?.role === "admin" ? "Administrator" : "Customer"}
                  </span>
                </div>
              </div>

              {/* Navigation */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      activeTab === tab.id
                        ? "bg-primary-50 text-primary-600 border-l-4 border-primary-500"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <tab.icon size={18} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Quick Links */}
              <div className="bg-white rounded-2xl shadow-sm mt-6 overflow-hidden">
                <a
                  href="/orders"
                  className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <FiPackage size={18} />
                  My Orders
                </a>
                <a
                  href="/wishlist"
                  className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <FiHeart size={18} />
                  Wishlist
                </a>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 transition-colors">
                  <FiLogOut size={18} />
                  Sign Out
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800">
                      Personal Information
                    </h2>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        <FiEdit2 size={18} />
                        Edit
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <FiX size={18} />
                        Cancel
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleProfileSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name
                        </label>
                        <div className="relative">
                          <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            name="firstName"
                            value={profileData.firstName}
                            onChange={handleProfileChange}
                            disabled={!isEditing}
                            className={`w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                              !isEditing ? "bg-gray-50" : ""
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={profileData.lastName}
                          onChange={handleProfileChange}
                          disabled={!isEditing}
                          className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                            !isEditing ? "bg-gray-50" : ""
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="email"
                            name="email"
                            value={profileData.email}
                            onChange={handleProfileChange}
                            disabled={!isEditing}
                            className={`w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                              !isEditing ? "bg-gray-50" : ""
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <div className="relative">
                          <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="tel"
                            name="phone"
                            value={profileData.phone}
                            onChange={handleProfileChange}
                            disabled={!isEditing}
                            className={`w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                              !isEditing ? "bg-gray-50" : ""
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {isEditing && (
                      <button
                        type="submit"
                        disabled={loading}
                        className="mt-6 px-6 py-3 btn-gradient rounded-xl font-semibold flex items-center gap-2"
                      >
                        <FiSave />
                        Save Changes
                      </button>
                    )}
                  </form>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === "security" && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">
                      Change Password
                    </h2>
                    <form onSubmit={handlePasswordSubmit} className="max-w-md">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Password
                          </label>
                          <div className="relative">
                            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type={showCurrentPassword ? "text" : "password"}
                              name="currentPassword"
                              value={passwordData.currentPassword}
                              onChange={handlePasswordChange}
                              className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                              required
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowCurrentPassword(!showCurrentPassword)
                              }
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                            >
                              {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                          </label>
                          <div className="relative">
                            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type={showNewPassword ? "text" : "password"}
                              name="newPassword"
                              value={passwordData.newPassword}
                              onChange={handlePasswordChange}
                              className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                              required
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowNewPassword(!showNewPassword)
                              }
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                            >
                              {showNewPassword ? <FiEyeOff /> : <FiEye />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm New Password
                          </label>
                          <div className="relative">
                            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              name="confirmPassword"
                              value={passwordData.confirmPassword}
                              onChange={handlePasswordChange}
                              className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                              required
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                            >
                              {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="mt-6 px-6 py-3 btn-gradient rounded-xl font-semibold flex items-center gap-2"
                      >
                        <FiShield />
                        Update Password
                      </button>
                    </form>
                  </div>

                  {/* Danger Zone */}
                  <div className="bg-white rounded-2xl shadow-sm p-6 border-2 border-red-100">
                    <h2 className="text-xl font-bold text-red-600 mb-4">
                      Danger Zone
                    </h2>
                    <p className="text-gray-600 mb-4">
                      Once you delete your account, there is no going back.
                      Please be certain.
                    </p>
                    <button className="px-6 py-3 bg-red-500 text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-red-600 transition-colors">
                      <FiTrash2 />
                      Delete Account
                    </button>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === "notifications" && (
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-6">
                    Notification Preferences
                  </h2>
                  <div className="space-y-4">
                    {[
                      {
                        key: "orderUpdates",
                        title: "Order Updates",
                        description:
                          "Get notified about your order status changes",
                        icon: FiPackage,
                      },
                      {
                        key: "promotions",
                        title: "Promotions & Offers",
                        description:
                          "Receive updates about sales and special offers",
                        icon: FiCreditCard,
                      },
                      {
                        key: "newsletter",
                        title: "Newsletter",
                        description: "Weekly fashion tips and new arrivals",
                        icon: FiMail,
                      },
                      {
                        key: "smsAlerts",
                        title: "SMS Alerts",
                        description: "Get order updates via SMS",
                        icon: FiPhone,
                      },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-primary-300 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-gray-100 rounded-xl">
                            <item.icon className="text-gray-600" size={20} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {item.title}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleNotificationChange(item.key)}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            notifications[item.key]
                              ? "bg-primary-500"
                              : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                              notifications[item.key]
                                ? "translate-x-6"
                                : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
