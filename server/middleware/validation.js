const Joi = require("joi");

const UUID_PARAM_SCHEMA = Joi.object({
  id: Joi.string()
    .guid({ version: ["uuidv4", "uuidv5", "uuidv1", "uuidv3"] })
    .required(),
}).unknown(true);

const UUID_ITEM_PARAM_SCHEMA = Joi.object({
  itemId: Joi.string()
    .guid({ version: ["uuidv4", "uuidv5", "uuidv1", "uuidv3"] })
    .required(),
}).unknown(true);

const UUID_PRODUCT_PARAM_SCHEMA = Joi.object({
  productId: Joi.string()
    .guid({ version: ["uuidv4", "uuidv5", "uuidv1", "uuidv3"] })
    .required(),
}).unknown(true);

const INTEGER_ID_PARAM_SCHEMA = Joi.object({
  id: Joi.number().integer().min(1).required(),
}).unknown(true);

const boolish = Joi.alternatives().try(
  Joi.boolean(),
  Joi.string().valid("true", "false"),
);

const parseJsonField = (expectedType, fieldName) => (value, helpers) => {
  if (typeof value !== "string") return value;

  try {
    const parsed = JSON.parse(value);
    if (expectedType === "array" && !Array.isArray(parsed)) {
      return helpers.message(`${fieldName} must be a JSON array`);
    }
    if (
      expectedType === "object" &&
      (parsed === null || Array.isArray(parsed) || typeof parsed !== "object")
    ) {
      return helpers.message(`${fieldName} must be a JSON object`);
    }
    return parsed;
  } catch {
    return helpers.message(`${fieldName} must be valid JSON`);
  }
};

const numericAmount = Joi.alternatives().try(
  Joi.number().min(0),
  Joi.string()
    .trim()
    .pattern(/^\d+(\.\d{1,2})?$/),
);

const nonNegativeInt = Joi.alternatives().try(
  Joi.number().integer().min(0),
  Joi.string().trim().pattern(/^\d+$/),
);

const positiveInt = Joi.alternatives().try(
  Joi.number().integer().min(1),
  Joi.string()
    .trim()
    .pattern(/^[1-9]\d*$/),
);

const jsonArrayField = (fieldName) =>
  Joi.alternatives().try(
    Joi.array().items(
      Joi.alternatives().try(Joi.string(), Joi.object().unknown(true)),
    ),
    Joi.string().custom(
      parseJsonField("array", fieldName),
      `${fieldName} JSON parser`,
    ),
  );

const shippingAddressSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(100).required(),
  lastName: Joi.string().trim().min(1).max(100).required(),
  email: Joi.string().email().allow("", null),
  phone: Joi.string().trim().max(40).allow("", null),
  address: Joi.string().trim().min(2).max(300).required(),
  city: Joi.string().trim().min(1).max(120).required(),
  region: Joi.string().trim().max(120).allow("", null),
  country: Joi.string().trim().max(120).allow("", null),
  postalCode: Joi.string().trim().max(40).allow("", null),
}).unknown(true);

const createOrderSchema = Joi.object({
  shippingAddress: Joi.alternatives()
    .try(
      shippingAddressSchema,
      Joi.string().custom(
        parseJsonField("object", "shippingAddress"),
        "shippingAddress JSON parser",
      ),
    )
    .required(),
  paymentMethod: Joi.string().valid("paystack").optional(),
  couponId: Joi.string().trim().allow("", null),
  discount: numericAmount.optional(),
  shippingDetails: Joi.alternatives()
    .try(
      Joi.object().unknown(true),
      Joi.string().custom(
        parseJsonField("object", "shippingDetails"),
        "shippingDetails JSON parser",
      ),
    )
    .allow(null)
    .optional(),
  guestEmail: Joi.string().email().allow("", null),
  guestName: Joi.string().trim().max(160).allow("", null),
  sessionId: Joi.string().trim().max(255).allow("", null),
}).unknown(true);

const createProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200).required(),
  description: Joi.string().trim().min(2).max(10000).required(),
  price: numericAmount.required(),
  comparePrice: numericAmount.allow("", null),
  originalPrice: numericAmount.allow("", null),
  brand: Joi.string().trim().max(120).allow("", null),
  category: Joi.string().valid("men", "women", "perfumes").optional(),
  categoryId: Joi.string().trim().max(64).allow("", null),
  subcategory: Joi.string().trim().max(120).allow("", null),
  totalStock: nonNegativeInt.optional(),
  featured: boolish,
  isActive: boolish,
  sizes: jsonArrayField("sizes").optional(),
  colors: jsonArrayField("colors").optional(),
  images: jsonArrayField("images").optional(),
  status: Joi.string().trim().max(50).allow("", null),
}).unknown(true);

const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200),
  description: Joi.string().trim().min(2).max(10000),
  price: numericAmount,
  comparePrice: numericAmount.allow("", null),
  originalPrice: numericAmount.allow("", null),
  brand: Joi.string().trim().max(120).allow("", null),
  category: Joi.string().valid("men", "women", "perfumes"),
  categoryId: Joi.string().trim().max(64).allow("", null),
  subcategory: Joi.string().trim().max(120).allow("", null),
  totalStock: nonNegativeInt,
  featured: boolish,
  isActive: boolish,
  sizes: jsonArrayField("sizes"),
  colors: jsonArrayField("colors"),
  images: jsonArrayField("images"),
  existingImages: jsonArrayField("existingImages"),
  status: Joi.string().trim().max(50).allow("", null),
})
  .or(
    "name",
    "description",
    "price",
    "comparePrice",
    "originalPrice",
    "brand",
    "category",
    "categoryId",
    "subcategory",
    "totalStock",
    "featured",
    "isActive",
    "sizes",
    "colors",
    "images",
    "existingImages",
    "status",
  )
  .unknown(true);

const updateProductStockSchema = Joi.object({
  sizes: Joi.alternatives()
    .try(
      Joi.array().items(
        Joi.alternatives().try(
          Joi.string(),
          Joi.object({
            size: Joi.string().trim().min(1).max(20).required(),
            stock: nonNegativeInt.required(),
          }).unknown(true),
        ),
      ),
      Joi.string().custom(
        parseJsonField("array", "sizes"),
        "sizes JSON parser",
      ),
    )
    .required(),
}).unknown(true);

const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid("pending", "confirmed", "shipped", "delivered", "cancelled")
    .required(),
  trackingNumber: Joi.string().trim().max(100).allow("", null),
  note: Joi.string().trim().max(500).allow("", null),
}).unknown(true);

const updateReturnApprovalSchema = Joi.object({
  returnApprovalStatus: Joi.string()
    .valid("pending", "approved", "not_approved")
    .required(),
}).unknown(true);

const registerSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required(),
  lastName: Joi.string().trim().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  phone: Joi.string().trim().max(40).allow("", null),
}).unknown(true);

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(1).max(256).required(),
}).unknown(true);

const oauthLoginSchema = Joi.object({
  token: Joi.string().trim().min(10).max(4096).required(),
}).unknown(true);

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
}).unknown(true);

const resetPasswordTokenParamSchema = Joi.object({
  token: Joi.string().trim().alphanum().min(32).max(128).required(),
}).unknown(true);

const resetPasswordSchema = Joi.object({
  password: Joi.string().min(8).max(128).required(),
}).unknown(true);

const verifyEmailSchema = Joi.object({
  email: Joi.string().email().required(),
  token: Joi.string().trim().alphanum().min(16).max(128).required(),
}).unknown(true);

const updateProfileSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50),
  lastName: Joi.string().trim().min(2).max(50),
  phone: Joi.string().trim().max(40).allow("", null),
  address: Joi.alternatives().try(
    Joi.object().unknown(true),
    Joi.string().custom(
      parseJsonField("object", "address"),
      "address JSON parser",
    ),
  ),
})
  .or("firstName", "lastName", "phone", "address")
  .unknown(true);

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(1).max(256).required(),
  newPassword: Joi.string().min(8).max(128).required(),
}).unknown(true);

