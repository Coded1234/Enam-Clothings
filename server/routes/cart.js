const express = require("express");
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  mergeCart,
} = require("../controllers/cartController");
const { protect, optionalAuth } = require("../middleware/auth");
const {
  validateBody,
  validateParams,
  validationSchemas,
} = require("../middleware/validation");

router.use(optionalAuth);

router.get("/", getCart);
router.post("/add", validateBody(validationSchemas.addToCart), addToCart);
router.put(
  "/update/:itemId",
  validateParams(validationSchemas.uuidItemParam),
  validateBody(validationSchemas.updateCartItem),
  updateCartItem,
);
router.delete(
  "/remove/:itemId",
  validateParams(validationSchemas.uuidItemParam),
  removeFromCart,
);
router.delete("/clear", clearCart);
router.post("/merge", protect, mergeCart);

module.exports = router;
