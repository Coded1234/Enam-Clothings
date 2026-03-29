const {
  User,
  Product,
  Order,
  OrderItem,
  Review,
  sequelize,
  Newsletter,
} = require("../models");
const { Op } = require("sequelize");
const { cloudinary, isCloudinaryConfigured } = require("../config/cloudinary");
const { sendEmail, sendBulkEmail, emailTemplates } = require("../config/email");
const logger = require("../config/logger");
const { invalidateProductCache } = require("./productController");

// ============ DASHBOARD ============

// @desc    Get dashboard stats
// @route   GET /api/admin/dashboard
const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1,
    );
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // Basic counts
    const totalProducts = await Product.count();
    const totalOrders = await Order.count();
    const totalCustomers = await User.count({ where: { role: "customer" } });

    const salesWhere = { paymentStatus: "paid" };

    // Revenue
    const revenueResult = await Order.findAll({
      where: salesWhere,
      attributes: [
        [sequelize.fn("SUM", sequelize.col("total_amount")), "total"],
      ],
      raw: true,
    });
    const totalRevenue = parseFloat(revenueResult[0]?.total) || 0;

    // This month stats
    const monthlyOrders = await Order.count({
      where: { createdAt: { [Op.gte]: startOfMonth } },
    });

    const monthlyRevenueResult = await Order.findAll({
      where: {
        ...salesWhere,
        createdAt: { [Op.gte]: startOfMonth },
      },
      attributes: [
        [sequelize.fn("SUM", sequelize.col("total_amount")), "total"],
      ],
      raw: true,
    });
    const monthlyRevenue = parseFloat(monthlyRevenueResult[0]?.total) || 0;

    // Last month for comparison
    const lastMonthRevenueResult = await Order.findAll({
      where: {
        ...salesWhere,
        createdAt: { [Op.between]: [startOfLastMonth, endOfLastMonth] },
      },
      attributes: [
        [sequelize.fn("SUM", sequelize.col("total_amount")), "total"],
      ],
      raw: true,
    });
    const lastMonthRevenue = parseFloat(lastMonthRevenueResult[0]?.total) || 0;

    // Revenue change percentage
    const revenueChange =
      lastMonthRevenue > 0
        ? (
            ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) *
            100
          ).toFixed(1)
        : 100;

    // Recent orders
    const recentOrders = await Order.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: 5,
    });

    // Order status distribution
    const ordersByStatus = await Order.findAll({
      attributes: [
        "status",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["status"],
      raw: true,
    });

    // Top selling products
    const topProducts = await Product.findAll({
      order: [["soldCount", "DESC"]],
      limit: 5,
      attributes: ["id", "name", "images", "price", "soldCount"],
    });

    // Low stock products
    const lowStockProducts = await Product.findAll({
      where: { totalStock: { [Op.lte]: 10 } },
      attributes: ["id", "name", "images", "totalStock"],
      limit: 5,
    });

    res.json({
      stats: {
        totalProducts,
        totalOrders,
        totalCustomers,
        totalRevenue,
        monthlyOrders,
        monthlyRevenue,
        revenueChange,
      },
      recentOrders,
      ordersByStatus: ordersByStatus.map((o) => ({
        _id: o.status,
        count: parseInt(o.count),
      })),
      topProducts,
      lowStockProducts,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching dashboard stats",
      error: error.message,
    });
  }
};

// ============ PRODUCTS ============

