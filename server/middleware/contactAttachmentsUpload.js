const multer = require("multer");

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      const error = new Error("Only JPG, PNG, or PDF files are allowed");
      error.code = "INVALID_FILE_TYPE";
      return cb(error);
    }
    return cb(null, true);
  },
});

const contactAttachmentsUpload = (req, res, next) => {
  upload.array("attachments")(req, res, (err) => {
    if (!err) return next();

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "Each attachment must be 5MB or less",
      });
    }

    if (err.code === "INVALID_FILE_TYPE") {
      return res.status(400).json({
        message: "Only JPG, PNG, or PDF attachments are allowed",
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
};
