const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const logger = require("./logger");

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const ALLOWED_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const isSafeOriginalName = (name) =>
  typeof name === "string" && !name.includes("\0") && name.length <= 255;

const imageFileFilter = (req, file, cb) => {
  const mimeType = String(file.mimetype || "").toLowerCase();
  const ext = path.extname(String(file.originalname || "")).toLowerCase();

  if (!isSafeOriginalName(file.originalname)) {
    return cb(new Error("Invalid filename"), false);
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
    return cb(
      new Error("Invalid file type. Only JPEG, PNG and WebP are allowed."),
      false,
    );
  }

  if (!ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
    return cb(
      new Error(
        "Invalid file extension. Only .jpg, .jpeg, .png and .webp are allowed.",
      ),
      false,
    );
  }

  return cb(null, true);
};

// Check if Cloudinary is configured
const isCloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== "your_cloud_name" &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_KEY !== "your_api_key";

let storage;
let upload;
let avatarStorage;
let avatarUpload;

if (isCloudinaryConfigured) {
  // Use Cloudinary storage
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "clothing-store",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [{ width: 800, height: 1000, crop: "limit" }],
    },
  });

  upload = multer({
    storage: storage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024, files: 5 }, // 5MB limit
  });

  // Avatar storage for Cloudinary
  avatarStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "clothing-store/avatars",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [
        { width: 200, height: 200, crop: "fill", gravity: "face" },
      ],
    },
  });

  avatarUpload = multer({
    storage: avatarStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 2 * 1024 * 1024, files: 1 }, // 2MB limit
  });
} else {
  // Use local disk storage as fallback
  logger.warn("Cloudinary not configured - using local file storage");

  // Ensure uploads directory exists
  const uploadsDir = path.join(__dirname, "../uploads/products");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Ensure avatars directory exists
  const avatarsDir = path.join(__dirname, "../uploads/avatars");
  if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix =
        Date.now() + "-" + crypto.randomBytes(8).toString("hex");
      const ext = path.extname(file.originalname);
      cb(null, "product-" + uniqueSuffix + ext);
    },
  });

  // Avatar storage for local
  avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, avatarsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix =
        Date.now() + "-" + crypto.randomBytes(8).toString("hex");
      const ext = path.extname(file.originalname);
      cb(null, "avatar-" + uniqueSuffix + ext);
    },
  });

  upload = multer({
    storage: storage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024, files: 5 }, // 5MB limit
  });

  avatarUpload = multer({
    storage: avatarStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 2 * 1024 * 1024, files: 1 }, // 2MB limit for avatars
  });
}

module.exports = { cloudinary, upload, avatarUpload, isCloudinaryConfigured };
