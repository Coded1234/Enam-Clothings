const {
  Review,
  Order,
  OrderItem,
  User,
  ReviewHelpful,
  sequelize,
} = require("../models");

// @desc    Create review
// @route   POST /api/reviews
const createReview = async (req, res) => {
  try {
    const { productId, rating, title, comment } = req.body;

    // Check if user has purchased the product
    const hasPurchased = await Order.findOne({
      where: { userId: req.user.id, status: "delivered" },
      include: [
        {
          model: OrderItem,
          as: "items",
          where: { productId },
        },
      ],
    });

    // Check if already reviewed
    const existingReview = await Review.findOne({
      where: { userId: req.user.id, productId },
    });

    if (existingReview) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this product" });
    }

    const review = await Review.create({
      userId: req.user.id,
      productId,
      rating,
      title,
      comment,
      isVerifiedPurchase: !!hasPurchased,
    });

    const populatedReview = await Review.findByPk(review.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName"],
        },
      ],
    });

    res.status(201).json(populatedReview);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating review", error: error.message });
  }
};

// @desc    Get product reviews
// @route   GET /api/reviews/product/:productId
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = "newest" } = req.query;

    let order = [["createdAt", "DESC"]];
    if (sort === "rating-high") order = [["rating", "DESC"]];
    else if (sort === "rating-low") order = [["rating", "ASC"]];
    else if (sort === "helpful") order = [["helpful", "DESC"]];

    const offset = (Number(page) - 1) * Number(limit);

    const { rows: reviews, count: total } = await Review.findAndCountAll({
      where: { productId, isApproved: true },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName"],
        },
      ],
      order,
      offset,
      limit: Number(limit),
    });

    // Get user's helpful votes if logged in
    let userHelpfulVotes = [];
    if (req.user) {
      const votes = await ReviewHelpful.findAll({
        where: {
          userId: req.user.id,
          reviewId: reviews.map((r) => r.id),
        },
        attributes: ["reviewId"],
      });
      userHelpfulVotes = votes.map((v) => v.reviewId);
    }

    // Add isHelpfulByUser to each review
    const reviewsWithHelpfulInfo = reviews.map((review) => ({
      ...review.toJSON(),
      isHelpfulByUser: userHelpfulVotes.includes(review.id),
    }));

    // Get rating distribution
    const ratingDistribution = await Review.findAll({
      where: { productId, isApproved: true },
      attributes: [
        "rating",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["rating"],
      order: [["rating", "DESC"]],
      raw: true,
    });

    res.json({
      reviews: reviewsWithHelpfulInfo,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total,
      ratingDistribution: ratingDistribution.map((r) => ({
        _id: r.rating,
        count: parseInt(r.count),
      })),
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching reviews", error: error.message });
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
const updateReview = async (req, res) => {
  try {
    const { rating, title, comment } = req.body;

    const review = await Review.findByPk(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.userId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this review" });
    }

    if (rating) review.rating = rating;
    if (title) review.title = title;
    if (comment) review.comment = comment;

    await review.save();

    res.json(review);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating review", error: error.message });
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.userId !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this review" });
    }

    await review.destroy();

    res.json({ message: "Review deleted" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting review", error: error.message });
  }
};

// @desc    Toggle review as helpful (like/unlike)
// @route   POST /api/reviews/:id/helpful
const markHelpful = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    const userId = req.user.id;

    // Check if user already marked this review as helpful
    const existingVote = await ReviewHelpful.findOne({
      where: { reviewId: req.params.id, userId },
    });

    if (existingVote) {
      // User already voted - remove vote (unlike)
      await existingVote.destroy();
      review.helpful = Math.max((review.helpful || 0) - 1, 0);
      await review.save();

      res.json({
        review,
        isHelpful: false,
        message: "Removed helpful vote",
      });
    } else {
      // Add new vote (like)
      await ReviewHelpful.create({
        reviewId: req.params.id,
        userId,
      });
      review.helpful = (review.helpful || 0) + 1;
      await review.save();

      res.json({
        review,
        isHelpful: true,
        message: "Marked as helpful",
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating review", error: error.message });
  }
};

// @desc    Get featured testimonials for homepage
// @route   GET /api/reviews/testimonials
const getTestimonials = async (req, res) => {
  try {
    const { limit = 3 } = req.query;

    // Get approved reviews with high ratings (4-5 stars)
    const testimonials = await Review.findAll({
      where: {
        isApproved: true,
        rating: { [require("sequelize").Op.gte]: 4 },
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName"],
        },
      ],
      order: [
        ["rating", "DESC"],
        ["helpful", "DESC"],
        ["createdAt", "DESC"],
      ],
      limit: Number(limit),
    });

    res.json(testimonials);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching testimonials", error: error.message });
  }
};

module.exports = {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
  markHelpful,
  getTestimonials,
};
