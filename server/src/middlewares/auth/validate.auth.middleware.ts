import { NextFunction, Request, Response } from "express";
import Validator from "validatorjs";
import { ApiError } from "../error/api.error.middleware";

type AuthValidationMode = "signup" | "signin";

const validateAuthInput =
  (mode: AuthValidationMode) =>
  (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password } = req.body;

    // Define rules based on mode
    let rules: Validator.Rules = {};

    if (mode === "signup") {
      rules = {
        name: "required|string|between:3,50",
        email: "required|string|email|max:254",
        password: "required|string|between:6,15",
      };
    } else {
      // Signin
      rules = {
        email: "required|string|email",
        password: "required|string",
      };
    }

    // Sanitize inputs (trim) before validation
    if (req.body.name && typeof req.body.name === "string") {
      req.body.name = req.body.name.trim();
    }
    if (req.body.email && typeof req.body.email === "string") {
      req.body.email = req.body.email.trim().toLowerCase();
    }

    const validation = new Validator(req.body, rules);

    if (validation.fails()) {
      const errors = validation.errors.all();

      // Transform errors to match the expected format
      const formattedErrors = Object.keys(errors).map((key) => ({
        field: key,
        message: errors[key][0], // Take the first error message for each field
      }));

      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Validation failed",
        errors: formattedErrors,
      });
    }

    next();
  };

export { validateAuthInput };
