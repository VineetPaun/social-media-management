import { NextFunction, Request, Response } from "express";
import validator from "validator";

type PostValidationError = {
  field: "description" | "image" | "postId";
  message: string;
};

type PostValidationMode = "create" | "edit" | "delete";

const validatePostInput =
  (mode: PostValidationMode) =>
  (req: Request, res: Response, next: NextFunction) => {
    console.log(`validatePostInput called with mode: ${mode}`);
    console.log("req.params:", req.params);
    console.log("req.body:", req.body);

    const body = (req.body || {}) as {
      description?: unknown;
      image?: unknown;
    };
    const { description: descriptionRaw, image: imageRaw } = body;
    const { postId } = req.params as {
      postId?: string;
    };
    const errors: PostValidationError[] = [];
    const hasImageString =
      typeof imageRaw === "string" && imageRaw.trim().length > 0;

    if (mode === "create" && !req.file && !hasImageString) {
      errors.push({ field: "image", message: "Image is required" });
    }

    if (mode !== "create" && !postId) {
      errors.push({ field: "postId", message: "Post id is required" });
    }

    if (
      mode !== "delete" &&
      descriptionRaw !== undefined &&
      descriptionRaw !== null &&
      descriptionRaw !== ""
    ) {
      if (typeof descriptionRaw !== "string") {
        errors.push({
          field: "description",
          message: "Description must be a string",
        });
      } else {
        const trimmedDescription = descriptionRaw.trim();
        if (!validator.isLength(trimmedDescription, { max: 500 })) {
          errors.push({
            field: "description",
            message: "Description must be at max 500 characters",
          });
        }
      }
    }

    if (mode === "edit" && !req.file && !hasImageString) {
      const hasDescription =
        typeof descriptionRaw === "string" && descriptionRaw.trim().length > 0;

      if (!hasDescription) {
        errors.push({
          field: "description",
          message: "Provide at least one field to update",
        });
      }
    }

    if (errors.length > 0) {
      console.log("Post validation failed:", errors);
      console.log("req.file:", req.file);
      console.log("imageRaw:", imageRaw);
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Validation failed",
        errors,
      });
    }

    if (!req.body) {
      req.body = {};
    }

    if (typeof descriptionRaw === "string") {
      req.body.description = descriptionRaw.trim();
    } else {
      req.body.description = undefined;
    }

    if (typeof imageRaw === "string") {
      req.body.image = imageRaw.trim();
    } else {
      req.body.image = undefined;
    }

    next();
  };

export { validatePostInput };
