const https = require("https");
const { sendEmail, emailTemplates } = require("../config/email");
const { Order, OrderItem, Product, User } = require("../models");
const { validateEmail } = require("../utils/inputValidation");

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

    const emailCheck = validateEmail(email);
    if (!emailCheck.ok) {
      return res
        .status(400)
        .json({ status: false, message: emailCheck.message });
    }

    if (amount <= 0) {
      return res.status(400).json({
        status: false,
        message: "Invalid amount",
      });
    }

    const callbackBaseUrl =
      process.env.CLIENT_URL || req.headers.origin || "http://localhost:3000";

    const params = JSON.stringify({
      email: emailCheck.email,
      amount: Math.round(amount * 100), // Convert to kobo and ensure integer
      metadata,
      callback_url: `${callbackBaseUrl}/payment/verify`,
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

      paystackRes.on("end", async () => {
        try {
          const response = JSON.parse(data);

          // Save the reference to the order IMMEDIATELY so we don't rely only on metadata later
          if (
            response.status &&
            response.data &&
            response.data.reference &&
            metadata?.order_id
          ) {
            const { Order } = require("../models");
            await Order.update(
              { paymentReference: response.data.reference },
              { where: { id: metadata.order_id } },
            );
          }

          res.json(response);
        } catch (err) {
          console.error("Error updating order reference:", err);
          // Still return the response to let them pay
          res.json(JSON.parse(data || "{}"));
        }
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

            // Safely parse metadata
            let metadata = response.data.metadata;
            if (typeof metadata === "string") {
              try {
                metadata = JSON.parse(metadata);
              } catch (e) {
                console.error("Failed to parse metadata string:", e);
                metadata = {};
              }
            }

            // Look up the order either by saved paymentReference OR metadata order_id
            let orderToUpdate = await Order.findOne({
              where: { paymentReference: reference },
            });
            if (!orderToUpdate && metadata?.order_id) {
              orderToUpdate = await Order.findByPk(metadata.order_id);
            }

            const orderId = orderToUpdate?.id;
            console.log(
              "VerifyPayment: Paystack response for ref",
              reference,
              "status:",
              response.data.status,
              "Extracted Order ID:",
              orderId,
            );

            if (orderId) {
              const { sequelize } = require("../models");
              let order;
              try {
                order = await sequelize.transaction(async (t) => {
                  const o = await Order.findByPk(orderId, {
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
                    lock: t.LOCK.UPDATE,
                    transaction: t,
                  });

                  if (o && o.paymentStatus !== "paid") {
                    // Idempotency check: ensure this reference isn't already used by ANOTHER paid order
                    const existingOrder = await Order.findOne({
                      where: {
                        paymentReference: reference,
                        paymentStatus: "paid",
                      },
                      transaction: t,
                    });
                    if (existingOrder && existingOrder.id !== o.id) {
                      return o; // Already processed by another order
                    }

                    // Update order status
                    o.paymentStatus = "paid";
                    o.paymentReference = reference;
                    o.status = "confirmed";
                    await o.save({ transaction: t });

                    // Clear user's cart after successful payment
                    const { Cart, CartItem } = require("../models");
                    const cartQuery = o.userId
                      ? { userId: o.userId }
                      : { sessionId: o.sessionId };
                    if (o.userId || o.sessionId) {
                      const cart = await Cart.findOne({
                        where: cartQuery,
                        transaction: t,
                      });
                      if (cart) {
                        await CartItem.destroy({
                          where: { cartId: cart.id },
                          transaction: t,
                        });
                        cart.totalAmount = 0;
                        await cart.save({ transaction: t });
                      }
                    }

                    // Update stock for each product in the order
                    for (const item of o.items) {
                      const product = await Product.findByPk(item.productId, {
                        lock: t.LOCK.UPDATE,
                        transaction: t,
                      });
                      if (product) {
                        // Increase soldCount and decrease remainingStock
                        product.soldCount =
                          (product.soldCount || 0) + item.quantity;
                        product.remainingStock =
                          (product.totalStock || 0) - product.soldCount;
                        await product.save({ transaction: t });
                      }
                    }

                    o.justPaid = true;
                  }
                  return o;
                });
              } catch (txError) {
                console.error("Error verifying payment transaction:", txError);
                order = await Order.findByPk(orderId); // fallback
              }

              if (order && order.justPaid) {
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
                    process.env.ADMIN_EMAIL || "diamondauragallery@gmail.com",
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
              } else if (order && order.paymentStatus === "paid") {
                // Order already paid, just return success
                return res.json({
                  success: true,
                  message: "Payment already verified",
                  order: order,
                  data: response.data,
                });
              } else {
                return res.json({
                  success: false,
                  message: "Payment verification failed during database update",
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
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET)
      .update(rawBody)
      .digest("hex");

    if (hash === req.headers["x-paystack-signature"]) {
      const event = req.body;

      if (event.event === "charge.success") {
        // Handle successful charge
        const { Order, OrderItem, Product } = require("../models");
        const reference = event.data.reference;

        let metadata = event.data.metadata;
        if (typeof metadata === "string") {
          try {
            metadata = JSON.parse(metadata);
          } catch (e) {
            console.error("Failed to parse event metadata string:", e);
            metadata = {};
          }
        }

        let targetOrder = await Order.findOne({
          where: { paymentReference: reference },
        });
        if (!targetOrder && metadata?.order_id) {
          targetOrder = await Order.findByPk(metadata.order_id);
        }

        const orderId = targetOrder?.id;

        console.log(
          "Webhook Payment successful:",
          reference,
          "Order ID:",
          orderId,
        );

        if (orderId) {
          const { sequelize } = require("../models");
          try {
            await sequelize.transaction(async (t) => {
              const order = await Order.findByPk(orderId, {
                include: [
                  {
                    model: OrderItem,
                    as: "items",
                  },
                ],
                lock: t.LOCK.UPDATE,
                transaction: t,
              });

              if (order && order.paymentStatus !== "paid") {
                // Check idempotency by reference just in case
                const existingOrder = await Order.findOne({
                  where: { paymentReference: reference, paymentStatus: "paid" },
                  transaction: t,
                });
                if (existingOrder && existingOrder.id !== order.id) {
                  console.log(
                    "Idempotency hit: reference already used by another paid order.",
                  );
                  return;
                }

                // Update order status
                order.paymentStatus = "paid";
                order.paymentReference = reference;
                order.status = "confirmed";
                await order.save({ transaction: t });

                // Clear user's cart after successful payment
                const { Cart, CartItem } = require("../models");
                if (order.userId || order.sessionId) {
                  const cartQuery = order.userId
                    ? { userId: order.userId }
                    : { sessionId: order.sessionId };

                  const cart = await Cart.findOne({
                    where: cartQuery,
                    transaction: t,
                  });
                  if (cart) {
                    await CartItem.destroy({
                      where: { cartId: cart.id },
                      transaction: t,
                    });
                    cart.totalAmount = 0;
                    await cart.save({ transaction: t });
                  }
                }

                // Update stock for each product in the order
                for (const item of order.items) {
                  const product = await Product.findByPk(item.productId, {
                    lock: t.LOCK.UPDATE,
                    transaction: t,
                  });
                  if (product) {
                    // Increase soldCount and decrease remainingStock
                    product.soldCount =
                      (product.soldCount || 0) + item.quantity;
                    product.remainingStock =
                      (product.totalStock || 0) - product.soldCount;
                    await product.save({ transaction: t });
                  }
                }

                console.log(
                  "Order updated:",
                  order.id,
                  "- Stock updated for all items",
                );
              }
            });
          } catch (txError) {
            console.error(
              "Error updating order in webhook transaction:",
              txError,
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