// @desc    Create product
// @route   POST /api/admin/products
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      comparePrice,
      originalPrice,
      brand,
      category,
      categoryId,
      subcategory,
      totalStock,
      featured,
      isActive,
      sizes,
      colors,
      status,
    } = req.body;
    const productData = {
      name,
      description,
      price,
      comparePrice,
      originalPrice,
      brand,
      category,
      categoryId,
      subcategory,
      totalStock,
      featured,
      isActive,
      sizes,
      colors,
      status,
    };
    Object.keys(productData).forEach(
      (key) => productData[key] === undefined && delete productData[key],
    );

    // Handle images from multer (file uploads)
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map((file) => {
        // For Cloudinary, file.path is the URL. For local storage, we need to construct URL
        const imageUrl = isCloudinaryConfigured
          ? file.path
          : `/uploads/products/${file.filename}`;
        return {
          url: imageUrl,
          publicId: file.filename,
        };
      });
    }

    // Handle images array from JSON body (URL strings or objects)
    if (req.body.images && Array.isArray(req.body.images)) {
      productData.images = req.body.images.map((img) => {
        if (typeof img === "string") {
          return { url: img, publicId: "" };
        }
        return img;
      });
    }

    // Parse sizes and colors if they're strings
    if (typeof productData.sizes === "string") {
      try {
        productData.sizes = JSON.parse(productData.sizes);
      } catch (e) {
        productData.sizes = [];
      }
    }
    if (typeof productData.colors === "string") {
      try {
        productData.colors = JSON.parse(productData.colors);
      } catch (e) {
        productData.colors = [];
      }
    }

    // Parse boolean fields from FormData (they come as strings)
    if (typeof productData.isActive === "string") {
      productData.isActive = productData.isActive === "true";
    }
    if (typeof productData.featured === "string") {
      productData.featured = productData.featured === "true";
    }

    // Parse numeric fields
    if (productData.price) {
      productData.price = parseFloat(productData.price);
    }
    if (productData.comparePrice) {
      productData.comparePrice = parseFloat(productData.comparePrice);
    }
    if (productData.originalPrice) {
      productData.originalPrice = parseFloat(productData.originalPrice);
    }
    if (productData.totalStock) {
      productData.totalStock = parseInt(productData.totalStock) || 0;
    }

    // Set remainingStock equal to totalStock for new products (soldCount is 0)
    productData.remainingStock = productData.totalStock || 0;
    productData.soldCount = 0;

    // Enforce featured products limit of 4
    if (productData.featured === true) {
      const featuredCount = await Product.count({ where: { featured: true } });
      if (featuredCount >= 4) {
        // Find the oldest featured product and remove featured status
        const oldestFeatured = await Product.findOne({
          where: { featured: true },
          order: [["createdAt", "ASC"]],
        });
        if (oldestFeatured) {
          oldestFeatured.featured = false;
          await oldestFeatured.save();
        }
      }
    }

    const product = await Product.create(productData);
    invalidateProductCache();

    // Notify newsletter subscribers
    try {
      const subscribers = await Newsletter.findAll({
        where: { isSubscribed: true },
        attributes: ["email"],
      });

      if (subscribers.length > 0) {
        const recipientEmails = subscribers.map((s) => s.email);
        const template = emailTemplates.newsletterNewProduct(product);

        // Send asynchronously without awaiting to not block response
        sendBulkEmail(recipientEmails, template.subject, template.html);
      }
    } catch (emailError) {
      logger.error("Error sending newsletter", { error: emailError.message });
    }

    res.status(201).json(product);
  } catch (error) {
    logger.error("Create product error", { error: error.message });
    res
      .status(500)
      .json({ message: "Error creating product", error: error.message });
  }
};

