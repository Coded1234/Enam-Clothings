const { Announcement } = require("../models");
const logger = require("../config/logger");

// @desc    Get all active announcements (public)
// @route   GET /api/announcements/active
const getActiveAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.findAll({
      where: { isActive: true },
      order: [["created_at", "DESC"]],
    });
    res.json({ success: true, announcements });
  } catch (error) {
    logger.error("Error fetching announcements", { error: error.message });
    res.status(500).json({ message: "Failed to fetch announcements" });
  }
};

// @desc    Get all announcements (admin)
// @route   GET /api/announcements
const getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.findAll({
      order: [["created_at", "DESC"]],
    });
    res.json({ success: true, announcements });
  } catch (error) {
    logger.error("Error fetching announcements", { error: error.message });
    res.status(500).json({ message: "Failed to fetch announcements" });
  }
};

// @desc    Create announcement (admin)
// @route   POST /api/announcements
const createAnnouncement = async (req, res) => {
  try {
    const { title, message, isActive } = req.body;
    if (!title || !message) {
      return res
        .status(400)
        .json({ message: "Title and message are required" });
    }
    const announcement = await Announcement.create({
      title: title.trim(),
      message: message.trim(),
      isActive: isActive !== undefined ? isActive : true,
    });
    res.status(201).json({ success: true, announcement });
  } catch (error) {
    logger.error("Error creating announcement", { error: error.message });
    res
      .status(500)
      .json({ message: "Failed to create announcement", error: error.message });
  }
};

// @desc    Update announcement (admin)
// @route   PUT /api/announcements/:id
const updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByPk(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }
    const { title, message, isActive } = req.body;
    if (title !== undefined) announcement.title = title.trim();
    if (message !== undefined) announcement.message = message.trim();
    if (isActive !== undefined) announcement.isActive = isActive;
    await announcement.save();
    res.json({ success: true, announcement });
  } catch (error) {
    logger.error("Error updating announcement", { error: error.message });
    res
      .status(500)
      .json({ message: "Failed to update announcement", error: error.message });
  }
};

// @desc    Delete announcement (admin)
// @route   DELETE /api/announcements/:id
const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByPk(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }
    await announcement.destroy();
    res.json({ success: true, message: "Announcement deleted" });
  } catch (error) {
    logger.error("Error deleting announcement", { error: error.message });
    res.status(500).json({ message: "Failed to delete announcement" });
  }
};

module.exports = {
  getActiveAnnouncements,
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
