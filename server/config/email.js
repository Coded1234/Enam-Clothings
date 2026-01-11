const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: `"StyleStore" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

// Email templates
const emailTemplates = {
  orderConfirmation: (order, user) => ({
    subject: `Order Confirmed - #${
      order.orderNumber || order.id?.slice(-8).toUpperCase()
    }`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">StyleStore</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Thank you for your order, ${
            user.firstName
          }!</h2>
          <p style="color: #666;">Your order has been confirmed and is being processed.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Order Details</h3>
            <p><strong>Order ID:</strong> #${
              order.orderNumber || order.id?.slice(-8).toUpperCase()
            }</p>
            <p><strong>Total:</strong> GH₵${Number(
              order.totalAmount
            ).toLocaleString()}</p>
            <p><strong>Status:</strong> ${order.status}</p>
          </div>
          
          <h3>Items Ordered:</h3>
          ${
            order.items
              ?.map(
                (item) => `
            <div style="display: flex; align-items: center; padding: 10px; background: white; margin: 5px 0; border-radius: 4px;">
              <div>
                <p style="margin: 0; font-weight: bold;">${
                  item.productName || item.product?.name
                }</p>
                <p style="margin: 5px 0; color: #666;">Size: ${
                  item.size || "N/A"
                } | Qty: ${item.quantity}</p>
                <p style="margin: 0; color: #764ba2;">GH₵${Number(
                  item.price
                ).toLocaleString()}</p>
              </div>
            </div>
          `
              )
              .join("") || ""
          }
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="${process.env.CLIENT_URL}/orders/${order.id}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; padding: 12px 30px; text-decoration: none; 
                      border-radius: 25px; display: inline-block;">
              Track Your Order
            </a>
          </div>
        </div>
        <div style="padding: 20px; text-align: center; color: #999;">
          <p>© 2026 StyleStore. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  orderStatusUpdate: (order, user) => ({
    subject: `Order Update - #${
      order.orderNumber || order.id?.slice(-8).toUpperCase()
    }`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">StyleStore</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Order Status Update</h2>
          <p style="color: #666;">Hi ${
            user.firstName
          }, your order status has been updated.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="color: #666; margin: 0;">Order #${
              order.orderNumber || order.id?.slice(-8).toUpperCase()
            }</p>
            <h2 style="color: #764ba2; margin: 10px 0;">${order.status?.toUpperCase()}</h2>
          </div>
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="${process.env.CLIENT_URL}/orders/${order.id}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; padding: 12px 30px; text-decoration: none; 
                      border-radius: 25px; display: inline-block;">
              View Order Details
            </a>
          </div>
        </div>
      </div>
    `,
  }),

  welcomeEmail: (user) => ({
    subject: "Welcome to StyleStore!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to StyleStore!</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Hi ${user.firstName}!</h2>
          <p style="color: #666;">Thank you for joining StyleStore. We're excited to have you!</p>
          <p style="color: #666;">Discover the latest fashion trends and enjoy exclusive deals.</p>
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="${process.env.CLIENT_URL}/shop" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; padding: 12px 30px; text-decoration: none; 
                      border-radius: 25px; display: inline-block;">
              Start Shopping
            </a>
          </div>
        </div>
      </div>
    `,
  }),

  passwordReset: (user, resetUrl) => ({
    subject: "Reset Your Password - StyleStore",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Password Reset Request</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Hi ${user.firstName},</h2>
          <p style="color: #666;">We received a request to reset your password. Click the button below to create a new password:</p>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${resetUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; padding: 15px 40px; text-decoration: none; 
                      border-radius: 25px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #666;">This link will expire in 24 hours for security reasons.</p>
          <p style="color: #666;">If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="color: #764ba2; font-size: 12px; word-break: break-all;">${resetUrl}</p>
        </div>
        <div style="padding: 20px; text-align: center; color: #999;">
          <p>© 2026 StyleStore. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  passwordChanged: (user) => ({
    subject: "Password Changed Successfully - StyleStore",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Password Changed</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Hi ${user.firstName},</h2>
          <p style="color: #666;">Your password has been successfully changed.</p>
          <p style="color: #666;">If you did not make this change, please contact our support team immediately.</p>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${process.env.CLIENT_URL}/login" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; padding: 12px 30px; text-decoration: none; 
                      border-radius: 25px; display: inline-block;">
              Login Now
            </a>
          </div>
        </div>
        <div style="padding: 20px; text-align: center; color: #999;">
          <p>© 2026 StyleStore. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  newsletterWelcome: (email) => ({
    subject: "Welcome to StyleStore Newsletter!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">You're Subscribed!</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Thanks for subscribing!</h2>
          <p style="color: #666;">You'll now receive updates on:</p>
          <ul style="color: #666;">
            <li>New arrivals and collections</li>
            <li>Exclusive discounts and promotions</li>
            <li>Fashion tips and trends</li>
            <li>Special member-only offers</li>
          </ul>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${process.env.CLIENT_URL}/shop" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; padding: 12px 30px; text-decoration: none; 
                      border-radius: 25px; display: inline-block;">
              Shop Now
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            You can unsubscribe at any time by clicking the unsubscribe link in our emails.
          </p>
        </div>
        <div style="padding: 20px; text-align: center; color: #999;">
          <p>© 2026 StyleStore. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  contactConfirmation: (contact) => ({
    subject: "We Received Your Message - StyleStore",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Message Received</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Hi ${contact.name},</h2>
          <p style="color: #666;">Thank you for contacting us. We've received your message and will get back to you within 24-48 hours.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Your Message:</h3>
            <p style="color: #666;"><strong>Subject:</strong> ${contact.subject}</p>
            <p style="color: #666;">${contact.message}</p>
          </div>
          
          <p style="color: #666;">In the meantime, you might find answers to common questions on our <a href="${process.env.CLIENT_URL}/faq" style="color: #764ba2;">FAQ page</a>.</p>
        </div>
        <div style="padding: 20px; text-align: center; color: #999;">
          <p>© 2026 StyleStore. All rights reserved.</p>
        </div>
      </div>
    `,
  }),
};

module.exports = { sendEmail, emailTemplates };
