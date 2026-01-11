const { Product, sequelize } = require("../models");
const { Op } = require("sequelize");
const { cloudinary } = require("../config/cloudinary");

// @desc    Get all products with filters
// @route   GET /api/products
const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      subcategory,
      minPrice,
      maxPrice,
      size,
      color,
      brand,
      sort,
      search,
      featured,
    } = req.query;

    // Build filter object
    const where = { isActive: true };

    if (category) where.category = category;
    if (subcategory) where.subcategory = subcategory;
    if (brand) where.brand = brand;
    if (featured === "true") where.featured = true;

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = Number(minPrice);
      if (maxPrice) where.price[Op.lte] = Number(maxPrice);
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { brand: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Build sort array
    let order = [["createdAt", "DESC"]];
    if (sort === "price-low") order = [["price", "ASC"]];
    else if (sort === "price-high") order = [["price", "DESC"]];
    else if (sort === "rating") order = [["averageRating", "DESC"]];
    else if (sort === "popular") order = [["soldCount", "DESC"]];
    else if (sort === "newest") order = [["createdAt", "DESC"]];

    const offset = (Number(page) - 1) * Number(limit);

    const { rows: products, count: total } = await Product.findAndCountAll({
      where,
      order,
      offset,
      limit: Number(limit),
    });

    res.json({
      products,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total,
    });
  } catch (error) {
    console.error("Get products error:", error);
    res
      .status(500)
      .json({ message: "Error fetching products", error: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching product", error: error.message });
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { featured: true, isActive: true },
      limit: 8,
      order: [["createdAt", "DESC"]],
    });
    res.json(products);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error fetching featured products",
        error: error.message,
      });
  }
};

// @desc    Get products by category
// @route   GET /api/products/category/:category
const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 12 } = req.query;

    const products = await Product.findAll({
      where: { category, isActive: true },
      limit: Number(limit),
      order: [["createdAt", "DESC"]],
    });

    res.json(products);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching products", error: error.message });
  }
};

// @desc    Get related products
// @route   GET /api/products/:id/related
const getRelatedProducts = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const relatedProducts = await Product.findAll({
      where: {
        id: { [Op.ne]: product.id },
        category: product.category,
        isActive: true,
      },
      limit: 4,
    });

    res.json(relatedProducts);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error fetching related products",
        error: error.message,
      });
  }
};

// @desc    Search products
// @route   GET /api/products/search
const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const products = await Product.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${q}%` } },
          { description: { [Op.iLike]: `%${q}%` } },
          { brand: { [Op.iLike]: `%${q}%` } },
        ],
        isActive: true,
      },
      limit: 20,
    });

    res.json(products);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error searching products", error: error.message });
  }
};

// @desc    Get all categories with counts
// @route   GET /api/products/categories
const getCategories = async (req, res) => {
  try {
    const categories = await Product.findAll({
      where: { isActive: true },
      attributes: [
        "category",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["category"],
      raw: true,
    });

    res.json(
      categories.map((c) => ({ _id: c.category, count: parseInt(c.count) }))
    );
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching categories", error: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  getFeaturedProducts,
  getProductsByCategory,
  getRelatedProducts,
  searchProducts,
  getCategories,
};
