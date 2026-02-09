import { NextFunction, Request, Response } from "express";
import { usersTable } from "../../models/user.model";
import { db } from "../../configs/database.config";
import { eq } from "drizzle-orm";

type User = typeof usersTable.$inferSelect;

declare global {
  namespace Express {
    interface Request {
      user?: User | null;
    }
  }
}

const checkUser =
  (mode: string) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      if (!db) {
        return res.status(500).json({
          success: false,
          statusCode: 500,
          message: "Database connection not established",
        });
      }

      const users = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email));

      const user = users[0] ?? null;

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

      req.user = user;
      next();
    } catch (err) {
      next(err);
    }
  };

export { checkUser };
