import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ApiError } from "../../middlewares/error/api.error.middleware.js";
import { NextFunction, Request, Response } from "express";

// JWT token expiration time
const JWT_EXPIRES_IN = "7d" as const;

/**
 * User signin controller
 * Authenticates user credentials and returns JWT token
 * 
 * @param req - Express request object containing password and user data from middleware
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
/**
 * Handle user authentication and JWT token generation
 * Validates credentials and returns authentication token
 */
const signin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { password } = req.body as { password?: string };
    const user = req.user; // User data populated by checkUser middleware
    const jwtSecret = process.env.JWT_SECRET;

    // Validate user exists (should be guaranteed by middleware)
    if (!user) {
      throw ApiError.notFound("User not found");
    }

    // Validate password is provided
    if (typeof password !== "string" || password.length === 0) {
      throw ApiError.badRequest("Password is required");
    }

    // Ensure JWT secret is configured
    if (!jwtSecret) {
      throw ApiError.internal("JWT secret is not configured");
    }

    // Verify password against stored hash
    // Verify password against stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw ApiError.unauthorized("Invalid password");
    }

    // Generate JWT token with user information
    // Generate JWT token for authenticated user
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      jwtSecret,
      { expiresIn: JWT_EXPIRES_IN },
    );

    // Send success response with token and user data
    res.json({
      success: true,
      message: "SignIn successful",
      data: {
        userId: user.id,
        userName: user.name,
        token,
      },
    });
  } catch (error) {
    next(error); // Pass error to global error handler
  }
};

export { signin };
