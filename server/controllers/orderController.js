const {
  Order,
  OrderItem,
  Cart,
  CartItem,
  Product,
  User,
} = require("../models");
const { sendEmail, emailTemplates } = require("../config/email");

// @desc    Create new order
// @route   POST /api/orders
const createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;

    // Get user's cart with items
    const cart = await Cart.findOne({
      where: { userId: req.user.id },
      include: [
        {
          model: CartItem,
          as: "items",
          include: [{ model: Product, as: "product" }],
        },
      ],
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Calculate totals
    const subtotal = cart.items.reduce(
      (sum, item) => sum + parseFloat(item.price) * item.quantity,
      0
    );
    const shippingFee = subtotal > 50000 ? 0 : 2500; // Free shipping over GH₵50,000
    const tax = subtotal * 0.075; // 7.5% tax
    const totalAmount = subtotal + shippingFee + tax;

    // Calculate total items (sum of all quantities)
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    // Create order (payment pending for online payments, confirmed for COD)
    const order = await Order.create({
      userId: req.user.id,
      shippingAddress,
      paymentMethod: paymentMethod || "paystack",
      paymentStatus: paymentMethod === "cod" ? "pending" : "pending",
      subtotal,
      shippingFee,
      totalAmount,
      totalItems,
      status: "pending",
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

    // Clear cart after order is created
    await CartItem.destroy({ where: { cartId: cart.id } });
    cart.totalAmount = 0;
    await cart.save();

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
    console.error("Create order error:", error);
    res
      .status(500)
      .json({ message: "Error creating order", error: error.message });
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
    res
      .status(500)
      .json({ message: "Error fetching orders", error: error.message });
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
    res
      .status(500)
      .json({ message: "Error fetching order", error: error.message });
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
              (product.soldCount || 0) - item.quantity
            );
            await product.save();
          }
        }
      }
    }

    order.status = "cancelled";
    order.cancelledAt = new Date();
    order.cancelReason = reason;
    await order.save();

    res.json(order);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error cancelling order", error: error.message });
  }
};

// @desc    Track order
// @route   GET /api/orders/:id/track
const trackOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      attributes: ["status", "statusHistory", "trackingNumber", "createdAt"],
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      status: order.status,
      statusHistory: order.statusHistory,
      trackingNumber: order.trackingNumber,
      createdAt: order.createdAt,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error tracking order", error: error.message });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  trackOrder,
};
