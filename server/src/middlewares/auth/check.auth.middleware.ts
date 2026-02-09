// User existence check middleware
// Validates user exists for signin or doesn't exist for signup
import { NextFunction, Request, Response } from "express";
import { usersTable } from "../../models/user.model";
import { db } from "../../configs/database.config";
import { eq } from "drizzle-orm";

// Type definition for user data
type User = typeof usersTable.$inferSelect;

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: User | null;
    }
  }
}

/**
 * Middleware to check user existence and status
 * Used for both signup and signin flows
 * 
 * @param mode - "signup" or "signin" to determine validation logic
 * @returns Express middleware function
 */
/**
 * Check user existence based on operation mode
 * For signup: ensures user doesn't already exist
 * For signin: ensures user exists and is not deleted
 */
const checkUser =
  (mode: string) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      
      // Ensure database connection is available
      if (!db) {
        return res.status(500).json({
          success: false,
          statusCode: 500,
          message: "Database connection not established",
        });
      }

      // Query user by email
      const users = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email));

      const user = users[0] ?? null;

      // For signup: reject if user already exists
      if (mode === "signup" && user) {
        return res.status(409).json({
          success: false,
          statusCode: 409,
          message: "User already exists",
          errors: [
            { field: "username", message: "This username is already taken" },
          ],
        });
      }

      // For signin: reject if user doesn't exist or is deleted
      if (mode === "signin") {
        if (!user || user.isDeleted) {
          return res.status(404).json({
            success: false,
            statusCode: 404,
            message: "User not found",
            errors: [
              {
                field: "username",
                message: "No active account found with this username",
              },
            ],
          });
        }
      }

      // Attach user data to request for next middleware
      req.user = user;
      next();
    } catch (err) {
      next(err); // Pass error to global error handler
    }
  };

export { checkUser };
