const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "StyleStore E-Commerce API",
      version: "1.0.0",
      description:
        "Complete API documentation for StyleStore clothing e-commerce platform",
      contact: {
        name: "API Support",
        email: "support@stylestore.com",
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    tags: [
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Products", description: "Product management" },
      { name: "Cart", description: "Shopping cart operations" },
      { name: "Orders", description: "Order management" },
      { name: "Reviews", description: "Product reviews" },
      { name: "Admin", description: "Admin operations" },
    ],
    paths: {
      // ==================== AUTH ====================
      "/api/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register a new user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["firstName", "lastName", "email", "password"],
                  properties: {
                    firstName: { type: "string", example: "John" },
                    lastName: { type: "string", example: "Doe" },
                    email: {
                      type: "string",
                      format: "email",
                      example: "john@example.com",
                    },
                    password: {
                      type: "string",
                      minLength: 6,
                      example: "password123",
                    },
                    phone: { type: "string", example: "+234801234567" },
                    role: {
                      type: "string",
                      enum: ["customer", "admin"],
                      default: "customer",
                      example: "customer",
                      description: "User role (defaults to customer)",
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "User registered successfully" },
            400: { description: "Validation error or user exists" },
          },
        },
      },
      "/api/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: {
                      type: "string",
                      format: "email",
                      example: "john@example.com",
                    },
                    password: { type: "string", example: "password123" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Login successful, returns JWT token" },
            401: { description: "Invalid credentials" },
          },
        },
      },
      "/api/auth/profile": {
        get: {
          tags: ["Auth"],
          summary: "Get current user profile",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "User profile data" },
            401: { description: "Not authenticated" },
          },
        },
        put: {
          tags: ["Auth"],
          summary: "Update user profile",
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    firstName: { type: "string" },
                    lastName: { type: "string" },
                    phone: { type: "string" },
                    address: {
                      type: "object",
                      properties: {
                        street: { type: "string" },
                        city: { type: "string" },
                        state: { type: "string" },
                        country: { type: "string" },
                        zipCode: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Profile updated" },
            401: { description: "Not authenticated" },
          },
        },
      },
      "/api/auth/wishlist": {
        get: {
          tags: ["Auth"],
          summary: "Get user wishlist",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Wishlist items" },
          },
        },
        post: {
          tags: ["Auth"],
          summary: "Add/remove product from wishlist",
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["productId"],
                  properties: {
                    productId: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Wishlist updated" },
          },
        },
      },
      // ==================== PRODUCTS ====================
      "/api/products": {
        get: {
          tags: ["Products"],
          summary: "Get all products with filters",
          parameters: [
            {
              name: "page",
              in: "query",
              schema: { type: "integer", default: 1 },
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 12 },
            },
            {
              name: "category",
              in: "query",
              schema: {
                type: "string",
                enum: ["men", "women", "kids"],
              },
            },
            { name: "subcategory", in: "query", schema: { type: "string" } },
            { name: "minPrice", in: "query", schema: { type: "number" } },
            { name: "maxPrice", in: "query", schema: { type: "number" } },
            { name: "size", in: "query", schema: { type: "string" } },
            { name: "color", in: "query", schema: { type: "string" } },
            {
              name: "sort",
              in: "query",
              schema: {
                type: "string",
                enum: [
                  "newest",
                  "price-low",
                  "price-high",
                  "rating",
                  "popular",
                ],
              },
            },
            { name: "search", in: "query", schema: { type: "string" } },
          ],
          responses: {
            200: { description: "List of products with pagination" },
          },
        },
      },
      "/api/products/featured": {
        get: {
          tags: ["Products"],
          summary: "Get featured products",
          responses: {
            200: { description: "List of featured products" },
          },
        },
      },
      "/api/products/{id}": {
        get: {
          tags: ["Products"],
          summary: "Get product by ID",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            200: { description: "Product details" },
            404: { description: "Product not found" },
          },
        },
      },
      "/api/products/{id}/related": {
        get: {
          tags: ["Products"],
          summary: "Get related products",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            200: { description: "Related products" },
          },
        },
      },
      // ==================== CART ====================
      "/api/cart": {
        get: {
          tags: ["Cart"],
          summary: "Get user cart",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Cart with items" },
          },
        },
        post: {
          tags: ["Cart"],
          summary: "Add item to cart",
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["productId", "quantity", "size"],
                  properties: {
                    productId: { type: "string", format: "uuid" },
                    quantity: { type: "integer", minimum: 1 },
                    size: { type: "string", example: "M" },
                    color: {
                      type: "object",
                      properties: {
                        name: { type: "string", example: "Red" },
                        hex: { type: "string", example: "#FF0000" },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Item added to cart" },
            404: { description: "Product not found" },
          },
        },
      },
      "/api/cart/{itemId}": {
        put: {
          tags: ["Cart"],
          summary: "Update cart item quantity",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "itemId",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["quantity"],
                  properties: {
                    quantity: { type: "integer", minimum: 1 },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Cart updated" },
          },
        },
        delete: {
          tags: ["Cart"],
          summary: "Remove item from cart",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "itemId",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            200: { description: "Item removed" },
          },
        },
      },
      "/api/cart/clear": {
        delete: {
          tags: ["Cart"],
          summary: "Clear entire cart",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Cart cleared" },
          },
        },
      },
      // ==================== ORDERS ====================
      "/api/orders": {
        get: {
          tags: ["Orders"],
          summary: "Get user orders",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "page",
              in: "query",
              schema: { type: "integer", default: 1 },
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 10 },
            },
          ],
          responses: {
            200: { description: "List of orders" },
          },
        },
        post: {
          tags: ["Orders"],
          summary: "Create new order",
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["shippingAddress"],
                  properties: {
                    shippingAddress: {
                      type: "object",
                      required: [
                        "firstName",
                        "lastName",
                        "address",
                        "city",
                        "state",
                        "phone",
                      ],
                      properties: {
                        firstName: { type: "string" },
                        lastName: { type: "string" },
                        address: { type: "string" },
                        city: { type: "string" },
                        state: { type: "string" },
                        country: { type: "string", default: "Nigeria" },
                        zipCode: { type: "string" },
                        phone: { type: "string" },
                      },
                    },
                    notes: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Order created with Paystack payment URL" },
            400: { description: "Cart is empty" },
          },
        },
      },
      "/api/orders/{id}": {
        get: {
          tags: ["Orders"],
          summary: "Get order by ID",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            200: { description: "Order details" },
            404: { description: "Order not found" },
          },
        },
      },
      "/api/orders/{id}/cancel": {
        put: {
          tags: ["Orders"],
          summary: "Cancel order",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    reason: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Order cancelled" },
            400: { description: "Cannot cancel order" },
          },
        },
      },
      "/api/orders/verify/{reference}": {
        get: {
          tags: ["Orders"],
          summary: "Verify Paystack payment",
          parameters: [
            {
              name: "reference",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "Payment verified" },
            400: { description: "Payment failed" },
          },
        },
      },
      // ==================== REVIEWS ====================
      "/api/reviews/product/{productId}": {
        get: {
          tags: ["Reviews"],
          summary: "Get product reviews",
          parameters: [
            {
              name: "productId",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
            {
              name: "page",
              in: "query",
              schema: { type: "integer", default: 1 },
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 10 },
            },
          ],
          responses: {
            200: { description: "Reviews with rating distribution" },
          },
        },
        post: {
          tags: ["Reviews"],
          summary: "Add product review",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "productId",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["rating", "comment"],
                  properties: {
                    rating: { type: "integer", minimum: 1, maximum: 5 },
                    title: { type: "string" },
                    comment: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Review added" },
            400: { description: "Already reviewed" },
          },
        },
      },
      // ==================== ADMIN ====================
      "/api/admin/dashboard": {
        get: {
          tags: ["Admin"],
          summary: "Get dashboard stats",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Dashboard statistics" },
          },
        },
      },
      "/api/admin/products": {
        get: {
          tags: ["Admin"],
          summary: "Get all products (admin)",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "All products including inactive" },
          },
        },
        post: {
          tags: ["Admin"],
          summary: "Create new product",
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: [
                    "name",
                    "description",
                    "price",
                    "category",
                    "subcategory",
                  ],
                  properties: {
                    name: { type: "string", example: "Classic T-Shirt" },
                    description: {
                      type: "string",
                      example: "Comfortable cotton t-shirt",
                    },
                    price: { type: "number", example: 2500 },
                    comparePrice: { type: "number", example: 3000 },
                    category: {
                      type: "string",
                      enum: ["men", "women", "kids"],
                      example: "men",
                    },
                    subcategory: { type: "string", example: "t-shirts" },
                    brand: { type: "string", example: "Nike" },
                    totalStock: { type: "integer", example: 100 },
                    sizes: {
                      type: "string",
                      description: "JSON string array",
                      example: '["S","M","L","XL"]',
                    },
                    colors: {
                      type: "string",
                      description: "JSON string array",
                      example: '["Black","White","Blue"]',
                    },
                    isActive: { type: "boolean", example: true },
                    featured: { type: "boolean", example: false },
                    images: {
                      type: "array",
                      items: { type: "string", format: "binary" },
                      description: "Product images (max 5)",
                      maxItems: 5,
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Product created successfully" },
            400: { description: "Validation error" },
            500: { description: "Server error" },
          },
        },
      },
      "/api/admin/products/{id}": {
        put: {
          tags: ["Admin"],
          summary: "Update product",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            200: { description: "Product updated" },
          },
        },
        delete: {
          tags: ["Admin"],
          summary: "Delete product",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            200: { description: "Product deleted" },
          },
        },
      },
      "/api/admin/orders": {
        get: {
          tags: ["Admin"],
          summary: "Get all orders",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "status", in: "query", schema: { type: "string" } },
            { name: "page", in: "query", schema: { type: "integer" } },
          ],
          responses: {
            200: { description: "All orders" },
          },
        },
      },
      "/api/admin/orders/{id}/status": {
        put: {
          tags: ["Admin"],
          summary: "Update order status",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["status"],
                  properties: {
                    status: {
                      type: "string",
                      enum: [
                        "pending",
                        "confirmed",
                        "processing",
                        "shipped",
                        "delivered",
                        "cancelled",
                      ],
                    },
                    trackingNumber: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Status updated" },
          },
        },
      },
      "/api/admin/users": {
        get: {
          tags: ["Admin"],
          summary: "Get all users",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "All users" },
          },
        },
      },
    },
  },
  apis: [],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
