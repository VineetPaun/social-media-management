// Post image upload middleware using Multer
// Handles file upload, validation, and storage for post images
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { NextFunction, Request, Response } from "express";
import multer from "multer";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(currentDir, "../../../uploads/posts");
// Create uploads directory if it doesn't exist
fs.mkdirSync(uploadDir, { recursive: true });

// Allowed image MIME types for security
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

// Multer configuration for post image uploads
const postImageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => {
      callback(null, uploadDir);
    },
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      callback(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      callback(new Error("Only JPEG, PNG, and WEBP images are allowed"));
      return;
    }
    callback(null, true);
  },
});

/**
 * Express middleware for handling post image uploads
 * Processes single image upload with error handling and validation
 */
const uploadPostImage = (req: Request, res: Response, next: NextFunction) => {
  postImageUpload.single("image")(req, res, (error) => {
    if (!error) {
      console.log("Upload successful, file:", req.file?.filename);
      return next();
    }

    console.log("Upload error:", error);

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: "Validation failed",
          errors: [{ field: "image", message: "Image must be at most 5MB" }],
        });
      }

      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Validation failed",
        errors: [{ field: "image", message: error.message }],
      });
    }

    const uploadErrorMessage =
      error instanceof Error ? error.message : "Image upload failed";

    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Validation failed",
      errors: [{ field: "image", message: uploadErrorMessage }],
    });
  });
};

export { uploadPostImage };
