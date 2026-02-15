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
      from: `"The Fashion Gallery" <${process.env.EMAIL_USER}>`,
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

// Send the same email to multiple recipients. Accepts an array of emails or a comma-separated string.
const sendBulkEmail = async (recipients, subject, html) => {
  try {
    if (!recipients) return;

    // Send in batches to avoid overwhelming the server/SMTP
    const batchSize = 20;
    // Ensure recipients is an array
    const recipientList = Array.isArray(recipients) ? recipients : [recipients];

    for (let i = 0; i < recipientList.length; i += batchSize) {
      const batch = recipientList.slice(i, i + batchSize);
      const promises = batch.map((email) => {
        const mailOptions = {
          from: `"The Fashion Gallery" <${process.env.EMAIL_USER}>`,
          to: email,
          subject,
          html,
        };
        return transporter.sendMail(mailOptions).catch((err) => {
          console.error(`Failed to send email to ${email}:`, err.message);
        });
      });
      await Promise.all(promises);
    }
    console.log(`Bulk email sent to ${recipientList.length} recipients`);
  } catch (error) {
    console.error("Error sending bulk email:", error);
  }
};

// Helper for consistent email layout
const getEmailLayout = (content, title = "The Fashion Gallery") => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-radius: 8px; margin-top: 20px; margin-bottom: 20px;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); padding: 40px 20px; text-align: center; border-bottom: 2px solid #c9ad65;">
        <img src="${process.env.CLIENT_URL}/images/loginlogo.png" alt="The Fashion Gallery" style="height: 40px; width: auto; object-fit: contain;" />
      </div>
      
      <!-- Content -->
      <div style="padding: 40px 30px;">
        ${content}
      </div>
      
      <!-- Footer -->
      <div style="background-color: #333333; color: #888888; padding: 20px; text-align: center; font-size: 12px;">
        <p style="margin: 0 0 10px 0;">&copy; ${new Date().getFullYear()} The Fashion Gallery. All rights reserved.</p>
        <p style="margin: 0;">
          <a href="${process.env.CLIENT_URL}" style="color: #aaaaaa; text-decoration: none;">Visit Store</a> | 
          <a href="${process.env.CLIENT_URL}/contact" style="color: #aaaaaa; text-decoration: none;">Contact Us</a>
        </p>
      </div>
    </div>
  </body>
  </html>
