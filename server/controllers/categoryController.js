const { Category } = require("../models");
const { Op } = require("sequelize");

// @desc    Get all categories
// @route   GET /api/categories
const getAllCategories = async (req, res) => {
  try {
    const { includeInactive, flat } = req.query;

    const where = {};
    if (!includeInactive || includeInactive !== "true") {
      where.is_active = true;
    }

    if (flat === "true") {
      // Return flat list of all categories
      const categories = await Category.findAll({
        where,
        order: [
          ["display_order", "ASC"],
          ["name", "ASC"],
        ],
      });
      return res.json({ success: true, categories });
    }

    // Return hierarchical structure (only parent categories with subcategories)
    const parentWhere = { ...where, parent_id: null };

    const categories = await Category.findAll({
      where: parentWhere,
      include: [
        {
          model: Category,
          as: "subcategories",
          where: includeInactive !== "true" ? { is_active: true } : {},
          required: false,
          order: [["display_order", "ASC"]],
        },
      ],
      order: [
        ["display_order", "ASC"],
        ["name", "ASC"],
      ],
    });

    res.json({ success: true, categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch categories", error: error.message });
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id, {
      include: [
        {
          model: Category,
          as: "subcategories",
        },
        {
          model: Category,
          as: "parent",
        },
      ],
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ success: true, category });
  } catch (error) {
    console.error("Error fetching category:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch category", error: error.message });
  }
};

// @desc    Create category (Admin)
// @route   POST /api/categories
const createCategory = async (req, res) => {
  try {
    const {
      name,
      description,
      image,
      parent_id,
      display_order,
      is_active,
      meta_title,
      meta_description,
    } = req.body;

    // Check if name already exists
    const existingCategory = await Category.findOne({ where: { name } });
    if (existingCategory) {
      return res
        .status(400)
        .json({ message: "Category with this name already exists" });
    }

    // Generate slug
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    // Check if slug exists
    const existingSlug = await Category.findOne({ where: { slug } });
    if (existingSlug) {
      return res.status(400).json({ message: "Category slug already exists" });
    }

    const category = await Category.create({
      name,
      slug,
      description,
      image,
      parent_id: parent_id || null,
      display_order: display_order || 0,
      is_active: is_active !== false,
      meta_title,
      meta_description,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res
      .status(500)
      .json({ message: "Failed to create category", error: error.message });
  }
};

// @desc    Update category (Admin)
// @route   PUT /api/categories/:id
const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const {
      name,
      slug,
      description,
      image,
      parent_id,
      display_order,
      is_active,
      meta_title,
      meta_description,
    } = req.body;

    // Check if name conflicts with existing
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ where: { name } });
      if (existingCategory) {
        return res
          .status(400)
          .json({ message: "Category with this name already exists" });
      }
    }

    // Check circular reference
    if (parent_id && parent_id === category.id) {
      return res
        .status(400)
        .json({ message: "Category cannot be its own parent" });
    }

    await category.update({
      name: name || category.name,
      slug: slug || category.slug,
      description:
        description !== undefined ? description : category.description,
      image: image !== undefined ? image : category.image,
      parent_id: parent_id !== undefined ? parent_id : category.parent_id,
      display_order:
        display_order !== undefined ? display_order : category.display_order,
      is_active: is_active !== undefined ? is_active : category.is_active,
      meta_title: meta_title !== undefined ? meta_title : category.meta_title,
      meta_description:
        meta_description !== undefined
          ? meta_description
          : category.meta_description,
    });

    res.json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res
      .status(500)
      .json({ message: "Failed to update category", error: error.message });
  }
};

// @desc    Delete category (Admin)
// @route   DELETE /api/categories/:id
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id, {
      include: [{ model: Category, as: "subcategories" }],
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Check if category has subcategories
    if (category.subcategories && category.subcategories.length > 0) {
      return res.status(400).json({
        message:
          "Cannot delete category with subcategories. Delete subcategories first or reassign them.",
      });
    }

    await category.destroy();

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res
      .status(500)
      .json({ message: "Failed to delete category", error: error.message });
  }
};

// @desc    Reorder categories (Admin)
// @route   PUT /api/categories/reorder
const reorderCategories = async (req, res) => {
  try {
    const { orders } = req.body; // [{ id: 1, display_order: 0 }, { id: 2, display_order: 1 }]

    if (!orders || !Array.isArray(orders)) {
      return res.status(400).json({ message: "Orders array is required" });
    }

    await Promise.all(
      orders.map((item) =>
        Category.update(
          { display_order: item.display_order },
          { where: { id: item.id } }
        )
      )
    );

    res.json({
      success: true,
      message: "Categories reordered successfully",
    });
  } catch (error) {
    console.error("Error reordering categories:", error);
    res
      .status(500)
      .json({ message: "Failed to reorder categories", error: error.message });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
};
