import { NextFunction, Request, Response } from "express";
import validator from "validator";

type PostValidationError = {
  field: "description" | "image";
  message: string;
};

const validatePostInput = (req: Request, res: Response, next: NextFunction) => {
  const { description: descriptionRaw } = req.body as {
    description?: unknown;
  };
  const errors: PostValidationError[] = [];

  if (!req.file) {
    errors.push({ field: "image", message: "Image is required" });
  }

  if (
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

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Validation failed",
      errors,
    });
  }

  if (typeof descriptionRaw === "string") {
    req.body.description = descriptionRaw.trim();
  } else {
    req.body.description = undefined;
  }

  next();
};

export { validatePostInput };
