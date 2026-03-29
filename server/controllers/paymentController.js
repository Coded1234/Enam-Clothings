const https = require("https");
const { sendEmail, emailTemplates } = require("../config/email");
const { Order, OrderItem, Product, User } = require("../models");
const { validateEmail } = require("../utils/inputValidation");
const logger = require("../config/logger");
const crypto = require("crypto");

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

const toMinorCurrencyUnits = (amount) => {
  const parsed = Number.parseFloat(amount);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
};

const getOrderPaymentEmail = (order) => {
  return (
    order?.user?.email ||
    order?.guestEmail ||
    order?.shippingAddress?.email ||
    null
  );
};

const isPaidAmountValidForOrder = (order, paidAmountMinorUnits) => {
  const expectedAmountMinorUnits = toMinorCurrencyUnits(order?.totalAmount);
  return (
    Number.isInteger(expectedAmountMinorUnits) &&
    Number.isInteger(paidAmountMinorUnits) &&
    paidAmountMinorUnits === expectedAmountMinorUnits
  );
};

const getSessionIdFromRequest = (req) => {
  const rawSessionId = req.headers["x-session-id"];
  return typeof rawSessionId === "string" ? rawSessionId.trim() : "";
};

const canVerifyOrderFromRequest = (req, order) => {
  if (!order) return false;

  const requestSessionId = getSessionIdFromRequest(req);

  if (req.user) {
    if (req.user.role === "admin") return true;
    if (order.userId && order.userId === req.user.id) return true;
    if (requestSessionId && order.sessionId === requestSessionId) return true;
    return false;
  }

  return Boolean(requestSessionId && order.sessionId === requestSessionId);
};

const sanitizeOrderForClient = (order) => {
  if (!order) return null;

  const fallbackEmail =
    order.user?.email ||
    order.guestEmail ||
    order.shippingAddress?.email ||
    null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    totalAmount: order.totalAmount,
    totalItems:
      order.totalItems || (Array.isArray(order.items) ? order.items.length : 0),
    status: order.status,
    paymentStatus: order.paymentStatus,
    shippingAddress: {
      email: fallbackEmail,
    },
  };
};

// Check if Paystack is configured
if (!PAYSTACK_SECRET || PAYSTACK_SECRET.includes("your_")) {
  logger.warn(
    "⚠️  WARNING: Paystack not configured! Please add PAYSTACK_SECRET_KEY to .env file",
  );
  logger.warn(
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

    const orderId = metadata?.order_id;
    if (!orderId) {
      return res.status(400).json({
        status: false,
        message: "metadata.order_id is required",
      });
    }

    const order = await Order.findByPk(orderId, {
      include: [{ model: User, as: "user", attributes: ["id", "email"] }],
    });

    if (!order) {
      return res.status(404).json({
        status: false,
        message: "Order not found",
      });
    }

    if (!canVerifyOrderFromRequest(req, order)) {
      return res.status(403).json({
        status: false,
        message: "Not authorized to initialize payment for this order",
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        status: false,
        message: "Order is already paid",
      });
    }

    const trustedAmountMinorUnits = toMinorCurrencyUnits(order.totalAmount);
    if (
      !Number.isInteger(trustedAmountMinorUnits) ||
      trustedAmountMinorUnits <= 0
    ) {
      return res.status(400).json({
        status: false,
        message: "Invalid order amount",
      });
    }

    if (amount !== undefined && amount !== null && amount !== "") {
      const clientAmountMinorUnits = toMinorCurrencyUnits(amount);
      if (
        !Number.isInteger(clientAmountMinorUnits) ||
        clientAmountMinorUnits !== trustedAmountMinorUnits
      ) {
        return res.status(400).json({
          status: false,
          message: "Amount mismatch for this order",
        });
      }
    }

    const fallbackEmail = getOrderPaymentEmail(order);
    const effectiveEmail = fallbackEmail || email;
    const emailCheck = validateEmail(effectiveEmail);
    if (!emailCheck.ok) {
      return res.status(400).json({
        status: false,
        message: "Order does not have a valid payment email",
      });
    }

    const callbackBaseUrl = process.env.CLIENT_URL || "http://localhost:3000";

    const sanitizedMetadata = {
      ...(metadata || {}),
      order_id: order.id,
    };

    const params = JSON.stringify({
      email: emailCheck.email,
      amount: trustedAmountMinorUnits,
      metadata: sanitizedMetadata,
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
            order?.id
          ) {
            const { Order } = require("../models");
            await Order.update(
              { paymentReference: response.data.reference },
              { where: { id: order.id } },
            );
          }

          res.json(response);
        } catch (err) {
          logger.error("Error updating order reference", {
            error: err.message,
          });
          // Still return the response to let them pay
          res.json(JSON.parse(data || "{}"));
        }
      });
    });

    paystackReq.on("error", (error) => {
      logger.error("Paystack initialize transport error", {
        error: error.message,
      });
      res.status(500).json({
        status: false,
        message: "Payment initialization failed",
      });
    });

    paystackReq.write(params);
    paystackReq.end();
  } catch (error) {
    logger.error("Payment initialization error", { error: error.message });
    res.status(500).json({
      status: false,
      message: "Payment initialization failed",
    });
  }
};

