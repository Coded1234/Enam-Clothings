const { Newsletter } = require("../models");
const { sendEmail, emailTemplates } = require("../config/email");

// @desc    Subscribe to newsletter
// @route   POST /api/newsletter/subscribe
const subscribe = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if already subscribed
    const existing = await Newsletter.findOne({ where: { email } });

    if (existing) {
      if (existing.isSubscribed) {
        return res
          .status(400)
          .json({ message: "This email is already subscribed" });
      } else {
        // Resubscribe
        existing.isSubscribed = true;
        existing.subscribedAt = new Date();
        existing.unsubscribedAt = null;
        await existing.save();

        return res.json({
          message: "Successfully resubscribed to newsletter!",
        });
      }
    }

    // Create new subscription
    await Newsletter.create({ email });

    // Send welcome email
    try {
      // To Subscriber
      const { subject, html } = emailTemplates.newsletterWelcome(email);
      await sendEmail(email, subject, html);

      // To Admin
      const adminTemplate = emailTemplates.adminNewsletterSubscription(email);
      await sendEmail(
        process.env.ADMIN_EMAIL || "thefashiongallery264@gmail.com",
        adminTemplate.subject,
        adminTemplate.html,
      );
    } catch (emailError) {
      console.error("Newsletter welcome email failed:", emailError);
    }

    res.status(201).json({ message: "Successfully subscribed to newsletter!" });
  } catch (error) {
    console.error("Newsletter subscribe error:", error);
    res
      .status(500)
      .json({ message: "Failed to subscribe", error: error.message });
  }
};

// @desc    Unsubscribe from newsletter
// @route   POST /api/newsletter/unsubscribe
const unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;

    const subscription = await Newsletter.findOne({ where: { email } });

    if (!subscription) {
      return res
        .status(404)
        .json({ message: "Email not found in our newsletter list" });
    }

    subscription.isSubscribed = false;
    subscription.unsubscribedAt = new Date();
    await subscription.save();

    res.json({ message: "Successfully unsubscribed from newsletter" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to unsubscribe", error: error.message });
  }
};

// @desc    Get all subscribers (Admin)
// @route   GET /api/newsletter/subscribers
const getSubscribers = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = "all" } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where = {};
    if (status === "subscribed") where.isSubscribed = true;
    if (status === "unsubscribed") where.isSubscribed = false;

    const { rows: subscribers, count: total } =
      await Newsletter.findAndCountAll({
        where,
        order: [["createdAt", "DESC"]],
        offset,
        limit: Number(limit),
      });

    res.json({
      subscribers,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch subscribers", error: error.message });
  }
};

module.exports = {
  subscribe,
  unsubscribe,
  getSubscribers,
};