const deleteAccountSchema = Joi.object({
  password: Joi.string().min(1).max(256).allow("", null),
}).unknown(true);

const paymentInitializeSchema = Joi.object({
  email: Joi.string().email().allow("", null),
  amount: Joi.number().positive().max(1000000000).optional(),
  metadata: Joi.object({
    order_id: Joi.string()
      .guid({ version: ["uuidv4", "uuidv5", "uuidv1", "uuidv3"] })
      .required(),
  })
    .unknown(true)
    .required(),
}).unknown(true);

const paymentReferenceParamSchema = Joi.object({
  reference: Joi.string()
    .trim()
    .pattern(/^[A-Za-z0-9_-]{6,120}$/)
    .required(),
}).unknown(true);

const facebookDataDeletionSchema = Joi.object({
  signed_request: Joi.string().trim().min(20).required(),
}).unknown(true);

const createCouponSchema = Joi.object({
  code: Joi.string().trim().min(2).max(50).required(),
  description: Joi.string().trim().max(255).allow("", null),
  discount_type: Joi.string().valid("percentage", "fixed").required(),
  discount_value: numericAmount.required(),
  min_purchase: numericAmount.allow("", null),
  max_discount: numericAmount.allow("", null),
  usage_limit: positiveInt.allow("", null),
  usage_limit_per_user: positiveInt.allow("", null),
  start_date: Joi.date().iso().allow(null, ""),
  end_date: Joi.date().iso().allow(null, ""),
  is_active: boolish,
  applicable_categories: Joi.alternatives().try(
    Joi.array().items(Joi.string().trim().max(100)),
    Joi.string().custom(
      parseJsonField("array", "applicable_categories"),
      "applicable_categories JSON parser",
    ),
  ),
}).unknown(true);

const updateCouponSchema = Joi.object({
  code: Joi.string().trim().min(2).max(50),
  description: Joi.string().trim().max(255).allow("", null),
  discount_type: Joi.string().valid("percentage", "fixed"),
  discount_value: numericAmount,
  min_purchase: numericAmount.allow("", null),
  max_discount: numericAmount.allow("", null),
  usage_limit: positiveInt.allow("", null),
  usage_limit_per_user: positiveInt.allow("", null),
  start_date: Joi.date().iso().allow(null, ""),
  end_date: Joi.date().iso().allow(null, ""),
  is_active: boolish,
  applicable_categories: Joi.alternatives().try(
    Joi.array().items(Joi.string().trim().max(100)),
    Joi.string().custom(
      parseJsonField("array", "applicable_categories"),
      "applicable_categories JSON parser",
    ),
  ),
})
  .or(
    "code",
    "description",
    "discount_type",
    "discount_value",
    "min_purchase",
    "max_discount",
    "usage_limit",
    "usage_limit_per_user",
    "start_date",
    "end_date",
    "is_active",
    "applicable_categories",
  )
  .unknown(true);

const validateCouponSchema = Joi.object({
  code: Joi.string().trim().min(2).max(50).required(),
  subtotal: numericAmount.required(),
}).unknown(true);

const recordCouponUsageSchema = Joi.object({
  coupon_id: Joi.number().integer().min(1).required(),
  order_id: Joi.string()
    .guid({ version: ["uuidv4", "uuidv5", "uuidv1", "uuidv3"] })
    .required(),
  discount_amount: numericAmount.allow("", null),
}).unknown(true);

const categoryBaseSchema = {
  name: Joi.string().trim().min(2).max(100),
  slug: Joi.string().trim().min(2).max(100),
  description: Joi.string().trim().max(5000).allow("", null),
  image: Joi.string().trim().max(500).allow("", null),
  parent_id: Joi.number().integer().min(1).allow(null),
  display_order: nonNegativeInt,
  is_active: boolish,
  meta_title: Joi.string().trim().max(200).allow("", null),
  meta_description: Joi.string().trim().max(500).allow("", null),
};

