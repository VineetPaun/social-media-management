import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { NextFunction, Request, Response } from "express";
import multer from "multer";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(currentDir, "../../../uploads/profiles");
fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const profileImageUpload = multer({
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
    fileSize: 2 * 1024 * 1024, // 2MB limit for profile pics
  },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      callback(new Error("Only JPEG, PNG, and WEBP images are allowed"));
      return;
    }
    callback(null, true);
  },
});

const uploadProfileImage = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  profileImageUpload.single("profilePic")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: "Validation failed",
          errors: [
            {
              field: "profilePic",
              message: "Profile picture must be at most 2MB",
            },
          ],
        });
      }

      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Validation failed",
        errors: [{ field: "profilePic", message: error.message }],
      });
    }

    const uploadErrorMessage =
      error instanceof Error ? error.message : "Profile picture upload failed";

    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Validation failed",
      errors: [{ field: "profilePic", message: uploadErrorMessage }],
    });
  });
};

export { uploadProfileImage };
