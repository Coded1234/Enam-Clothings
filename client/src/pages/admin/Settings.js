import React, { useState, useEffect } from "react";
import {
  FiSave,
  FiRefreshCw,
  FiMail,
  FiDollarSign,
  FiTruck,
  FiShield,
  FiGlobe,
  FiBell,
  FiCheck,
  FiX,
} from "react-icons/fi";
import api from "../../utils/api";

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [notification, setNotification] = useState({
    show: false,
    type: "",
    message: "",
  });

  const [settings, setSettings] = useState({
    // General Settings
    siteName: "Enam's Clothings",
    siteDescription: "Your one-stop shop for fashion",
    contactEmail: "support@enamsclothings.com",
    contactPhone: "+233 XX XXX XXXX",
    address: "Accra, Ghana",

    // Currency & Tax
    currency: "GHS",
    currencySymbol: "GH₵",
    taxRate: 0,
    taxEnabled: false,

    // Shipping Settings
    freeShippingThreshold: 500,
    standardShippingRate: 25,
    expressShippingRate: 50,
    enableExpressShipping: true,

    // Order Settings
    minOrderAmount: 50,
    maxOrderItems: 20,
    orderPrefix: "ORD",

    // Email Settings
    emailNotifications: true,
    orderConfirmationEmail: true,
    shippingUpdateEmail: true,
    newsletterEnabled: true,

    // Security Settings
    requireEmailVerification: false,
    maxLoginAttempts: 5,
    sessionTimeout: 60, // minutes

    // Social Media
    facebookUrl: "",
    instagramUrl: "",
    twitterUrl: "",
    youtubeUrl: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get("/settings");
      if (response.data) {
        // Merge fetched settings with defaults
        const fetchedSettings = response.data;
        setSettings((prev) => ({ ...prev, ...fetchedSettings }));
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      // Use default settings if fetch fails
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Save each setting
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
      }));

      await api.put("/settings/bulk", { settings: settingsArray });
      setNotification({
        show: true,
        type: "success",
        message: "Settings saved successfully!",
      });
      setTimeout(
        () => setNotification({ show: false, type: "", message: "" }),
        3000
      );
    } catch (error) {
      console.error("Error saving settings:", error);
      setNotification({
        show: true,
        type: "error",
        message: "Failed to save settings",
      });
      setTimeout(
        () => setNotification({ show: false, type: "", message: "" }),
        3000
      );
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "general", label: "General", icon: FiGlobe },
    { id: "shipping", label: "Shipping", icon: FiTruck },
    { id: "email", label: "Email", icon: FiMail },
    { id: "notifications", label: "Notifications", icon: FiBell },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Notification */}
      {notification.show && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-3 md:px-4 py-2 md:py-3 rounded-lg shadow-lg ${
            notification.type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {notification.type === "success" ? (
            <FiCheck className="w-5 h-5" />
          ) : (
            <FiX className="w-5 h-5" />
          )}
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Settings
          </h1>
          <p className="text-xs md:text-sm text-gray-600 mt-1">
            Manage your store configuration
          </p>
        </div>
        <div className="flex gap-2 md:gap-3">
          <button
            onClick={fetchSettings}
            className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FiRefreshCw className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <FiRefreshCw className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
            ) : (
              <FiSave className="w-3 h-3 md:w-4 md:h-4" />
            )}
            <span className="hidden sm:inline">Save Changes</span>
            <span className="sm:hidden">Save</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary-600 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <tab.icon className="w-3 h-3 md:w-4 md:h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 md:p-6">
          {/* General Settings */}
          {activeTab === "general" && (
            <div className="space-y-4 md:space-y-6">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">
                General Settings
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => handleChange("siteName", e.target.value)}
                    className="w-full px-3 md:px-4 py-1.5 md:py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) =>
                      handleChange("contactEmail", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={settings.contactPhone}
                    onChange={(e) =>
                      handleChange("contactPhone", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Description
                  </label>
                  <textarea
                    value={settings.siteDescription}
                    onChange={(e) =>
                      handleChange("siteDescription", e.target.value)
                    }
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="border-t pt-4 md:pt-6">
                <h4 className="text-sm md:text-base font-medium text-gray-900 mb-4">
                  Social Media Links
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                      Facebook URL
                    </label>
                    <input
                      type="url"
                      value={settings.facebookUrl}
                      onChange={(e) =>
                        handleChange("facebookUrl", e.target.value)
                      }
                      placeholder="https://facebook.com/yourpage"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instagram URL
                    </label>
                    <input
                      type="url"
                      value={settings.instagramUrl}
                      onChange={(e) =>
                        handleChange("instagramUrl", e.target.value)
                      }
                      placeholder="https://instagram.com/yourpage"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Twitter URL
                    </label>
                    <input
                      type="url"
                      value={settings.twitterUrl}
                      onChange={(e) =>
                        handleChange("twitterUrl", e.target.value)
                      }
                      placeholder="https://twitter.com/yourpage"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      YouTube URL
                    </label>
                    <input
                      type="url"
                      value={settings.youtubeUrl}
                      onChange={(e) =>
                        handleChange("youtubeUrl", e.target.value)
                      }
                      placeholder="https://youtube.com/yourchannel"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Shipping Settings */}
          {activeTab === "shipping" && (
            <div className="space-y-4 md:space-y-6">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">
                Shipping Settings
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Free Shipping Threshold (GH₵)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={settings.freeShippingThreshold}
                    onChange={(e) =>
                      handleChange(
                        "freeShippingThreshold",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Orders above this amount get free shipping
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Standard Shipping Rate (GH₵)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={settings.standardShippingRate}
                    onChange={(e) =>
                      handleChange(
                        "standardShippingRate",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Express Shipping Rate (GH₵)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={settings.expressShippingRate}
                    onChange={(e) =>
                      handleChange(
                        "expressShippingRate",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.enableExpressShipping}
                      onChange={(e) =>
                        handleChange("enableExpressShipping", e.target.checked)
                      }
                      className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      Enable Express Shipping Option
                    </span>
                  </label>
                </div>
              </div>

              <div className="border-t pt-4 md:pt-6">
                <h4 className="text-sm md:text-base font-medium text-gray-900 mb-4">
                  Order Limits
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Order Amount (GH₵)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={settings.minOrderAmount}
                      onChange={(e) =>
                        handleChange(
                          "minOrderAmount",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Items Per Order
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={settings.maxOrderItems}
                      onChange={(e) =>
                        handleChange(
                          "maxOrderItems",
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order Number Prefix
                    </label>
                    <input
                      type="text"
                      value={settings.orderPrefix}
                      onChange={(e) =>
                        handleChange("orderPrefix", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Email Settings */}
          {activeTab === "email" && (
            <div className="space-y-4 md:space-y-6">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">
                Email Settings
              </h3>

              <div className="space-y-4">
                <label className="flex items-center cursor-pointer p-3 md:p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) =>
                      handleChange("emailNotifications", e.target.checked)
                    }
                    className="w-4 h-4 md:w-5 md:h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <div className="ml-3">
                    <span className="text-xs md:text-sm font-medium text-gray-700">
                      Enable Email Notifications
                    </span>
                    <p className="text-xs text-gray-500">
                      Master toggle for all email notifications
                    </p>
                  </div>
                </label>

                <label className="flex items-center cursor-pointer p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={settings.orderConfirmationEmail}
                    onChange={(e) =>
                      handleChange("orderConfirmationEmail", e.target.checked)
                    }
                    className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-700">
                      Order Confirmation Emails
                    </span>
                    <p className="text-xs text-gray-500">
                      Send email when customer places an order
                    </p>
                  </div>
                </label>

                <label className="flex items-center cursor-pointer p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={settings.shippingUpdateEmail}
                    onChange={(e) =>
                      handleChange("shippingUpdateEmail", e.target.checked)
                    }
                    className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-700">
                      Shipping Update Emails
                    </span>
                    <p className="text-xs text-gray-500">
                      Send email when order status changes
                    </p>
                  </div>
                </label>

                <label className="flex items-center cursor-pointer p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={settings.newsletterEnabled}
                    onChange={(e) =>
                      handleChange("newsletterEnabled", e.target.checked)
                    }
                    className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-700">
                      Newsletter System
                    </span>
                    <p className="text-xs text-gray-500">
                      Enable newsletter subscription feature
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === "notifications" && (
            <div className="space-y-4 md:space-y-6">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">
                Admin Notifications
              </h3>
              <p className="text-xs md:text-sm text-gray-600">
                Configure when you receive notifications about store activities.
              </p>

              <div className="space-y-4">
                <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3 text-sm md:text-base">
                    Order Notifications
                  </h4>
                  <div className="space-y-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        New order placed
                      </span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        Order cancelled
                      </span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        Order refunded
                      </span>
                    </label>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Inventory Notifications
                  </h4>
                  <div className="space-y-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        Low stock alert
                      </span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        Out of stock
                      </span>
                    </label>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Customer Notifications
                  </h4>
                  <div className="space-y-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        New customer registration
                      </span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        New product review
                      </span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        Contact form submission
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