`;

// Email templates
const emailTemplates = {
  orderConfirmation: (order, user) => {
    const itemsHtml = order.items
      ?.map(
        (item) => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid #eee;">
        <div>
          <p style="margin: 0; font-weight: 600; color: #333;">${
            item.productName || item.product?.name
          }</p>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #666;">Size: ${
            item.size || "N/A"
          } | Qty: ${item.quantity}</p>
        </div>
        <div style="font-weight: 600; color: #764ba2;">GH₵${Number(
          item.price,
        ).toLocaleString()}</div>
      </div>
    `,
      )
      .join("");

    const content = `
      <h2 style="color: #333; margin-top: 0; text-align: center;">Order Confirmed!</h2>
      <p style="text-align: center; color: #666; font-size: 16px;">Hi ${
        user.firstName
      }, thank you for your order.</p>
      
      <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin: 30px 0;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #666;">Order ID:</span>
          <span style="font-weight: 600; color: #333;">#${
            order.orderNumber || order.id?.slice(-8).toUpperCase()
          }</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #666;">Date:</span>
          <span style="font-weight: 600; color: #333;">${new Date().toLocaleDateString()}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #666;">Total Amount:</span>
          <span style="font-weight: 700; color: #764ba2; font-size: 18px;">GH₵${Number(
            order.totalAmount,
          ).toLocaleString()}</span>
        </div>
      </div>

      <h3 style="color: #333; font-size: 18px; margin-bottom: 15px;">Items Ordered</h3>
      <div style="margin-bottom: 30px;">
        ${itemsHtml || "<p>No items details available.</p>"}
      </div>

      <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL}/orders/${order.id}" 
           style="background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); color: #c9ad65; border: 1px solid #c9ad65; padding: 14px 30px; text-decoration: none; border-radius: 30px; font-weight: 600; display: inline-block;">
          Track Order
        </a>
      </div>
    `;
    return {
      subject: `Order Confirmed - #${
        order.orderNumber || order.id?.slice(-8).toUpperCase()
      }`,
      html: getEmailLayout(content, "Order Confirmation"),
    };
  },

  payOnDeliveryOrder: (order, user) => {
    const itemsHtml = order.items
      ?.map(
        (item) => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid #eee;">
        <div>
          <p style="margin: 0; font-weight: 600; color: #333;">${
            item.productName || item.product?.name
          }</p>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #666;">Size: ${
            item.size || "N/A"
          } | Qty: ${item.quantity}</p>
        </div>
        <div style="font-weight: 600; color: #FF5E62;">GH₵${Number(
          item.price,
        ).toLocaleString()}</div>
      </div>
    `,
      )
      .join("");

    const content = `
      <h2 style="color: #333; margin-top: 0; text-align: center;">Order Placed!</h2>
      <p style="text-align: center; color: #666; font-size: 16px;">Hi ${
        user.firstName
      }, thank you for choosing Pay on Delivery.</p>
      
      <div style="background-color: #fff0f0; border-left: 4px solid #FF5E62; border-radius: 4px; padding: 20px; margin: 30px 0;">
        <h3 style="color: #FF5E62; margin-top: 0;">Payment Instruction</h3>
        <p style="color: #666; margin-bottom: 0;">Please have the exact amount of <strong>GH₵${Number(
          order.totalAmount,
        ).toLocaleString()}</strong> ready upon delivery.</p>
      </div>

      <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #666;">Order ID:</span>
          <span style="font-weight: 600; color: #333;">#${
            order.orderNumber || order.id?.slice(-8).toUpperCase()
          }</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #666;">Total Amount:</span>
          <span style="font-weight: 700; color: #FF5E62; font-size: 18px;">GH₵${Number(
            order.totalAmount,
          ).toLocaleString()}</span>
        </div>
      </div>

      <h3 style="color: #333; font-size: 18px; margin-bottom: 15px;">Items Ordered</h3>
      <div style="margin-bottom: 30px;">
        ${itemsHtml || "<p>No items details available.</p>"}
      </div>

      <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL}/orders/${order.id}" 
           style="background: linear-gradient(135deg, #FF9966 0%, #FF5E62 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 30px; font-weight: 600; display: inline-block;">
          View Order
        </a>
      </div>
    `;
    return {
      subject: `Order Placed - #${
        order.orderNumber || order.id?.slice(-8).toUpperCase()
      }`,
      html: getEmailLayout(content, "Order Placed"),
    };
  },

  orderStatusUpdate: (order, user) => {
    const content = `
      <h2 style="color: #333; margin-top: 0; text-align: center;">Order Status Update</h2>
      <p style="text-align: center; color: #666; font-size: 16px;">Hi ${
        user.firstName
      }, your order status has changed.</p>
      
      <div style="text-align: center; margin: 40px 0;">
        <p style="color: #999; margin-bottom: 10px; font-size: 14px;">Order #${
          order.orderNumber || order.id?.slice(-8).toUpperCase()
        }</p>
        <div style="display: inline-block; background-color: #f3e8ff; color: #764ba2; padding: 10px 30px; border-radius: 50px; font-size: 24px; font-weight: 700; letter-spacing: 1px;">
          ${order.status?.toUpperCase()}
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL}/orders/${order.id}" 
           style="background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); color: #c9ad65; border: 1px solid #c9ad65; padding: 14px 30px; text-decoration: none; border-radius: 30px; font-weight: 600; display: inline-block;">
          Track Order
        </a>
      </div>
    `;
    return {
      subject: `Order Update - #${
        order.orderNumber || order.id?.slice(-8).toUpperCase()
      }`,
      html: getEmailLayout(content, "Order Update"),
    };
  },

  welcomeEmail: (user) => {
    const content = `
      <h2 style="color: #333; margin-top: 0; text-align: center;">Welcome, ${user.firstName}!</h2>
      <p style="text-align: center; color: #666; font-size: 16px;">We're thrilled to have you join the The Fashion Gallery family.</p>
      
      <div style="margin: 30px 0; text-align: center;">
        <img src="https://img.icons8.com/clouds/200/000000/shopping-bag.png" alt="Shopping" style="width: 150px; height: auto;">
      </div>
      
      <p style="text-align: center; color: #666; line-height: 1.6;">
        Discover the latest trends, exclusive collections, and premium quality fashion designed just for you.
      </p>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.CLIENT_URL}/shop" 
           style="background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); color: #c9ad65; border: 1px solid #c9ad65; padding: 14px 30px; text-decoration: none; border-radius: 30px; font-weight: 600; display: inline-block;">
          Start Shopping
        </a>
      </div>
    `;
    return {
      subject: "Welcome to The Fashion Gallery!",
      html: getEmailLayout(content, "Welcome"),
    };
  },

  passwordReset: (user, resetUrl) => {
    const content = `
      <h2 style="color: #333; margin-top: 0; text-align: center;">Reset Your Password</h2>
      <p style="text-align: center; color: #666; font-size: 16px;">Hi ${user.firstName}, we received a request to reset your password.</p>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="${resetUrl}" 
           style="background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); color: #c9ad65; border: 1px solid #c9ad65; padding: 14px 30px; text-decoration: none; border-radius: 30px; font-weight: 600; display: inline-block;">
          Reset Password
        </a>
      </div>
      
      <p style="text-align: center; color: #999; font-size: 13px; line-height: 1.5;">
        If you didn't request this, you can safely ignore this email. The link will expire in 24 hours.
      </p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
        <p style="color: #999; font-size: 12px; margin-bottom: 5px;">Link not working? Copy and paste this URL:</p>
        <p style="color: #764ba2; font-size: 11px; word-break: break-all;">${resetUrl}</p>
      </div>
    `;
    return {
      subject: "Reset Your Password",
      html: getEmailLayout(content, "Password Reset"),
    };
  },

  passwordChanged: (user) => {
    const content = `
      <h2 style="color: #333; margin-top: 0; text-align: center;">Password Changed</h2>
      <p style="text-align: center; color: #666; font-size: 16px;">Hi ${user.firstName}, your password has been updated successfully.</p>
      
      <div style="text-align: center; margin: 40px 0;">
        <img src="https://img.icons8.com/clouds/200/000000/lock.png" alt="Secure" style="width: 100px; height: auto;">
      </div>

      <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL}/login" 
           style="background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); color: #c9ad65; border: 1px solid #c9ad65; padding: 14px 30px; text-decoration: none; border-radius: 30px; font-weight: 600; display: inline-block;">
          Login Now
        </a>
      </div>
    `;
    return {
      subject: "Password Changed Successfully",
      html: getEmailLayout(content, "Password Changed"),
    };
  },

  newsletterWelcome: (email) => {
    const content = `
      <h2 style="color: #333; margin-top: 0; text-align: center;">You're Subscribed!</h2>
      <p style="text-align: center; color: #666; font-size: 16px;">Thanks for joining our newsletter.</p>
      
      <div style="background-color: #f9f9f9; border-radius: 8px; padding: 30px; margin: 30px 0; text-align: center;">
        <p style="color: #666; margin-bottom: 15px;">Expect to receive updates on:</p>
        <div style="display: inline-block; text-align: left;">
          <p style="margin: 5px 0;">✨ New arrivals & Collections</p>
          <p style="margin: 5px 0;">🏷️ Exclusive discounts</p>
          <p style="margin: 5px 0;">👗 Fashion tips & trends</p>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL}/shop" 
           style="background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); color: #c9ad65; border: 1px solid #c9ad65; padding: 14px 30px; text-decoration: none; border-radius: 30px; font-weight: 600; display: inline-block;">
          Browse Collection
        </a>
      </div>
    `;
    return {
      subject: "Welcome to The Fashion Gallery Newsletter!",
      html: getEmailLayout(content, "Newsletter Subscription"),
    };
  },

  newsletterNewProduct: (product) => {
    const content = `
      <div style="text-align: center;">
        <span style="background-color: #e0e7ff; color: #4338ca; padding: 5px 15px; border-radius: 15px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">New Arrival</span>
        <h2 style="color: #333; margin: 20px 0 10px 0; font-size: 24px;">${
          product.name
        }</h2>
        
        ${
          product.images && product.images.length > 0
            ? `
          <div style="margin: 25px 0; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 20px rgba(0,0,0,0.1);">
            <img src="${product.images[0].url || product.images[0]}" alt="${
              product.name
            }" style="width: 100%; height: auto; display: block;">
          </div>
        `
            : ""
        }
        
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
          ${
            product.description
              ? product.description.substring(0, 150) +
                (product.description.length > 150 ? "..." : "")
              : ""
          }
        </p>
        
        <p style="font-size: 28px; font-weight: 700; color: #764ba2; margin-bottom: 30px;">
          GH₵${Number(product.price).toLocaleString()}
        </p>
        
        <a href="${process.env.CLIENT_URL}/products/${product.id}" 
           style="background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); color: #c9ad65; border: 1px solid #c9ad65; padding: 15px 40px; text-decoration: none; border-radius: 30px; font-weight: 600; display: inline-block; box-shadow: 0 4px 10px rgba(118, 75, 162, 0.3);">
          Shop Now
        </a>
        
        <p style="margin-top: 30px; font-size: 12px; color: #999;">
          <a href="${
            process.env.CLIENT_URL
          }/newsletter/unsubscribe" style="color: #999; text-decoration: underline;">Unsubscribe</a> from these updates.
        </p>
      </div>
    `;
    return {
      subject: `New Arrival: ${product.name}`,
      html: getEmailLayout(content, "New Arrival"),
    };
  },

  newsletterNewCoupon: (coupon) => {
    const content = `
      <div style="text-align: center;">
        <span style="background-color: #fff0f0; color: #e11d48; padding: 5px 15px; border-radius: 15px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Special Offer</span>
        <h2 style="color: #333; margin: 20px 0;">Save on Your Next Order!</h2>
        
        <div style="background-color: #ffffff; border: 2px dashed #FF5E62; border-radius: 12px; padding: 30px; margin: 30px 0; position: relative;">
          <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Use Code:</p>
          <h1 style="color: #FF5E62; margin: 0; font-size: 42px; letter-spacing: 4px; font-family: monospace;">${
            coupon.code
          }</h1>
          <p style="color: #333; font-weight: 600; font-size: 18px; margin: 15px 0 5px 0;">
            ${
              coupon.discount_type === "percentage"
                ? `${coupon.discount_value}% OFF`
                : `GH₵${coupon.discount_value} OFF`
            }
          </p>
          ${
            coupon.min_purchase > 0
              ? `<p style="color: #999; font-size: 13px; margin: 0;">Min. Purchase: GH₵${coupon.min_purchase}</p>`
              : ""
          }
        </div>
        
        <p style="color: #666; margin-bottom: 30px;">
          ${coupon.description || "Don't miss out on this limited time offer."}
        </p>

        <a href="${process.env.CLIENT_URL}/products" 
           style="background: linear-gradient(135deg, #FF9966 0%, #FF5E62 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 30px; font-weight: 600; display: inline-block; box-shadow: 0 4px 10px rgba(255, 94, 98, 0.3);">
          Shop & Save
        </a>
        
        <p style="margin-top: 30px; font-size: 12px; color: #999;">
          <a href="${
            process.env.CLIENT_URL
          }/newsletter/unsubscribe" style="color: #999; text-decoration: underline;">Unsubscribe</a> from these updates.
        </p>
      </div>
    `;
    return {
      subject: `Special Offer: ${coupon.code}`,
      html: getEmailLayout(content, "Special Offer"),
    };
  },

  contactConfirmation: (contact) => {
    const content = `
      <h2 style="color: #333; margin-top: 0; text-align: center;">Message Received</h2>
      <p style="text-align: center; color: #666; font-size: 16px;">Hi ${contact.name}, thanks for reaching out.</p>
      
      <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin: 30px 0;">
        <h3 style="color: #333; font-size: 16px; margin-top: 0;">We've received your message:</h3>
        <p style="color: #666; font-weight: 600; margin-bottom: 5px;">${contact.subject}</p>
        <p style="color: #666; font-style: italic;">"${contact.message}"</p>
      </div>
      
      <p style="text-align: center; color: #666;">We will get back to you within 24-48 hours.</p>
    `;
    return {
      subject: "We Received Your Message",
      html: getEmailLayout(content, "Contact Received"),
    };
  },

  emailVerification: (user, token) => {
    const content = `
      <h2 style="color: #333; margin-top: 0; text-align: center;">Verify Email</h2>
      <p style="text-align: center; color: #666; font-size: 16px;">Hi ${user.firstName}, please verify your email to continue.</p>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="${process.env.CLIENT_URL}/verify-email/${token}" 
           style="background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); color: #c9ad65; border: 1px solid #c9ad65; padding: 14px 30px; text-decoration: none; border-radius: 30px; font-weight: 600; display: inline-block;">
          Verify Email Address
        </a>
      </div>
      
      <p style="text-align: center; color: #999; font-size: 13px;">
        Link expires in 24 hours. If you didn't create an account, ignore this email.
      </p>
    `;
    return {
      subject: "Verify Your Email Address",
      html: getEmailLayout(content, "Email Verification"),
    };
  },

  // Admin Notification Templates
  adminNewOrder: (order, user) => {
    const itemsHtml = order.items
      ?.map(
        (item) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px; color: #333;">${
          item.productName || item.product?.name
        }</td>
        <td style="padding: 10px; color: #666;">${item.size || "N/A"}</td>
        <td style="padding: 10px; color: #666;">x${item.quantity}</td>
      </tr>
    `,
      )
      .join("");

    const content = `
      <h2 style="color: #333; margin-top: 0;">New Order Alert 🔔</h2>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Customer:</strong> ${user.firstName} ${
          user.lastName
        } (${user.email})</p>
        <p style="margin: 5px 0;"><strong>Amount:</strong> GH₵${Number(
          order.totalAmount,
        ).toLocaleString()}</p>
        <p style="margin: 5px 0;"><strong>Payment:</strong> ${
          order.paymentMethod === "cod" ? "Pay on Delivery" : "Paystack"
        }</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #eee;">
            <th style="padding: 10px; text-align: left; border-radius: 4px 0 0 4px;">Item</th>
            <th style="padding: 10px; text-align: left;">Size</th>
            <th style="padding: 10px; text-align: left; border-radius: 0 4px 4px 0;">Qty</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL}/admin/orders/${order.id}" 
           style="background-color: #333; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          View in Admin Panel
        </a>
      </div>
    `;
    return {
      subject: `[ADMIN] New Order - #${
        order.orderNumber || order.id?.slice(-8).toUpperCase()
      }`,
      html: getEmailLayout(content, "Admin Alert"),
    };
  },

  adminNewsletterSubscription: (email) => {
    const content = `
      <h2 style="color: #333; margin-top: 0; text-align: center;">New Subscriber! 🎉</h2>
      
      <div style="background-color: #e6fffa; border: 1px solid #b2f5ea; border-radius: 8px; padding: 30px; margin: 30px 0; text-align: center;">
        <p style="color: #2c7a7b; font-size: 18px; margin: 0;">New email added to list:</p>
        <p style="color: #234e52; font-size: 24px; font-weight: bold; margin: 10px 0;">${email}</p>
      </div>
    `;
    return {
      subject: `[ADMIN] New Newsletter Subscriber`,
      html: getEmailLayout(content, "Admin Alert"),
    };
  },

  adminOrderCancellation: (order, user, reason) => {
    const content = `
      <h2 style="color: #e53e3e; margin-top: 0; text-align: center;">Order Cancelled ⚠️</h2>
      
      <div style="background-color: #fff5f5; border-left: 4px solid #e53e3e; border-radius: 4px; padding: 20px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Order:</strong> #${
          order.orderNumber || order.id?.slice(-8).toUpperCase()
        }</p>
        <p style="margin: 5px 0;"><strong>Customer:</strong> ${
          user.firstName
        } ${user.lastName}</p>
        <p style="margin: 5px 0;"><strong>Reason:</strong> ${
          reason || "No reason provided"
        }</p>
      </div>

      <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL}/admin/orders/${order.id}" 
           style="background-color: #333; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          View in Admin Panel
        </a>
      </div>
    `;
    return {
      subject: `[ADMIN] Order Cancelled - #${
        order.orderNumber || order.id?.slice(-8).toUpperCase()
      }`,
      html: getEmailLayout(content, "Admin Alert"),
    };
  },
};

module.exports = { sendEmail, sendBulkEmail, emailTemplates };
