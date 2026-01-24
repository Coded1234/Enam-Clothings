const { Coupon, CouponUsage, User, Order } = require("../models");
const { Op } = require("sequelize");

// @desc    Get all coupons (Admin)
// @route   GET /api/coupons
const getAllCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    if (status === "active") {
      where.is_active = true;
    } else if (status === "inactive") {
      where.is_active = false;
    }

    if (search) {
      where[Op.or] = [
        { code: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows: coupons } = await Coupon.findAndCountAll({
      where,
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      coupons,
      pagination: {
        total: count,
        pages: Math.ceil(count / limit),
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch coupons", error: error.message });
  }
};

// @desc    Get single coupon by ID (Admin)
// @route   GET /api/coupons/:id
const getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    // Get usage statistics
    const usageStats = await CouponUsage.count({
      where: { coupon_id: coupon.id },
    });

    res.json({
      success: true,
      coupon: {
        ...coupon.toJSON(),
        total_uses: usageStats,
      },
    });
  } catch (error) {
    console.error("Error fetching coupon:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch coupon", error: error.message });
  }
};

// @desc    Create new coupon (Admin)
// @route   POST /api/coupons
const createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_purchase,
      max_discount,
      usage_limit,
      usage_limit_per_user,
      start_date,
      end_date,
      is_active,
      applicable_categories,
    } = req.body;

    // Check if code already exists
    const existingCoupon = await Coupon.findOne({
      where: { code: code.toUpperCase() },
    });
    if (existingCoupon) {
      return res.status(400).json({ message: "Coupon code already exists" });
    }

    const coupon = await Coupon.create({
      code,
      description,
      discount_type,
      discount_value,
      min_purchase: min_purchase || 0,
      max_discount,
      usage_limit,
      usage_limit_per_user: usage_limit_per_user || 1,
      start_date,
      end_date,
      is_active: is_active !== false,
      applicable_categories: applicable_categories || [],
    });

    // Notify newsletter subscribers about new coupon
    try {
      // Only send if coupon is active
      if (coupon.is_active) {
        const subscribers = await Newsletter.findAll({
          where: { isSubscribed: true },
          attributes: ["email"],
        });

        if (subscribers.length > 0) {
          const recipientEmails = subscribers.map((s) => s.email);
          const template = emailTemplates.newsletterNewCoupon(coupon);

          // Send asynchronously
          sendBulkEmail(recipientEmails, template.subject, template.html);
        }
      }
    } catch (emailError) {
      console.error("Error sending coupon newsletter:", emailError);
    }

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon,
    });
  } catch (error) {
    console.error("Error creating coupon:", error);
    res
      .status(500)
      .json({ message: "Failed to create coupon", error: error.message });
  }
};

// @desc    Update coupon (Admin)
// @route   PUT /api/coupons/:id
const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    const {
      code,
      description,
      discount_type,
      discount_value,
      min_purchase,
      max_discount,
      usage_limit,
      usage_limit_per_user,
      start_date,
      end_date,
      is_active,
      applicable_categories,
    } = req.body;

    // Check if new code conflicts with existing
    if (code && code.toUpperCase() !== coupon.code) {
      const existingCoupon = await Coupon.findOne({
        where: { code: code.toUpperCase() },
      });
      if (existingCoupon) {
        return res.status(400).json({ message: "Coupon code already exists" });
      }
    }

    await coupon.update({
      code: code || coupon.code,
      description: description !== undefined ? description : coupon.description,
      discount_type: discount_type || coupon.discount_type,
      discount_value:
        discount_value !== undefined ? discount_value : coupon.discount_value,
      min_purchase:
        min_purchase !== undefined ? min_purchase : coupon.min_purchase,
      max_discount:
        max_discount !== undefined ? max_discount : coupon.max_discount,
      usage_limit: usage_limit !== undefined ? usage_limit : coupon.usage_limit,
      usage_limit_per_user:
        usage_limit_per_user !== undefined
          ? usage_limit_per_user
          : coupon.usage_limit_per_user,
      start_date: start_date !== undefined ? start_date : coupon.start_date,
      end_date: end_date !== undefined ? end_date : coupon.end_date,
      is_active: is_active !== undefined ? is_active : coupon.is_active,
      applicable_categories:
        applicable_categories !== undefined
          ? applicable_categories
          : coupon.applicable_categories,
    });

    res.json({
      success: true,
      message: "Coupon updated successfully",
      coupon,
    });
  } catch (error) {
    console.error("Error updating coupon:", error);
    res
      .status(500)
      .json({ message: "Failed to update coupon", error: error.message });
  }
};

// @desc    Delete coupon (Admin)
// @route   DELETE /api/coupons/:id
const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    await coupon.destroy();

    res.json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res
      .status(500)
      .json({ message: "Failed to delete coupon", error: error.message });
  }
};

