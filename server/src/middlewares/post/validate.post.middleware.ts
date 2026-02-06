import { NextFunction, Request, Response } from "express";
import validator from "validator";

type AuthValidationError = {
  field: "description" | "image";
  message: string;
};

const validatePostInput = (req: Request, res: Response, next: NextFunction) => {
  const {
    image: imageRaw,
    description: descriptionRaw,
  } = req.body as {
    image?: string;
    description?: string;
  };
  const errors: AuthValidationError[] = [];

  if (imageRaw === undefined || imageRaw === null || imageRaw === "") {
    errors.push({ field: "image", message: "Image is required" });
  } else if (typeof imageRaw !== "string") {
    errors.push({ field: "image", message: "Image must be a string" });
  } else {
    const trimmedImage = imageRaw.trim();
  }

  if (typeof descriptionRaw !== "string") {
    errors.push({ field: "description", message: "Description must be a string" });
  } else {
    const trimmedEmail = descriptionRaw.trim().toLowerCase();
    if (!validator.isLength(trimmedEmail, { max: 500 })) {
      errors.push({
        field: "description",
        message: "Description must be at max 500 characters",
      });
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

  if (typeof imageRaw === "string") {
    req.body.image = imageRaw.trim();
  }
  if (typeof descriptionRaw === "string") {
    req.body.description = descriptionRaw.trim()
  }
  next();
};

export { validatePostInput };