// @desc    Update product
// @route   PUT /api/admin/products/:id
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const {
      name,
      description,
      price,
      comparePrice,
      originalPrice,
      brand,
      category,
      categoryId,
      subcategory,
      totalStock,
      featured,
      isActive,
      sizes,
      colors,
    } = req.body;
    const updateData = {
      name,
      description,
      price,
      comparePrice,
      originalPrice,
      brand,
      category,
      categoryId,
      subcategory,
      totalStock,
      featured,
      isActive,
      sizes,
      colors,
    };
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key],
    );
    let images = [];

    // Handle existing images (kept from form)
    if (req.body.existingImages) {
      try {
        const existing =
          typeof req.body.existingImages === "string"
            ? JSON.parse(req.body.existingImages)
            : req.body.existingImages;
        images = existing.map((img) => {
          if (typeof img === "string") {
            return { url: img, publicId: "" };
          }
          if (img && typeof img === "object") {
            const publicId = img.publicId || img.public_id || "";
            const resolvedUrl =
              img.url ||
              img.path ||
              img.secure_url ||
              (!isCloudinaryConfigured && publicId
                ? `/uploads/products/${publicId}`
                : "");

            return {
              ...img,
              url: resolvedUrl,
              publicId,
            };
          }

          return { url: "", publicId: "" };
        });
      } catch (e) {
        logger.error("Error parsing existingImages", { error: e.message });
      }
    }

    // Handle new images from file upload
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => {
        const imageUrl = isCloudinaryConfigured
          ? file.path
          : `/uploads/products/${file.filename}`;
        return {
          url: imageUrl,
          publicId: file.filename,
        };
      });
      images = [...images, ...newImages];
    }

    // Set final images array
    if (images.length > 0 || req.body.existingImages !== undefined) {
      updateData.images = images;
    }

    // Parse sizes and colors if they're strings
    if (typeof updateData.sizes === "string") {
      try {
        updateData.sizes = JSON.parse(updateData.sizes);
      } catch (e) {}
    }
    if (typeof updateData.colors === "string") {
      try {
        updateData.colors = JSON.parse(updateData.colors);
      } catch (e) {}
    }

    if (updateData.price !== undefined) {
      updateData.price = parseFloat(updateData.price);
    }
    if (
      updateData.comparePrice !== undefined &&
      updateData.comparePrice !== ""
    ) {
      updateData.comparePrice = parseFloat(updateData.comparePrice);
    }
    if (
      updateData.originalPrice !== undefined &&
      updateData.originalPrice !== ""
    ) {
      updateData.originalPrice = parseFloat(updateData.originalPrice);
    }

    // Remove existingImages from updateData (it's not a model field)
    delete updateData.existingImages;

    // Handle stock updates - admin edits absolute total stock.
    // remainingStock is derived from totalStock minus already sold units.
    if (updateData.totalStock !== undefined) {
      const parsedTotalStock = parseInt(updateData.totalStock, 10);
      const currentSoldCount = product.soldCount || 0;
      const newTotalStock = Number.isNaN(parsedTotalStock)
        ? 0
        : Math.max(0, parsedTotalStock);

      // Save exactly what admin entered as total stock.
      updateData.totalStock = newTotalStock;

      // Remaining stock cannot be negative.
      updateData.remainingStock = Math.max(0, newTotalStock - currentSoldCount);
    }

    // Enforce featured products limit of 4
    if (updateData.featured === true && product.featured === false) {
      const featuredCount = await Product.count({ where: { featured: true } });
      if (featuredCount >= 4) {
        // Find the oldest featured product and remove featured status
        const oldestFeatured = await Product.findOne({
          where: { featured: true },
          order: [["createdAt", "ASC"]],
        });
        if (oldestFeatured) {
          oldestFeatured.featured = false;
          await oldestFeatured.save();
        }
      }
    }

    await product.update(updateData);
    await product.reload();
    invalidateProductCache();

    res.json(product);
  } catch (error) {
    logger.error("Update product error", { error: error.message });
    res
      .status(500)
      .json({ message: "Error updating product", error: error.message });
  }
};

// @desc    Delete product
// @route   DELETE /api/admin/products/:id
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Delete images from cloudinary
    if (product.images && Array.isArray(product.images)) {
      for (const image of product.images) {
        if (isCloudinaryConfigured && image.publicId) {
          try {
            await cloudinary.uploader.destroy(image.publicId);
          } catch (imageError) {
            logger.warn("Failed to remove product image from Cloudinary", {
              productId: product.id,
              publicId: image.publicId,
              error: imageError.message,
            });
          }
        }
      }
    }

    await product.destroy();
    invalidateProductCache();
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    logger.error("Delete product error", { error: error.message });
    res
      .status(500)
      .json({ message: "Error deleting product", error: error.message });
  }
};