const createCategorySchema = Joi.object({
  ...categoryBaseSchema,
  name: Joi.string().trim().min(2).max(100).required(),
}).unknown(true);

const updateCategorySchema = Joi.object(categoryBaseSchema)
  .or(
    "name",
    "slug",
    "description",
    "image",
    "parent_id",
    "display_order",
    "is_active",
    "meta_title",
    "meta_description",
  )
  .unknown(true);

const reorderCategoriesSchema = Joi.object({
  orders: Joi.array()
    .items(
      Joi.object({
        id: Joi.number().integer().min(1).required(),
        display_order: nonNegativeInt.required(),
      }).unknown(true),
    )
    .min(1)
    .required(),
}).unknown(true);

const createAnnouncementSchema = Joi.object({
  title: Joi.string().trim().min(2).max(150).required(),
  message: Joi.string().trim().min(2).max(5000).required(),
  isActive: boolish,
}).unknown(true);

const updateAnnouncementSchema = Joi.object({
  title: Joi.string().trim().min(2).max(150),
  message: Joi.string().trim().min(2).max(5000),
  isActive: boolish,
})
  .or("title", "message", "isActive")
  .unknown(true);

const SETTINGS_KEYS = [
  "storeName",
  "storeEmail",
  "storePhone",
  "storeAddress",
  "currency",
  "currencySymbol",
  "taxRate",
  "shippingFee",
  "freeShippingThreshold",
  "socialLinks",
  "aboutText",
  "returnPolicy",
  "privacyPolicy",
  "termsConditions",
];

const socialLinksSchema = Joi.object({
  facebook: Joi.string().allow(""),
  twitter: Joi.string().allow(""),
  instagram: Joi.string().allow(""),
  youtube: Joi.string().allow(""),
}).unknown(false);

const settingsValueByKey = {
  storeName: Joi.string().trim().max(150),
  storeEmail: Joi.string().email(),
  storePhone: Joi.string().trim().max(40),
  storeAddress: Joi.string().trim().max(255),
  currency: Joi.string().trim().max(10),
  currencySymbol: Joi.string().trim().max(10),
  taxRate: Joi.number().min(0).max(100),
  shippingFee: Joi.number().min(0),
  freeShippingThreshold: Joi.number().min(0),
  socialLinks: socialLinksSchema,
  aboutText: Joi.string().trim().max(5000),
  returnPolicy: Joi.string().trim().max(5000),
  privacyPolicy: Joi.string().trim().max(15000),
  termsConditions: Joi.string().trim().max(15000),
};

const updateSettingsSchema = Joi.object(
  Object.fromEntries(
    SETTINGS_KEYS.map((key) => [key, settingsValueByKey[key].allow("", null)]),
  ),
)
  .min(1)
  .unknown(false);

const bulkUpdateSettingsSchema = Joi.object({
  settings: Joi.array()
    .items(
      Joi.object({
        key: Joi.string()
          .valid(...SETTINGS_KEYS)
          .required(),
        value: Joi.any().required(),
      }).unknown(false),
    )
    .min(1)
    .required(),
}).unknown(true);

const contactSubmitSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().trim().max(40).allow("", null),
  subject: Joi.string().trim().min(2).max(200).required(),
  message: Joi.string().trim().min(2).max(5000).required(),
  orderId: Joi.string()
    .guid({ version: ["uuidv4", "uuidv5", "uuidv1", "uuidv3"] })
    .allow("", null),
}).unknown(true);

const updateContactMessageSchema = Joi.object({
  status: Joi.string().valid("new", "read", "replied", "closed"),
  reply: Joi.string().trim().max(5000).allow("", null),
})
  .or("status", "reply")
  .unknown(true);

