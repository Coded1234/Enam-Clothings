const https = require("https");
const { sendEmail, emailTemplates } = require("../config/email");
const { Order, OrderItem, Product, User } = require("../models");

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

// Check if Paystack is configured
if (!PAYSTACK_SECRET || PAYSTACK_SECRET.includes("your_")) {
  console.warn(
    "⚠️  WARNING: Paystack not configured! Please add PAYSTACK_SECRET_KEY to .env file",
  );
  console.warn(
    "⚠️  Get your keys from: https://dashboard.paystack.com/settings/developer",
  );
}

// @desc    Initialize payment
// @route   POST /api/payment/initialize
const initializePayment = async (req, res) => {
  try {
    const { email, amount, metadata } = req.body;

    // Validate Paystack configuration
    if (!PAYSTACK_SECRET || PAYSTACK_SECRET.includes("your_")) {
      return res.status(500).json({
        status: false,
        message: "Payment gateway not configured. Please contact support.",
      });
    }

    // Validate input
    if (!email || !amount) {
      return res.status(400).json({
        status: false,
        message: "Email and amount are required",
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        status: false,
        message: "Invalid amount",
      });
    }

    const params = JSON.stringify({
      email,
      amount: Math.round(amount * 100), // Convert to kobo and ensure integer
      metadata,
      callback_url: `${process.env.CLIENT_URL}/payment/verify`,
    });

    const options = {
      hostname: "api.paystack.co",
      port: 443,
      path: "/transaction/initialize",
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
    };

    const paystackReq = https.request(options, (paystackRes) => {
      let data = "";

      paystackRes.on("data", (chunk) => {
        data += chunk;
      });

      paystackRes.on("end", () => {
        const response = JSON.parse(data);
        res.json(response);
      });
    });

    paystackReq.on("error", (error) => {
      console.error("Paystack error:", error);
      res.status(500).json({
        status: false,
        message: "Payment initialization failed",
        error: error.message,
      });
    });

    paystackReq.write(params);
    paystackReq.end();
  } catch (error) {
    console.error("Payment initialization error:", error);
    res.status(500).json({
      status: false,
      message: "Payment initialization failed",
      error: error.message,
    });
  }
};

// @desc    Verify payment
// @route   GET /api/payment/verify/:reference
const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    const options = {
      hostname: "api.paystack.co",
      port: 443,
      path: `/transaction/verify/${reference}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
      },
    };

    const paystackReq = https.request(options, (paystackRes) => {
      let data = "";

      paystackRes.on("data", (chunk) => {
        data += chunk;
      });

      paystackRes.on("end", async () => {
        try {
          const response = JSON.parse(data);

          if (response.status && response.data.status === "success") {
            // Payment successful - update order status
            const { Order, OrderItem, Product, User } = require("../models");
            const orderId = response.data.metadata.order_id;

            if (orderId) {
              const order = await Order.findByPk(orderId, {
                include: [
                  {
                    model: OrderItem,
                    as: "items",
                  },
                  {
                    model: User,
                    as: "user",
                  },
                ],
              });

              if (order && order.paymentStatus !== "paid") {
                // Update order status
                order.paymentStatus = "paid";
                order.paymentReference = reference;
                order.status = "confirmed";
                await order.save();

                // Update stock for each product in the order
                for (const item of order.items) {
                  const product = await Product.findByPk(item.productId);
                  if (product) {
                    // Increase soldCount and decrease remainingStock
                    product.soldCount =
                      (product.soldCount || 0) + item.quantity;
                    product.remainingStock =
                      (product.totalStock || 0) - product.soldCount;
                    await product.save();
                  }
                }

                // Send confirmation email
                try {
                  // To Customer
                  const template = emailTemplates.orderConfirmation(
                    order,
                    order.user,
                  );
                  await sendEmail(
                    order.user.email,
                    template.subject,
                    template.html,
                  );

                  // To Admin
                  const adminTemplate = emailTemplates.adminNewOrder(
                    order,
                    order.user,
                  );
                  await sendEmail(
                    process.env.ADMIN_EMAIL || "thefashiongallery264@gmail.com",
                    adminTemplate.subject,
                    adminTemplate.html,
                  );
                } catch (emailError) {
                  console.error(
                    "Error sending confirmation email:",
                    emailError,
                  );
                }

                return res.json({
                  success: true,
                  message: "Payment verified successfully",
                  order: order,
                  data: response.data,
                });
              } else if (order) {
                // Order already paid, just return success
                return res.json({
                  success: true,
                  message: "Payment already verified",
                  order: order,
                  data: response.data,
                });
              }
            }
          }

          res.json({
            success: false,
            message: response.message || "Payment verification failed",
            data: response.data,
          });
        } catch (parseError) {
          console.error("Parse error:", parseError);
          res.status(500).json({
            success: false,
            message: "Error processing payment verification",
          });
        }
      });
    });

    paystackReq.on("error", (error) => {
      console.error("Paystack verification error:", error);
      res.status(500).json({
        success: false,
        message: "Payment verification failed",
        error: error.message,
      });
    });

    paystackReq.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.message,
    });
  }
};

// @desc    Paystack webhook
// @route   POST /api/payment/webhook
const paystackWebhook = async (req, res) => {
  try {
    const crypto = require("crypto");
    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash === req.headers["x-paystack-signature"]) {
      const event = req.body;

      if (event.event === "charge.success") {
        // Handle successful charge
        const { Order, OrderItem, Product } = require("../models");
        const reference = event.data.reference;
        const orderId = event.data.metadata?.order_id;

        console.log("Payment successful:", reference, "Order ID:", orderId);

        if (orderId) {
          const order = await Order.findByPk(orderId, {
            include: [
              {
                model: OrderItem,
                as: "items",
              },
            ],
          });

          if (order && order.paymentStatus !== "paid") {
            // Update order status
            order.paymentStatus = "paid";
            order.paymentReference = reference;
            order.status = "confirmed";
            await order.save();

            // Update stock for each product in the order
            for (const item of order.items) {
              const product = await Product.findByPk(item.productId);
              if (product) {
                // Increase soldCount and decrease remainingStock
                product.soldCount = (product.soldCount || 0) + item.quantity;
                product.remainingStock =
                  (product.totalStock || 0) - product.soldCount;
                await product.save();
              }
            }

            console.log(
              "Order updated:",
              order.id,
              "- Stock updated for all items",
            );
          }
        }
      }
    } else {
      console.warn("Invalid webhook signature");
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook error:", error);
    res.sendStatus(500);
  }
};

module.exports = {
  initializePayment,
  verifyPayment,
  paystackWebhook,
};