// @desc    Update stock
// @route   PUT /api/admin/products/:id/stock
const updateStock = async (req, res) => {
  try {
    const { sizes } = req.body;

    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const normalizedSizes = Array.isArray(sizes) ? sizes : [];

    // Normalize to objects with stock numbers.
    const sanitizedSizes = normalizedSizes.map((s) => {
      if (typeof s === "string") return { size: s, stock: 0 };
      return {
        ...s,
        stock: Number.isFinite(Number(s?.stock)) ? Number(s.stock) : 0,
      };
    });

    const newRemainingStock = sanitizedSizes.reduce(
      (sum, s) => sum + Math.max(0, Number(s.stock) || 0),
      0,
    );

    product.sizes = sanitizedSizes;
    product.remainingStock = newRemainingStock;
    product.totalStock = newRemainingStock + (product.soldCount || 0);

    await product.save();
    invalidateProductCache();

    res.json(product);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating stock", error: error.message });
  }
};

// @desc    Delete product image
// @route   DELETE /api/admin/products/:id/images/:publicId
const deleteProductImage = async (req, res) => {
  try {
    const { id, publicId } = req.params;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Delete from cloudinary when enabled.
    if (isCloudinaryConfigured) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (imageError) {
        logger.warn("Failed to remove product image from Cloudinary", {
          productId: product.id,
          publicId,
          error: imageError.message,
        });
      }
    }

    // Remove from product
    product.images = (product.images || []).filter(
      (img) => img.publicId !== publicId,
    );
    await product.save();
    invalidateProductCache();

    res.json(product);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting image", error: error.message });
  }
};

// ============ ORDERS ============

// @desc    Get all orders (admin)
// @route   GET /api/admin/orders
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;

    const where = {};
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { rows: orders, count: total } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "images"],
              required: false,
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      offset,
      limit: Number(limit),
      distinct: true,
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

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
const updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingNumber, note } = req.body;

    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        { model: OrderItem, as: "items" },
      ],
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const previousStatus = order.status;
    const stockDeductedStatuses = ["confirmed", "shipped", "delivered"];
    let productsMutated = false;

    // Handle stock changes based on status transitions
    if (previousStatus !== status) {
      const wasStockDeducted = stockDeductedStatuses.includes(previousStatus);
      const shouldDeductStock = stockDeductedStatuses.includes(status);

      // DEDUCT stock: Moving from pending/cancelled to confirmed/shipped/delivered
      if (!wasStockDeducted && shouldDeductStock) {
        for (const item of order.items) {
          const product = await Product.findByPk(item.productId);
          if (product) {
            // Update soldCount regardless of size
            product.soldCount = (product.soldCount || 0) + item.quantity;

            // Also update size-specific stock if size exists
            if (item.size) {
              const sizes = JSON.parse(JSON.stringify(product.sizes || []));
              const sizeIndex = sizes.findIndex((s) => s.size === item.size);
              if (sizeIndex > -1) {
                // Check if enough stock
                if (sizes[sizeIndex].stock < item.quantity) {
                  return res.status(400).json({
                    message: `Insufficient stock for ${product.name} (Size: ${item.size}). Available: ${sizes[sizeIndex].stock}, Required: ${item.quantity}`,
                  });
                }
                sizes[sizeIndex].stock -= item.quantity;
                product.set("sizes", sizes);
              }
            }

            // Update remainingStock
            product.remainingStock =
              (product.totalStock || 0) - product.soldCount;
            await product.save();
            productsMutated = true;
            logger.info("Updated soldCount after status transition", {
              productId: product.id,
              quantityDelta: item.quantity,
              soldCount: product.soldCount,
            });
          }
        }
      }

      // RESTORE stock: Moving from confirmed/shipped/delivered to pending or cancelled
      if (
        wasStockDeducted &&
        (status === "pending" || status === "cancelled")
      ) {
        for (const item of order.items) {
          const product = await Product.findByPk(item.productId);
          if (product) {
            // Update soldCount regardless of size
            product.soldCount = Math.max(
              0,
              (product.soldCount || 0) - item.quantity,
            );

            // Also update size-specific stock if size exists
            if (item.size) {
              const sizes = JSON.parse(JSON.stringify(product.sizes || []));
              const sizeIndex = sizes.findIndex((s) => s.size === item.size);
              if (sizeIndex > -1) {
                sizes[sizeIndex].stock += item.quantity;
                product.set("sizes", sizes);
              }
            }

            // Update remainingStock
            product.remainingStock =
              (product.totalStock || 0) - product.soldCount;
            await product.save();
            productsMutated = true;
            logger.info("Restored soldCount after status rollback", {
              productId: product.id,
              quantityDelta: -item.quantity,
              soldCount: product.soldCount,
            });
          }
        }
      }

      // Set cancelled timestamp
      if (status === "cancelled") {
        order.cancelledAt = new Date();
      } else if (previousStatus === "cancelled") {
        order.cancelledAt = null;
        order.cancelReason = null;
      }
    }

    order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;

    if (status === "delivered") {
      order.deliveredAt = new Date();
    }

    await order.save();

    if (productsMutated) {
      invalidateProductCache();
    }

    // Send status update email
    try {
      const { subject, html } = emailTemplates.orderStatusUpdate(
        order,
        order.user,
      );
      await sendEmail(order.user.email, subject, html);
    } catch (emailError) {
      logger.error("Status update email failed", { error: emailError.message });
    }

    res.json(order);
  } catch (error) {
    logger.error("Error updating order status", { error: error.message });
    res
      .status(500)
      .json({ message: "Error updating order status", error: error.message });
  }
};

