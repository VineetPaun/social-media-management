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

const verifyAuthToken = (req: Request, _res: Response, next: NextFunction) => {
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
