const { ContactMessage } = require("../models");
const { sendEmail, emailTemplates } = require("../config/email");

// @desc    Submit contact form
// @route   POST /api/contact
const submitContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res
        .status(400)
        .json({ message: "Name, email, subject, and message are required" });
    }

    const contact = await ContactMessage.create({
      name,
      email,
      phone,
      subject,
      message,
    });

    // Send confirmation email to user
    try {
      const { subject: emailSubject, html } =
        emailTemplates.contactConfirmation(contact);
      await sendEmail(email, emailSubject, html);
    } catch (emailError) {
      console.error("Contact confirmation email failed:", emailError);
    }

    // Optionally send notification to admin
    try {
      await sendEmail(
        process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
        `New Contact Form Submission: ${subject}`,
        `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        `
      );
    } catch (emailError) {
      console.error("Admin notification email failed:", emailError);
    }

    res.status(201).json({
      message:
        "Your message has been sent successfully. We will get back to you soon!",
      id: contact.id,
    });
  } catch (error) {
    console.error("Contact form error:", error);
    res
      .status(500)
      .json({ message: "Failed to send message", error: error.message });
  }
};

// @desc    Get all contact messages (Admin)
// @route   GET /api/contact/messages
const getMessages = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = "all" } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where = {};
    if (status !== "all") where.status = status;

    const { rows: messages, count: total } =
      await ContactMessage.findAndCountAll({
        where,
        order: [["createdAt", "DESC"]],
        offset,
        limit: Number(limit),
      });

    res.json({
      messages,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch messages", error: error.message });
  }
};

// @desc    Update message status (Admin)
// @route   PUT /api/contact/messages/:id
const updateMessage = async (req, res) => {
  try {
    const { status, reply } = req.body;

    const message = await ContactMessage.findByPk(req.params.id);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (status) message.status = status;
    if (reply) {
      message.reply = reply;
      message.repliedAt = new Date();
      message.status = "replied";

      // Send reply email
      try {
        await sendEmail(
          message.email,
          `Re: ${message.subject} - StyleStore`,
          `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">StyleStore Support</h1>
              </div>
              <div style="padding: 30px; background: #f9f9f9;">
                <h2 style="color: #333;">Hi ${message.name},</h2>
                <p style="color: #666;">Thank you for contacting us. Here's our response to your inquiry:</p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="color: #666;">${reply}</p>
                </div>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                <p style="color: #999; font-size: 12px;"><strong>Your original message:</strong></p>
                <p style="color: #999; font-size: 12px;">${message.message}</p>
              </div>
            </div>
          `
        );
      } catch (emailError) {
        console.error("Reply email failed:", emailError);
      }
    }

    await message.save();
    res.json(message);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update message", error: error.message });
  }
};

// @desc    Delete message (Admin)
// @route   DELETE /api/contact/messages/:id
const deleteMessage = async (req, res) => {
  try {
    const message = await ContactMessage.findByPk(req.params.id);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    await message.destroy();
    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete message", error: error.message });
  }
};

module.exports = {
  submitContact,
  getMessages,
  updateMessage,
  deleteMessage,
};