// @desc    Update return approval status
// @route   PUT /api/admin/orders/:id/return-approval
const updateReturnApproval = async (req, res) => {
  try {
    const { returnApprovalStatus } = req.body;
    const normalized = String(returnApprovalStatus || "")
      .toLowerCase()
      .trim();

    const allowed = new Set(["pending", "approved", "not_approved"]);
    if (!allowed.has(normalized)) {
      return res.status(400).json({
        message:
          "Invalid returnApprovalStatus. Use pending, approved, or not_approved.",
      });
    }

    const order = await Order.findByPk(req.params.id, {
      include: [
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

    // If admin sets a decision, ensure a request timestamp exists.
    if (!order.returnRequestedAt) {
      order.returnRequestedAt = new Date();
    }

    const previousReturnApprovalStatus = String(
      order.returnApprovalStatus || "",
    )
      .toLowerCase()
      .trim();

    if (
      previousReturnApprovalStatus === "approved" ||
      previousReturnApprovalStatus === "not_approved"
    ) {
      return res.status(400).json({
        message: "Return status is already locked and cannot be changed.",
      });
    }

    order.returnApprovalStatus = normalized;
    await order.save();

    // Notify customer by email only when admin makes a decision.
    // (Do not email for 'pending', and do not email if status didn't change.)
    const decisionStatuses = new Set(["approved", "not_approved"]);
    const didChange = previousReturnApprovalStatus !== normalized;
    if (didChange && decisionStatuses.has(normalized)) {
      try {
        const { subject, html } = emailTemplates.returnApprovalUpdate(
          order,
          order.user,
        );
        await sendEmail(order.user.email, subject, html);
      } catch (emailError) {
        logger.error("Return approval email failed", {
          error: emailError.message,
        });
      }
    }

    res.json(order);
  } catch (error) {
    logger.error("Error updating return approval", { error: error.message });
    res.status(500).json({
      message: "Error updating return approval",
      error: error.message,
    });
  }
};

// ============ USERS ============

// @desc    Get all users (customers and admins)
// @route   GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;

    const where = {};
    if (role) where.role = role;
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { rows: users, count: total } = await User.findAndCountAll({
      where,
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
      offset,
      limit: Number(limit),
    });

    res.json({
      users,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
};

// ============ CUSTOMERS ============

// @desc    Get all customers
// @route   GET /api/admin/customers
const getAllCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const where = { role: "customer", emailVerified: true };
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { rows: customers, count: total } = await User.findAndCountAll({
      where,
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
      offset,
      limit: Number(limit),
    });

    const customerEmails = customers
      .map((c) => c.email)
      .filter(Boolean)
      .map((e) => String(e).toLowerCase());

    const newsletterRows = customerEmails.length
      ? await Newsletter.findAll({
          where: {
            email: {
              [Op.in]: customerEmails,
            },
          },
          attributes: ["email", "isSubscribed"],
          raw: true,
        })
      : [];

    const newsletterByEmail = new Map(
      newsletterRows.map((row) => [
        String(row.email).toLowerCase(),
        Boolean(row.isSubscribed),
      ]),
    );

    // Get order counts for each customer
    const customersWithOrders = await Promise.all(
      customers.map(async (customer) => {
        const orderCount = await Order.count({
          where: { userId: customer.id },
        });
        const totalSpentResult = await Order.findAll({
          where: { userId: customer.id, paymentStatus: "paid" },
          attributes: [
            [sequelize.fn("SUM", sequelize.col("total_amount")), "total"],
          ],
          raw: true,
        });

        return {
          ...customer.toJSON(),
          orderCount,
          totalSpent: parseFloat(totalSpentResult[0]?.total) || 0,
          newsletterSubscribed: newsletterByEmail.get(
            String(customer.email || "").toLowerCase(),
          )
            ? true
            : false,
        };
      }),
    );

    res.json({
      customers: customersWithOrders,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching customers", error: error.message });
  }
};

// @desc    Toggle customer status
// @route   PUT /api/admin/customers/:id/toggle-status
const toggleCustomerStatus = async (req, res) => {
  try {
    const customer = await User.findByPk(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    customer.isActive = !customer.isActive;
    await customer.save();

    res.json({
      message: `Customer ${customer.isActive ? "activated" : "deactivated"}`,
      customer,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating customer status",
      error: error.message,
    });
  }
};

// ============ REVIEWS ============

// @desc    Get all reviews (admin)
// @route   GET /api/admin/reviews
const getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20, approved } = req.query;

    const where = {};
    if (approved !== undefined) where.isApproved = approved === "true";

    const offset = (Number(page) - 1) * Number(limit);

    const { rows: reviews, count: total } = await Review.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName"],
        },
        { model: Product, as: "product", attributes: ["id", "name", "images"] },
      ],
      order: [["createdAt", "DESC"]],
      offset,
      limit: Number(limit),
    });

    res.json({
      reviews,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching reviews", error: error.message });
  }
};