// @desc    Verify payment
// @route   GET /api/payment/verify/:reference
const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;
    const requestSessionId = getSessionIdFromRequest(req);

    if (!req.user && !requestSessionId) {
      return res.status(401).json({
        success: false,
        message: "Authentication or session is required to verify payment",
      });
    }

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
                logger.warn("Failed to parse payment metadata string", {
                  error: e.message,
                });
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

            if (!orderToUpdate) {
              return res.status(404).json({
                success: false,
                message: "Order not found for this payment reference",
              });
            }

            if (!canVerifyOrderFromRequest(req, orderToUpdate)) {
              return res.status(403).json({
                success: false,
                message: "Not authorized to verify this payment reference",
              });
            }

            const paidAmountMinorUnits = Number(response.data.amount);
            const expectedAmountMinorUnits = toMinorCurrencyUnits(
              orderToUpdate.totalAmount,
            );

            if (
              !isPaidAmountValidForOrder(orderToUpdate, paidAmountMinorUnits)
            ) {
              logger.warn("Payment verification amount mismatch", {
                reference,
                orderId: orderToUpdate.id,
                paidAmountMinorUnits,
                expectedAmountMinorUnits,
              });

              return res.status(400).json({
                success: false,
                message: "Paid amount does not match order total",
              });
            }

            const orderId = orderToUpdate.id;
            logger.info("Verify payment response received", {
              reference,
              status: response.data.status,
              orderId,
            });

            if (orderId) {
              const { sequelize } = require("../models");
              let order;
              let justPaid = false;
              try {
                const finalOrder = await sequelize.transaction(async (t) => {
                  const o = await Order.findByPk(orderId, {
                    lock: t.LOCK.UPDATE,
                    transaction: t,
                  });

                  if (o && o.paymentStatus !== "paid") {
                    // Fetch items manually to avoid PostgreSQL outer join lock error
                    const items = await OrderItem.findAll({
                      where: { orderId: o.id },
                      transaction: t,
                    });
                    o.items = items;
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

                    // Clear carts after successful payment.
                    // We clear both when available to handle authenticated orders
                    // created from a session-cart fallback.
                    const { Cart, CartItem } = require("../models");
                    const clearCartByQuery = async (whereClause) => {
                      const cart = await Cart.findOne({
                        where: whereClause,
                        transaction: t,
                      });
                      if (!cart) return;

                      await CartItem.destroy({
                        where: { cartId: cart.id },
                        transaction: t,
                      });
                      cart.totalAmount = 0;
                      await cart.save({ transaction: t });
                    };

                    if (o.userId) {
                      await clearCartByQuery({ userId: o.userId });
                    }
                    if (o.sessionId) {
                      await clearCartByQuery({ sessionId: o.sessionId });
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

                if (finalOrder && finalOrder.justPaid) {
                  justPaid = true;
                }
              } catch (txError) {
                logger.error("Error verifying payment transaction", {
                  error: txError.message,
                });
              }

              // Fetch the full order including user for emails and response
              order = await Order.findByPk(orderId, {
                include: [
                  { model: OrderItem, as: "items" },
                  { model: User, as: "user" },
                ],
              });
              if (order && justPaid) order.justPaid = true;

              if (order && order.justPaid) {
                // Send confirmation email
                try {
                  // To Customer
                  const template = emailTemplates.orderConfirmation(
                    order,
                    order.user,
                  );
                  // Use guestEmail if user is null
                  const recipientEmail = order.user
                    ? order.user.email
                    : order.guestEmail || order.shippingAddress?.email;
                  if (recipientEmail) {
                    await sendEmail(
                      recipientEmail,
                      template.subject,
                      template.html,
                    );
                  }

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
                  logger.error("Error sending payment confirmation emails", {
                    error: emailError.message,
                  });
                }

                return res.json({
                  success: true,
                  message: "Payment verified successfully",
                  order: sanitizeOrderForClient(order),
                });
              } else if (order && order.paymentStatus === "paid") {
                // Order already paid, just return success
                return res.json({
                  success: true,
                  message: "Payment already verified",
                  order: sanitizeOrderForClient(order),
                });
              } else {
                return res.json({
                  success: false,
                  message: "Payment verification failed during database update",
                  order: sanitizeOrderForClient(order),
                });
              }
            }
          }

          res.json({
            success: false,
            message: response.message || "Payment verification failed",
          });
        } catch (parseError) {
          logger.error("Error parsing Paystack verification response", {
            error: parseError.message,
          });
          res.status(500).json({
            success: false,
            message: "Error processing payment verification",
          });
        }
      });
    });

    paystackReq.on("error", (error) => {
      logger.error("Paystack verify transport error", { error: error.message });
      res.status(500).json({
        success: false,
        message: "Payment verification failed",
      });
    });

    paystackReq.end();
  } catch (error) {
    logger.error("Verify payment error", { error: error.message });
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
};

