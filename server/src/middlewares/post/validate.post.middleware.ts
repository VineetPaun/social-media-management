import { NextFunction, Request, Response } from "express";
import Validator from "validatorjs";

type PostValidationMode = "create" | "edit" | "delete";

const validatePostInput =
  (mode: PostValidationMode) =>
  (req: Request, res: Response, next: NextFunction) => {
    // Initialize req.body if undefined
    if (!req.body) {
      req.body = {};
    }

    // Sanitize inputs (trim)
    if (req.body.description && typeof req.body.description === "string") {
      req.body.description = req.body.description.trim();
    }
    if (req.body.image && typeof req.body.image === "string") {
      req.body.image = req.body.image.trim();
    }

    const data = {
      ...req.body,
      postId: req.params.postId,
      file: req.file,
    };

    let rules: Validator.Rules = {};

    if (mode === "create") {
      rules = {
        description: "string|max:500",
        image: "required_without:file|string",
        file: "required_without:image",
      };
    } else if (mode === "edit") {
      rules = {
        postId: "required",
        description: "string|max:500",
        image: "string",
      };
    } else if (mode === "delete") {
      rules = {
        postId: "required",
      };
    }

    const validation = new Validator(data, rules);

    if (validation.fails()) {
      const errors = validation.errors.all();

      const formattedErrors = Object.keys(errors).map((key) => ({
        field: key,
        message: errors[key][0],
      }));

      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Validation failed",
        errors: formattedErrors,
      });
    }

    // Additional check for Edit mode: Must provide at least one field to update
    if (mode === "edit") {
      const hasDescription = !!req.body.description;
      const hasImage = !!req.body.image || !!req.file;

      if (!hasDescription && !hasImage) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: "Validation failed",
          errors: [
            {
              field: "description",
              message: "Provide at least one field to update",
            },
          ],
        });
      }
    }

    next();
  };

export { validatePostInput };
