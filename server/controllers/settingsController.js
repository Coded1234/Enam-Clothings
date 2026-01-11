const { Settings } = require("../models");

// Default settings
const defaultSettings = {
  storeName: "StyleStore",
  storeEmail: "info@stylestore.com",
  storePhone: "+233 XX XXX XXXX",
  storeAddress: "Accra, Ghana",
  currency: "GHS",
  currencySymbol: "GH₵",
  taxRate: 0,
  shippingFee: 50,
  freeShippingThreshold: 500,
  socialLinks: {
    facebook: "",
    twitter: "",
    instagram: "",
    youtube: "",
  },
  aboutText: "Your one-stop destination for premium fashion and clothing.",
  returnPolicy: "30-day return policy on all items",
  privacyPolicy: "",
  termsConditions: "",
};

// @desc    Get all settings
// @route   GET /api/settings
const getSettings = async (req, res) => {
  try {
    const settings = await Settings.getAllSettings();

    // Merge with defaults
    const mergedSettings = { ...defaultSettings, ...settings };

    res.json(mergedSettings);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch settings", error: error.message });
  }
};

// @desc    Get public settings (for frontend)
// @route   GET /api/settings/public
const getPublicSettings = async (req, res) => {
  try {
    const settings = await Settings.getAllSettings();

    // Only return public settings
    const publicSettings = {
      storeName: settings.storeName || defaultSettings.storeName,
      storeEmail: settings.storeEmail || defaultSettings.storeEmail,
      storePhone: settings.storePhone || defaultSettings.storePhone,
      storeAddress: settings.storeAddress || defaultSettings.storeAddress,
      currency: settings.currency || defaultSettings.currency,
      currencySymbol: settings.currencySymbol || defaultSettings.currencySymbol,
      shippingFee: settings.shippingFee || defaultSettings.shippingFee,
      freeShippingThreshold:
        settings.freeShippingThreshold || defaultSettings.freeShippingThreshold,
      socialLinks: settings.socialLinks || defaultSettings.socialLinks,
      aboutText: settings.aboutText || defaultSettings.aboutText,
    };

    res.json(publicSettings);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch settings", error: error.message });
  }
};

// @desc    Update settings (Admin)
// @route   PUT /api/settings
const updateSettings = async (req, res) => {
  try {
    const updates = req.body;

    // Update each setting
    for (const [key, value] of Object.entries(updates)) {
      await Settings.setSetting(key, value);
    }

    const settings = await Settings.getAllSettings();
    res.json({ ...defaultSettings, ...settings });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update settings", error: error.message });
  }
};

// @desc    Reset settings to default (Admin)
// @route   POST /api/settings/reset
const resetSettings = async (req, res) => {
  try {
    // Update all settings to defaults
    for (const [key, value] of Object.entries(defaultSettings)) {
      await Settings.setSetting(key, value);
    }

    res.json(defaultSettings);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to reset settings", error: error.message });
  }
};

// @desc    Bulk update settings (Admin)
// @route   PUT /api/settings/bulk
const bulkUpdateSettings = async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || !Array.isArray(settings)) {
      return res.status(400).json({ message: "Settings array is required" });
    }

    // Update each setting
    for (const setting of settings) {
      if (setting.key && setting.value !== undefined) {
        await Settings.setSetting(setting.key, setting.value);
      }
    }

    const allSettings = await Settings.getAllSettings();
    res.json({ success: true, settings: allSettings });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update settings", error: error.message });
  }
};

module.exports = {
  getSettings,
  getPublicSettings,
  updateSettings,
  bulkUpdateSettings,
  resetSettings,
  defaultSettings,
};
