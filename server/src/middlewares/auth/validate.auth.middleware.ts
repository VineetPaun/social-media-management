import { NextFunction, Request, Response } from "express";
import validator from "validator";

type AuthValidationError = {
  field: "name" | "password" | "email";
  message: string;
};

type AuthValidationMode = "signup" | "signin";

const validateAuthInput =
  (mode: AuthValidationMode) =>
  (req: Request, res: Response, next: NextFunction) => {
    const {
      name: usernameRaw,
      password: passwordRaw,
      email: emailRaw,
    } = req.body as {
      name?: string;
      password?: string;
      email?: string;
    };
    const errors: AuthValidationError[] = [];

    // Name is only required for signup
    if (mode === "signup") {
      if (
        usernameRaw === undefined ||
        usernameRaw === null ||
        usernameRaw === ""
      ) {
        errors.push({ field: "name", message: "Username is required" });
      } else if (typeof usernameRaw !== "string") {
        errors.push({ field: "name", message: "Username must be a string" });
      } else {
        const trimmedUsername = usernameRaw.trim();

        if (!validator.isLength(trimmedUsername, { min: 3, max: 50 })) {
          errors.push({
            field: "name",
            message: "Username must be between 3 and 50 characters",
          });
        }
      }
    }

    if (
      passwordRaw === undefined ||
      passwordRaw === null ||
      passwordRaw === ""
    ) {
      errors.push({ field: "password", message: "Password is required" });
    } else if (typeof passwordRaw !== "string") {
      errors.push({ field: "password", message: "Password must be a string" });
    } else {
      if (!validator.isLength(passwordRaw, { min: 6, max: 15 })) {
        errors.push({
          field: "password",
          message: "Password must be at between 6 and 15 characters",
        });
      }
    }

    if (emailRaw === undefined || emailRaw === null || emailRaw === "") {
      errors.push({ field: "email", message: "Email is required" });
    } else if (typeof emailRaw !== "string") {
      errors.push({ field: "email", message: "Email must be a string" });
    } else {
      const trimmedEmail = emailRaw.trim().toLowerCase();

      if (!validator.isLength(trimmedEmail, { min: 3, max: 254 })) {
        errors.push({
          field: "email",
          message: "Email must be between 3 and 254 characters",
        });
      } else if (!validator.isEmail(trimmedEmail)) {
        errors.push({ field: "email", message: "Email format is invalid" });
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

    if (typeof usernameRaw === "string") {
      req.body.name = usernameRaw.trim();
    }
    if (typeof emailRaw === "string") {
      req.body.email = emailRaw.trim().toLowerCase();
    }
    next();
  };

export { validateAuthInput };
