const nodemailer = require("nodemailer");

// Validate email configuration
const emailPass = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;
if (!process.env.EMAIL_USER || !emailPass) {
  console.error("⚠️  EMAIL CONFIGURATION ERROR:");
  console.error("EMAIL_USER:", process.env.EMAIL_USER ? "Set" : "MISSING");
  console.error("EMAIL_PASS:", process.env.EMAIL_PASS ? "Set" : "MISSING");
  console.error(
    "EMAIL_PASSWORD:",
    process.env.EMAIL_PASSWORD ? "Set" : "MISSING",
  );
  console.error("EMAIL_HOST:", process.env.EMAIL_HOST || "MISSING");
  console.error("EMAIL_PORT:", process.env.EMAIL_PORT || "MISSING");
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD,
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: `"Enam's Clothings" <${process.env.EMAIL_USER}>`,
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
          <h1 style="color: white; margin: 0;">Enam's Clothings</h1>
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
              order.totalAmount,
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
                  item.price,
                ).toLocaleString()}</p>
              </div>
            </div>
          `,
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
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Enam's Clothings. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  payOnDeliveryOrder: (order, user) => ({
    subject: `Order Placed - #${
      order.orderNumber || order.id?.slice(-8).toUpperCase()
    }`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #FF9966 0%, #FF5E62 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Enam's Clothings</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Order Placed Successfully!</h2>
          <p style="color: #666;">Hi ${
            user.firstName
          }, thank you for your order. We have received your request for Pay on Delivery.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #FF5E62;">
            <h3 style="margin-top: 0;">Payment Instruction</h3>
            <p>Please have the exact amount of <strong>GH₵${Number(
              order.totalAmount,
            ).toLocaleString()}</strong> ready upon delivery.</p>
            <p><strong>Order ID:</strong> #${
              order.orderNumber || order.id?.slice(-8).toUpperCase()
            }</p>
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
                <p style="margin: 0; color: #FF5E62;">GH₵${Number(
                  item.price,
                ).toLocaleString()}</p>
              </div>
            </div>
          `,
              )
              .join("") || ""
          }
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="${process.env.CLIENT_URL}/orders/${order.id}" 
               style="background: linear-gradient(135deg, #FF9966 0%, #FF5E62 100%); 
                      color: white; padding: 12px 30px; text-decoration: none; 
                      border-radius: 25px; display: inline-block;">
              View Order Details
            </a>
          </div>
        </div>
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Enam's Clothings. All rights reserved.</p>
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
          <h1 style="color: white; margin: 0;">Enam's Clothings</h1>
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
    subject: "Welcome to Enam's Clothings!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to Enam's Clothings!</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Hi ${user.firstName}!</h2>
          <p style="color: #666;">Thank you for joining Enam's Clothings. We're excited to have you!</p>
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
    subject: "Reset Your Password - Enam's Clothings",
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
          <p>© 2026 Enam's Clothings. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  passwordChanged: (user) => ({
    subject: "Password Changed Successfully - Enam's Clothings",
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
          <p>© 2026 Enam's Clothings. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  newsletterWelcome: (email) => ({
    subject: "Welcome to Enam's Clothings Newsletter!",
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
          <p>© 2026 Enam's Clothings. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  contactConfirmation: (contact) => ({
    subject: "We Received Your Message - Enam's Clothings",
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
          <p>© 2026 Enam's Clothings. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  emailVerification: (user, token) => ({
    subject: "Verify Your Email Address - Enam's Clothings",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to Enam's Clothings!</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Hi ${user.firstName},</h2>
          <p style="color: #666;">Thank you for registering with Enam's Clothings. To complete your registration, please verify your email address by clicking the button below.</p>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${process.env.CLIENT_URL}/verify-email/${token}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; padding: 15px 40px; text-decoration: none; 
                      border-radius: 25px; display: inline-block; font-weight: bold;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
          <p style="color: #764ba2; word-break: break-all; font-size: 12px;">
            ${process.env.CLIENT_URL}/verify-email/${token}
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            If you didn't create an account with Enam's Clothings, you can safely ignore this email.
          </p>
          <p style="color: #999; font-size: 12px;">
            This verification link will expire in 24 hours.
          </p>
        </div>
        <div style="padding: 20px; text-align: center; color: #999;">
          <p>© 2026 Enam's Clothings. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  // Admin Notification Templates
  adminNewOrder: (order, user) => ({
    subject: `[ADMIN] New Order Received - #${
      order.orderNumber || order.id?.slice(-8).toUpperCase()
    }`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #333; padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0;">New Order Alert</h2>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p><strong>Customer:</strong> ${user.firstName} ${user.lastName} (${
      user.email
    })</p>
          <p><strong>Payment Method:</strong> ${
            order.paymentMethod === "cod" ? "Pay on Delivery" : "Paystack"
          }</p>
          <p><strong>Total Amount:</strong> GH₵${Number(
            order.totalAmount,
          ).toLocaleString()}</p>
          
          <div style="background: white; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <h3>Order Items:</h3>
             ${
               order.items
                 ?.map(
                   (item) => `
              <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                <p style="margin: 0; font-weight: bold;">${
                  item.productName || item.product?.name
                }</p>
                <p style="margin: 5px 0;">Qty: ${item.quantity} | Size: ${
                     item.size || "N/A"
                   }</p>
              </div>
            `,
                 )
                 .join("") || ""
             }
          </div>
          
          <div style="margin-top: 20px;">
            <a href="${process.env.CLIENT_URL}/admin/orders/${order.id}" 
               style="background: #333; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Order in Admin Panel
            </a>
          </div>
        </div>
      </div>
    `,
  }),

  adminNewsletterSubscription: (email) => ({
    subject: `[ADMIN] New Newsletter Subscriber`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4CAF50; padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0;">New Subscriber!</h2>
        </div>
        <div style="padding: 30px; background: #f9f9f9; text-align: center;">
          <p style="font-size: 18px;">A new user has subscribed to the newsletter:</p>
          <p style="font-size: 24px; font-weight: bold; color: #333;">${email}</p>
        </div>
      </div>
    `,
  }),

  adminOrderCancellation: (order, user, reason) => ({
    subject: `[ADMIN] Order Cancelled - #${
      order.orderNumber || order.id?.slice(-8).toUpperCase()
    }`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #F44336; padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0;">Order Cancellation Alert</h2>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p><strong>Customer:</strong> ${user.firstName} ${user.lastName}</p>
          <p><strong>Order ID:</strong> #${
            order.orderNumber || order.id?.slice(-8).toUpperCase()
          }</p>
          <p><strong>Amount:</strong> GH₵${Number(
            order.totalAmount,
          ).toLocaleString()}</p>
          
          <div style="background: #fff0f0; padding: 15px; border-radius: 5px; border-left: 5px solid #F44336; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #F44336;">Cancellation Reason:</p>
            <p style="margin: 5px 0;">${reason || "No reason provided"}</p>
          </div>

          <div style="margin-top: 20px;">
             <a href="${process.env.CLIENT_URL}/admin/orders/${order.id}" 
               style="background: #333; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Order in Admin Panel
            </a>
          </div>
        </div>
      </div>
    `,
  }),
};

module.exports = { sendEmail, sendBulkEmail, emailTemplates };