const createReviewSchema = Joi.object({
  productId: Joi.string()
    .guid({ version: ["uuidv4", "uuidv5", "uuidv1", "uuidv3"] })
    .required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  title: Joi.string().trim().max(200).allow("", null),
  comment: Joi.string().trim().min(2).max(5000).required(),
}).unknown(true);

const updateReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5),
  title: Joi.string().trim().max(200).allow("", null),
  comment: Joi.string().trim().min(2).max(5000),
})
  .or("rating", "title", "comment")
  .unknown(true);

const addToCartSchema = Joi.object({
  productId: Joi.string()
    .guid({ version: ["uuidv4", "uuidv5", "uuidv1", "uuidv3"] })
    .required(),
  quantity: positiveInt.required(),
  size: Joi.string().trim().min(1).max(10).required(),
  color: Joi.alternatives()
    .try(
      Joi.object().unknown(true),
      Joi.string().custom(
        parseJsonField("object", "color"),
        "color JSON parser",
      ),
    )
    .allow(null),
}).unknown(true);

const updateCartItemSchema = Joi.object({
  quantity: positiveInt.required(),
}).unknown(true);

const shippingRequestSchema = Joi.object({
  address: Joi.string().trim().min(2).max(300).required(),
  city: Joi.string().trim().min(1).max(120).required(),
  postalCode: Joi.string().trim().max(40).allow("", null),
  phone: Joi.string().trim().max(40).allow("", null),
}).unknown(true);

const formatValidationError = (error) =>
  error.details.map((detail) => ({
    field: detail.path.join("."),
    message: detail.message,
  }));

const validate = (schema, source) => (req, res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: false,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      errors: formatValidationError(error),
    });
  }

  req[source] = value;
  return next();
};

const validateBody = (schema) => validate(schema, "body");
const validateParams = (schema) => validate(schema, "params");

module.exports = {
  validateBody,
  validateParams,
  validationSchemas: {
    uuidIdParam: UUID_PARAM_SCHEMA,
    integerIdParam: INTEGER_ID_PARAM_SCHEMA,
    uuidItemParam: UUID_ITEM_PARAM_SCHEMA,
    uuidProductParam: UUID_PRODUCT_PARAM_SCHEMA,
    createOrder: createOrderSchema,
    createProduct: createProductSchema,
    updateProduct: updateProductSchema,
    updateProductStock: updateProductStockSchema,
    updateOrderStatus: updateOrderStatusSchema,
    updateReturnApproval: updateReturnApprovalSchema,
    register: registerSchema,
    login: loginSchema,
    oauthLogin: oauthLoginSchema,
    forgotPassword: forgotPasswordSchema,
    resetPasswordTokenParam: resetPasswordTokenParamSchema,
    resetPassword: resetPasswordSchema,
    verifyEmail: verifyEmailSchema,
    resendVerification: forgotPasswordSchema,
    updateProfile: updateProfileSchema,
    changePassword: changePasswordSchema,
    deleteAccount: deleteAccountSchema,
    paymentInitialize: paymentInitializeSchema,
    paymentReferenceParam: paymentReferenceParamSchema,
    facebookDataDeletion: facebookDataDeletionSchema,
    createCoupon: createCouponSchema,
    updateCoupon: updateCouponSchema,
    validateCoupon: validateCouponSchema,
    recordCouponUsage: recordCouponUsageSchema,
    createCategory: createCategorySchema,
    updateCategory: updateCategorySchema,
    reorderCategories: reorderCategoriesSchema,
    createAnnouncement: createAnnouncementSchema,
    updateAnnouncement: updateAnnouncementSchema,
    updateSettings: updateSettingsSchema,
    bulkUpdateSettings: bulkUpdateSettingsSchema,
    contactSubmit: contactSubmitSchema,
    updateContactMessage: updateContactMessageSchema,
    createReview: createReviewSchema,
    updateReview: updateReviewSchema,
    addToCart: addToCartSchema,
    updateCartItem: updateCartItemSchema,
    shippingRequest: shippingRequestSchema,
  },
};
