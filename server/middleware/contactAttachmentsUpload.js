const multer = require("multer");
const path = require("path");

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_ATTACHMENTS = 5;

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf",
]);

const allowedExtensionsByMime = {
  "image/jpeg": new Set([".jpg", ".jpeg"]),
  "image/jpg": new Set([".jpg", ".jpeg"]),
  "image/png": new Set([".png"]),
  "application/pdf": new Set([".pdf"]),
};

const hasPrefix = (buffer, bytes) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < bytes.length) return false;
  for (let i = 0; i < bytes.length; i += 1) {
    if (buffer[i] !== bytes[i]) return false;
  }
  return true;
};

const detectMimeFromBuffer = (buffer) => {
  if (hasPrefix(buffer, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (hasPrefix(buffer, [0x89, 0x50, 0x4e, 0x47])) return "image/png";
  if (hasPrefix(buffer, [0x25, 0x50, 0x44, 0x46])) return "application/pdf";
  return null;
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: MAX_ATTACHMENTS,
  },
  fileFilter: (req, file, cb) => {
    const mimeType = String(file.mimetype || "").toLowerCase();
    const originalName = String(file.originalname || "");
    const extension = path.extname(originalName).toLowerCase();
    const allowedExtensions = allowedExtensionsByMime[mimeType] || new Set();

    if (originalName.includes("\0") || originalName.length > 255) {
      const error = new Error("Invalid filename");
      error.code = "INVALID_FILENAME";
      return cb(error);
    }

    if (!allowedMimeTypes.has(mimeType)) {
      const error = new Error("Only JPG, PNG, or PDF files are allowed");
      error.code = "INVALID_FILE_TYPE";
      return cb(error);
    }

    if (!allowedExtensions.has(extension)) {
      const error = new Error("Invalid file extension");
      error.code = "INVALID_FILE_EXTENSION";
      return cb(error);
    }

    return cb(null, true);
  },
});

const contactAttachmentsUpload = (req, res, next) => {
  upload.array("attachments")(req, res, (err) => {
    if (!err) {
      const files = Array.isArray(req.files) ? req.files : [];
      for (const file of files) {
        const normalizedMime =
          file.mimetype === "image/jpg" ? "image/jpeg" : file.mimetype;
        const detectedMime = detectMimeFromBuffer(file.buffer);

        if (!detectedMime || detectedMime !== normalizedMime) {
          return res.status(400).json({
            message:
              "Attachment content does not match its file type. Please upload valid JPG, PNG, or PDF files.",
          });
        }
      }
      return next();
    }

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "Each attachment must be 5MB or less",
      });
    }

    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        message: `A maximum of ${MAX_ATTACHMENTS} attachments is allowed`,
      });
    }

    if (err.code === "INVALID_FILE_TYPE") {
      return res.status(400).json({
        message: "Only JPG, PNG, or PDF attachments are allowed",
      });
    }

    if (err.code === "INVALID_FILE_EXTENSION") {
      return res.status(400).json({
        message: "Attachment extension must match JPG, PNG, or PDF",
      });
    }

    if (err.code === "INVALID_FILENAME") {
      return res.status(400).json({
        message: "Attachment filename is invalid",
      });
    }

    return res.status(400).json({
      message: err.message || "Invalid attachment upload",
    });
  });
};

module.exports = {
  contactAttachmentsUpload,
  MAX_FILE_SIZE_BYTES,
  MAX_ATTACHMENTS,
};