// @desc    Approve/Disapprove review
// @route   PUT /api/admin/reviews/:id/approve
const toggleReviewApproval = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.isApproved = !review.isApproved;
    await review.save();

    res.json(review);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating review", error: error.message });
  }
};

// ============ REPORTS ============

// @desc    Get sales report
// @route   GET /api/admin/reports/sales
const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, range } = req.query;

    let dateWhere = {};
    if (startDate && endDate) {
      dateWhere = {
        createdAt: {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        },
      };
    } else if (range) {
      const now = new Date();
      let start = new Date();
      if (range === "week") start.setDate(now.getDate() - 7);
      else if (range === "month") start.setMonth(now.getMonth() - 1);
      else if (range === "year") start.setFullYear(now.getFullYear() - 1);

      if (range !== "all") {
        dateWhere = {
          createdAt: {
            [Op.gte]: start,
          },
        };
      }
    }

    // Include paid orders only
    const orderWhere =
      Object.keys(dateWhere).length > 0
        ? {
            [Op.and]: [dateWhere, { paymentStatus: "paid" }],
          }
        : { paymentStatus: "paid" };

    // 1. Summary
    const summaryData = await Order.findOne({
      where: orderWhere,
      attributes: [
        [sequelize.fn("SUM", sequelize.col("total_amount")), "totalRevenue"],
        [sequelize.fn("COUNT", sequelize.col("id")), "totalOrders"],
        [
          sequelize.fn("AVG", sequelize.col("total_amount")),
          "averageOrderValue",
        ],
        [sequelize.fn("SUM", sequelize.col("total_items")), "totalItemsSold"],
      ],
      raw: true,
    });

    // 2. Revenue By Day
    const revenueByDay = await Order.findAll({
      where: orderWhere,
      attributes: [
        [sequelize.fn("DATE", sequelize.col("created_at")), "date"],
        [sequelize.fn("SUM", sequelize.col("total_amount")), "revenue"],
        [sequelize.fn("COUNT", sequelize.col("id")), "orders"],
      ],
      group: [sequelize.fn("DATE", sequelize.col("created_at"))],
      order: [[sequelize.fn("DATE", sequelize.col("created_at")), "ASC"]],
      raw: true,
    });

    // 3. Top Products
    const topProducts = await OrderItem.findAll({
      attributes: [
        "productName",
        [sequelize.fn("SUM", sequelize.col("quantity")), "sold"],
        [sequelize.fn("SUM", sequelize.literal("quantity * price")), "revenue"],
      ],
      include: [
        {
          model: Order,
          attributes: [],
          where: orderWhere,
        },
      ],
      group: ["productName"],
      order: [[sequelize.literal("sold"), "DESC"]],
      limit: 5,
      raw: true,
    });

    // 4. Category Breakdown
    const categoryBreakdown = await OrderItem.findAll({
      attributes: [
        [sequelize.col("product.category"), "category"],
        [
          sequelize.fn(
            "COUNT",
            sequelize.fn("DISTINCT", sequelize.col("OrderItem.order_id")),
          ),
          "orders",
        ],
        [
          sequelize.fn(
            "SUM",
            sequelize.literal('"OrderItem"."quantity" * "OrderItem"."price"'),
          ),
          "revenue",
        ],
      ],
      include: [
        {
          model: Product,
          as: "product",
          attributes: [],
          required: true,
        },
        {
          model: Order,
          attributes: [],
          where: orderWhere,
        },
      ],
      group: [sequelize.col("product.category")],
      raw: true,
    });

    // 5. Orders By Status (include unpaid)
    const statusWhere = { ...dateWhere };
    const ordersByStatusData = await Order.findAll({
      where: statusWhere,
      attributes: [
        "status",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["status"],
      raw: true,
    });

    const ordersByStatus = {};
    ordersByStatusData.forEach((d) => {
      ordersByStatus[d.status] = parseInt(d.count);
    });

    res.json({
      summary: {
        totalRevenue: parseFloat(summaryData?.totalRevenue || 0),
        totalOrders: parseInt(summaryData?.totalOrders || 0),
        averageOrderValue: parseFloat(summaryData?.averageOrderValue || 0),
        totalItemsSold: parseInt(summaryData?.totalItemsSold || 0),
      },
      revenueByDay: revenueByDay.map((d) => ({
        date: d.date,
        revenue: parseFloat(d.revenue),
        orders: parseInt(d.orders),
      })),
      topProducts: topProducts.map((p) => ({
        name: p.productName,
        sold: parseInt(p.sold),
        revenue: parseFloat(p.revenue),
      })),
      categoryBreakdown: categoryBreakdown.map((c) => ({
        category: c.category || "Uncategorized",
        orders: parseInt(c.orders),
        revenue: parseFloat(c.revenue),
      })),
      ordersByStatus,
    });
  } catch (error) {
    logger.error("Report error", { error: error.message });
    res
      .status(500)
      .json({ message: "Error generating report", error: error.message });
  }
};

module.exports = {
  getDashboardStats,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  deleteProductImage,
  getAllOrders,
  updateOrderStatus,
  updateReturnApproval,
  getAllUsers,
  getAllCustomers,
  toggleCustomerStatus,
  getAllReviews,
  toggleReviewApproval,
  getSalesReport,
};