// @desc    Validate and apply coupon (Customer)
// @route   POST /api/coupons/validate
const validateCoupon = async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    const userId = req.user.id;

    if (!code) {
      return res.status(400).json({ message: "Coupon code is required" });
    }

    const coupon = await Coupon.findOne({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return res.status(404).json({ message: "Invalid coupon code" });
    }

    // Check basic validity
    const validityCheck = coupon.isValid();
    if (!validityCheck.valid) {
      return res.status(400).json({ message: validityCheck.message });
    }

    // Check user usage limit
    if (coupon.usage_limit_per_user) {
      const userUsageCount = await CouponUsage.count({
        where: { coupon_id: coupon.id, user_id: userId },
      });

      if (userUsageCount >= coupon.usage_limit_per_user) {
        return res
          .status(400)
          .json({
            message:
              "You have already used this coupon the maximum number of times",
          });
      }
    }

    // Calculate discount
    const discountResult = coupon.calculateDiscount(parseFloat(subtotal));

    if (!discountResult.valid) {
      return res.status(400).json({ message: discountResult.message });
    }

    res.json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
      },
      discount: discountResult.discount,
      message: `Coupon applied! You save GH₵${discountResult.discount.toFixed(
        2
      )}`,
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    res
      .status(500)
      .json({ message: "Failed to validate coupon", error: error.message });
  }
};

// @desc    Apply coupon to order (internal use)
const applyCouponToOrder = async (
  couponId,
  userId,
  orderId,
  discountAmount
) => {
  try {
    // Record usage
    await CouponUsage.create({
      coupon_id: couponId,
      user_id: userId,
      order_id: orderId,
      discount_amount: discountAmount,
    });

    // Increment used count
    await Coupon.increment("used_count", { where: { id: couponId } });

    return true;
  } catch (error) {
    console.error("Error applying coupon to order:", error);
    return false;
  }
};

// @desc    Record coupon usage after order (Customer)
// @route   POST /api/coupons/record-usage
const recordCouponUsage = async (req, res) => {
  try {
    const { coupon_id, order_id, discount_amount } = req.body;
    const userId = req.user.id;

    if (!coupon_id || !order_id) {
      return res
        .status(400)
        .json({ message: "Coupon ID and Order ID are required" });
    }

    const success = await applyCouponToOrder(
      coupon_id,
      userId,
      order_id,
      discount_amount || 0
    );

    if (success) {
      res.json({ success: true, message: "Coupon usage recorded" });
    } else {
      res.status(500).json({ message: "Failed to record coupon usage" });
    }
  } catch (error) {
    console.error("Error recording coupon usage:", error);
    res
      .status(500)
      .json({ message: "Failed to record coupon usage", error: error.message });
  }
};

// @desc    Get active coupons for homepage
// @route   GET /api/coupons/active/homepage
const getActiveCoupons = async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.findAll({
      where: {
        is_active: true,
        [Op.or]: [
          { start_date: { [Op.lte]: now }, end_date: { [Op.gte]: now } },
          { start_date: null, end_date: null },
          { start_date: { [Op.lte]: now }, end_date: null },
          { start_date: null, end_date: { [Op.gte]: now } },
        ],
      },
      order: [["created_at", "DESC"]],
      limit: 1,
    });

    if (coupons.length > 0) {
      const coupon = coupons[0];
      
      // Generate AI message if not exists
      if (!coupon.ai_message) {
        coupon.ai_message = generateCouponMessage(coupon);
        await coupon.save();
      }

      res.json({ success: true, coupon });
    } else {
      res.json({ success: true, coupon: null });
    }
  } catch (error) {
    console.error("Error fetching active coupons:", error);
    res.status(500).json({ message: "Failed to fetch active coupons", error: error.message });
  }
};

// Helper function to generate AI-style coupon messages
const generateCouponMessage = (coupon) => {
  const { discount_type, discount_value, description, code } = coupon;
  
  // Round the discount value to remove decimals
  const roundedValue = Math.round(Number(discount_value));
  
  const templates = [
    `Get ${discount_type === 'percentage' ? roundedValue + '%' : 'GH₵' + roundedValue} Off ${description || 'Your Purchase'}!\nUse code ${code} at checkout`,
    `Save ${discount_type === 'percentage' ? roundedValue + '%' : 'GH₵' + roundedValue} ${description ? 'on ' + description : 'Today'}!\nApply code ${code} at checkout`,
    `Exclusive Offer: ${discount_type === 'percentage' ? roundedValue + '% Discount' : 'GH₵' + roundedValue + ' Off'} ${description || ''}!\nShop now with code ${code}`,
    `Limited Time: ${discount_type === 'percentage' ? roundedValue + '%' : 'GH₵' + roundedValue} Off ${description || 'Everything'}!\nDon't miss out! Use ${code}`,
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
};

module.exports = {
  getAllCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  applyCouponToOrder,
  recordCouponUsage,
  getActiveCoupons,
};
