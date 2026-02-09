import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../error/api.error.middleware";

type VerifiedTokenPayload = {
  id: string;
  email: string;
};

declare global {
  namespace Express {
    interface Request {
      authUser?: VerifiedTokenPayload;
    }
  }
}

import { db } from "../../configs/database.config";
import { usersTable } from "../../models/user.model";
import { eq } from "drizzle-orm";

const verifyAuthToken = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw ApiError.unauthorized("Authorization header is required");
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw ApiError.unauthorized(
        "Invalid authorization format. Use: Bearer <token>",
      );
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw ApiError.internal("JWT secret is not configured");
    }

    const decoded = jwt.verify(token, jwtSecret);

    if (typeof decoded === "string" || !decoded) {
      throw ApiError.unauthorized("Invalid token payload");
    }

    const payload = decoded as jwt.JwtPayload;
    const tokenUserId = payload.id;
    const tokenUserEmail = payload.email;

    if (
      (typeof tokenUserId !== "string" && typeof tokenUserId !== "number") ||
      typeof tokenUserEmail !== "string"
    ) {
      throw ApiError.unauthorized("Invalid token payload");
    }

    if (!db) {
      throw ApiError.internal("Database connection not established");
    }

    // Check if user exists and is not deleted
    const [user] = await db
      .select({ isDeleted: usersTable.isDeleted })
      .from(usersTable)
      .where(eq(usersTable.id, String(tokenUserId)));

    if (!user || user.isDeleted) {
      throw ApiError.unauthorized(
        "User account has been deleted or does not exist",
      );
    }

    req.authUser = {
      id: String(tokenUserId),
      email: tokenUserEmail,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(ApiError.unauthorized("Token has expired"));
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return next(ApiError.unauthorized("Invalid token"));
    }

    next(error);
  }
};

export { verifyAuthToken };
