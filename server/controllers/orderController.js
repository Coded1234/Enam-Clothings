const {
  Order,
  OrderItem,
  Cart,
  CartItem,
  Product,
  User,
  Coupon,
  CouponUsage,
} = require("../models");
const { sendEmail, emailTemplates } = require("../config/email");
const logger = require("../config/logger");
const { computeShippingQuote } = require("./shippingController");

// @desc    Create new order
// @route   POST /api/orders
const createOrder = async (req, res) => {
  try {
    const {
      shippingAddress,
      couponId,
      shippingDetails,
      guestEmail,
      guestName,
      sessionId,
    } = req.body;

    // Determine user or session
    const userId = req.user ? req.user.id : null;
    const headerSessionId =
      typeof req.headers["x-session-id"] === "string"
        ? req.headers["x-session-id"].trim()
        : "";
    const bodySessionId = typeof sessionId === "string" ? sessionId.trim() : "";
    const activeSessionId = headerSessionId || bodySessionId;

    if (!userId && !activeSessionId) {
      return res
        .status(400)
        .json({ message: "No active session or user found." });
    }

    const cartInclude = [
      {
        model: CartItem,
        as: "items",
        include: [{ model: Product, as: "product" }],
      },
    ];

    // Prefer authenticated cart; fallback to session cart if user cart is empty.
    let cart = await Cart.findOne({
      where: userId ? { userId } : { sessionId: activeSessionId },
      include: cartInclude,
    });

    let usedSessionFallback = false;
    if (
      userId &&
      activeSessionId &&
      (!cart || !cart.items || cart.items.length === 0)
    ) {
      const sessionCart = await Cart.findOne({
        where: { sessionId: activeSessionId },
        include: cartInclude,
      });

      if (sessionCart && sessionCart.items && sessionCart.items.length > 0) {
        cart = sessionCart;
        usedSessionFallback = true;
      }
    }

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        message: "Cart is empty",
        details: {
          hasAuthenticatedUser: Boolean(userId),
          hasSessionId: Boolean(activeSessionId),
        },
      });
    }

    // Calculate totals
    const subtotal = cart.items.reduce(
      (sum, item) => sum + parseFloat(item.price) * item.quantity,
      0,
    );

    // Shipping fee is always computed server-side to prevent client tampering.
    let shippingFee = subtotal >= 1000 ? 0 : 50;
    let serverShippingDetails =
      subtotal >= 1000
        ? {
            carrier: "Free Shipping",
            serviceType: "free",
            estimatedDeliveryTime: "Varies",
          }
        : null;

    if (subtotal < 1000) {
      try {
        const shippingQuote = await computeShippingQuote({
          address: shippingAddress?.address,
          city: shippingAddress?.city,
          postalCode: shippingAddress?.postalCode,
          phone: shippingAddress?.phone,
        });

        if (
          shippingQuote &&
          Number.isFinite(Number(shippingQuote.shippingFee))
        ) {
          shippingFee = Math.max(0, Number(shippingQuote.shippingFee));
          serverShippingDetails = {
            carrier: shippingQuote.carrier,
            serviceType: shippingQuote.serviceType,
            estimatedDeliveryTime: shippingQuote.estimatedDeliveryTime,
            distance: shippingQuote.distance,
            destinationCoords: shippingQuote.destinationCoords,
          };
          if (shippingQuote.fallback) {
            serverShippingDetails.fallback = true;
          }
        }
      } catch (shippingError) {
        logger.warn(
          "Shipping quote failed during order creation, using fallback fee",
          {
            error: shippingError.message,
          },
        );
      }
    }

    // Discount is always computed server-side from coupon rules.
    let discountAmount = 0;
    if (couponId !== undefined && couponId !== null && couponId !== "") {
      let couponNumericId = null;
      if (Number.isInteger(couponId) && couponId > 0) {
        couponNumericId = couponId;
      } else if (
        typeof couponId === "string" &&
        /^\d+$/.test(couponId.trim())
      ) {
        couponNumericId = Number(couponId.trim());
      }

      if (!couponNumericId) {
        return res.status(400).json({ message: "Invalid coupon identifier" });
      }

      const coupon = await Coupon.findByPk(couponNumericId);
      if (!coupon) {
        return res.status(404).json({ message: "Invalid coupon code" });
      }

      const validityCheck = coupon.isValid();
      if (!validityCheck.valid) {
        return res.status(400).json({ message: validityCheck.message });
      }

      if (userId && coupon.usage_limit_per_user) {
        const userUsageCount = await CouponUsage.count({
          where: { coupon_id: coupon.id, user_id: userId },
        });

        if (userUsageCount >= coupon.usage_limit_per_user) {
          return res.status(400).json({
            message:
              "You have already used this coupon the maximum number of times",
          });
        }
      }

      const discountResult = coupon.calculateDiscount(subtotal);
      if (!discountResult.valid) {
        return res.status(400).json({ message: discountResult.message });
      }

      discountAmount = discountResult.discount;
    }

    const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

    // Keep non-financial shipping metadata while ignoring client-provided totals.
    let clientShippingDetails = null;
    if (
      shippingDetails &&
      typeof shippingDetails === "object" &&
      !Array.isArray(shippingDetails)
    ) {
      clientShippingDetails = { ...shippingDetails };
      delete clientShippingDetails.shippingFee;
      delete clientShippingDetails.discount;
      delete clientShippingDetails.totalAmount;
      delete clientShippingDetails.price;
    }

    const sanitizedShippingDetails =
      clientShippingDetails || serverShippingDetails
        ? {
            ...(clientShippingDetails || {}),
            ...(serverShippingDetails || {}),
          }
        : null;

    // Calculate total items (sum of all quantities)
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    // Create order with online payment
    const order = await Order.create({
      userId,
      // Preserve sessionId when we intentionally used the session cart fallback.
      sessionId: userId
        ? usedSessionFallback
          ? activeSessionId
          : null
        : activeSessionId,
      guestEmail: userId ? null : guestEmail || shippingAddress?.email,
      guestName: userId
        ? null
        : guestName ||
          `${shippingAddress?.firstName || ""} ${shippingAddress?.lastName || ""}`.trim(),
      shippingAddress,
      paymentMethod: "paystack",
      paymentStatus: "pending",
      subtotal,
      shippingFee,
      discount: discountAmount,
      totalAmount,
      totalItems,
      status: "pending",
      shippingDetails: sanitizedShippingDetails,
    });

    // Create order items
    for (const item of cart.items) {
      // Get product image - ensure it's a string
      let productImage = null;
      if (item.product.images && item.product.images.length > 0) {
        const firstImage = item.product.images[0];
        productImage =
          typeof firstImage === "string" ? firstImage : firstImage?.url || null;
      }

      await OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        productName: item.product.name,
        productImage: productImage,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        price: item.price,
      });

      // Don't update stock yet - wait for payment confirmation
    }

    // DON'T clear cart yet - only clear after successful payment
    // Cart will be cleared in payment verification for online payments

    // Get populated order
    const populatedOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [{ model: Product, as: "product" }],
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "email"],
        },
      ],
    });

    res.status(201).json(populatedOrder);
  } catch (error) {
    logger.error("Create order error", { error: error.message });
    res.status(500).json({ message: "Error creating order" });
  }
};