// @desc    Paystack webhook
// @route   POST /api/payment/webhook
const paystackWebhook = async (req, res) => {
  try {
    if (!PAYSTACK_SECRET || PAYSTACK_SECRET.includes("your_")) {
      logger.warn("Webhook received while Paystack is not configured");
      return res.sendStatus(503);
    }

    const rawBody = req.rawBody || JSON.stringify(req.body);
    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET)
      .update(rawBody)
      .digest("hex");

    const signature = String(req.headers["x-paystack-signature"] || "");
    const hashBuffer = Buffer.from(hash, "hex");
    const sigBuffer = Buffer.from(signature, "hex");

    const isValidSignature =
      hashBuffer.length === sigBuffer.length &&
      crypto.timingSafeEqual(hashBuffer, sigBuffer);

    if (isValidSignature) {
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
            logger.warn("Failed to parse webhook metadata string", {
              error: e.message,
            });
            metadata = {};
          }
        }

        let targetOrder = await Order.findOne({
          where: { paymentReference: reference },
        });
        if (!targetOrder && metadata?.order_id) {
          targetOrder = await Order.findByPk(metadata.order_id);
        }

        if (targetOrder) {
          const paidAmountMinorUnits = Number(event.data.amount);
          const expectedAmountMinorUnits = toMinorCurrencyUnits(
            targetOrder.totalAmount,
          );

          if (!isPaidAmountValidForOrder(targetOrder, paidAmountMinorUnits)) {
            logger.warn("Webhook amount mismatch", {
              reference,
              orderId: targetOrder.id,
              paidAmountMinorUnits,
              expectedAmountMinorUnits,
            });
            return res.sendStatus(200);
          }
        }

        const orderId = targetOrder?.id;

        logger.info("Webhook charge.success received", {
          reference,
          orderId,
        });

        if (orderId) {
          const { sequelize } = require("../models");
          try {
            await sequelize.transaction(async (t) => {
              const order = await Order.findByPk(orderId, {
                lock: t.LOCK.UPDATE,
                transaction: t,
              });

              if (order && order.paymentStatus !== "paid") {
                // Fetch items manually to avoid PostgreSQL outer join lock error
                order.items = await OrderItem.findAll({
                  where: { orderId: order.id },
                  transaction: t,
                });
                // Check idempotency by reference just in case
                const existingOrder = await Order.findOne({
                  where: { paymentReference: reference, paymentStatus: "paid" },
                  transaction: t,
                });
                if (existingOrder && existingOrder.id !== order.id) {
                  logger.warn("Webhook idempotency hit on payment reference", {
                    reference,
                    existingOrderId: existingOrder.id,
                  });
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

                logger.info("Order updated from webhook", {
                  orderId: order.id,
                  paymentReference: reference,
                });
              }
            });
          } catch (txError) {
            logger.error("Error updating order in webhook transaction", {
              error: txError.message,
            });
          }
        }
      }
    } else {
      logger.warn("Invalid webhook signature");
    }

    res.sendStatus(200);
  } catch (error) {
    logger.error("Webhook error", { error: error.message });
    res.sendStatus(500);
  }
};

module.exports = {
  initializePayment,
  verifyPayment,
  paystackWebhook,
};
