// JWT token verification middleware
// Validates Bearer tokens and checks user account status
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../error/api.error.middleware";
import { db } from "../../configs/database.config";
import { usersTable } from "../../models/user.model";
import { eq } from "drizzle-orm";

// Type definition for verified JWT token payload
type VerifiedTokenPayload = {
  id: string;
  email: string;
};

// Extend Express Request interface to include authenticated user
declare global {
  namespace Express {
    interface Request {
      authUser?: VerifiedTokenPayload;
    }
  }
}

/**
 * Middleware to verify JWT authentication token
 * Validates token, checks user existence, and attaches user data to request
 * 
 * @param req - Express request object
 * @param _res - Express response object (unused)
 * @param next - Express next function
 */
/**
 * Verify JWT authentication token and user account status
 * Extracts token from Authorization header, validates it, and checks user exists
 * Adds authenticated user info to request object for downstream use
 */
const verifyAuthToken = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if Authorization header is present
    if (!authHeader) {
      throw ApiError.unauthorized("Authorization header is required");
    }

    // Parse Bearer token format
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw ApiError.unauthorized(
        "Invalid authorization format. Use: Bearer <token>",
      );
    }

    const jwtSecret = process.env.JWT_SECRET;

    // Ensure JWT secret is configured
    if (!jwtSecret) {
      throw ApiError.internal("JWT secret is not configured");
    }

    // Verify and decode JWT token
    const decoded = jwt.verify(token, jwtSecret);

    if (typeof decoded === "string" || !decoded) {
      throw ApiError.unauthorized("Invalid token payload");
    }

    // Extract user information from token payload
    const payload = decoded as jwt.JwtPayload;
    const tokenUserId = payload.id;
    const tokenUserEmail = payload.email;

    // Validate token payload structure
    if (
      (typeof tokenUserId !== "string" && typeof tokenUserId !== "number") ||
      typeof tokenUserEmail !== "string"
    ) {
      throw ApiError.unauthorized("Invalid token payload");
    }

    // Ensure database connection is available
    if (!db) {
      throw ApiError.internal("Database connection not established");
    }

    // Verify user still exists and is not deleted
    const [user] = await db
      .select({ isDeleted: usersTable.isDeleted })
      .from(usersTable)
      .where(eq(usersTable.id, String(tokenUserId)));

    if (!user || user.isDeleted) {
      throw ApiError.unauthorized(
        "User account has been deleted or does not exist",
      );
    }

    // Attach authenticated user data to request
    req.authUser = {
      id: String(tokenUserId),
      email: tokenUserEmail,
    };

    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error instanceof jwt.TokenExpiredError) {
      return next(ApiError.unauthorized("Token has expired"));
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return next(ApiError.unauthorized("Invalid token"));
    }

    next(error); // Pass other errors to global error handler
  }
};

export { verifyAuthToken };