// @desc    Get user orders
// @route   GET /api/orders
const getUserOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const where = { userId: req.user.id };
    if (status) where.status = status;

    const offset = (Number(page) - 1) * Number(limit);

    const { rows: orders, count: total } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "images"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      offset,
      limit: Number(limit),
    });

    res.json({
      orders,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders" });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [{ model: Product, as: "product" }],
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "email"],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user owns order or is admin
    if (order.userId !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to view this order" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error fetching order" });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, as: "items" }],
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check ownership
    if (order.userId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Can only cancel pending or confirmed orders
    if (!["pending", "confirmed"].includes(order.status)) {
      return res
        .status(400)
        .json({ message: "Cannot cancel order at this stage" });
    }

    // Only restore stock if order was confirmed (stock was deducted)
    // Pending orders don't have stock deducted yet
    if (order.status === "confirmed") {
      for (const item of order.items) {
        const product = await Product.findByPk(item.productId);
        if (product) {
          const sizes = JSON.parse(JSON.stringify(product.sizes || []));
          const sizeIndex = sizes.findIndex((s) => s.size === item.size);
          if (sizeIndex > -1) {
            sizes[sizeIndex].stock += item.quantity;
            product.set("sizes", sizes);
            product.soldCount = Math.max(
              0,
              (product.soldCount || 0) - item.quantity,
            );
            product.remainingStock =
              (product.totalStock || 0) - product.soldCount;
            await product.save();
          }
        }
      }
    }

    order.status = "cancelled";
    order.cancelledAt = new Date();
    order.cancelReason = reason;
    await order.save();

    // Notify Admin about cancellation
    try {
      const adminTemplate = emailTemplates.adminOrderCancellation(
        order,
        req.user,
        reason,
      );
      await sendEmail(
        process.env.ADMIN_EMAIL || "diamondauragallery@gmail.com",
        adminTemplate.subject,
        adminTemplate.html,
      );
    } catch (emailError) {
      logger.error("Error sending cancellation email to admin", {
        error: emailError.message,
      });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error cancelling order" });
  }
};

// @desc    Track order
// @route   GET /api/orders/:id/track
const trackOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      attributes: [
        "status",
        "statusHistory",
        "trackingNumber",
        "createdAt",
        "userId",
      ],
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.userId !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to view tracking info" });
    }

    res.json({
      status: order.status,
      statusHistory: order.statusHistory,
      trackingNumber: order.trackingNumber,
      createdAt: order.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: "Error tracking order" });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  trackOrder,
};
