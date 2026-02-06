import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ApiError } from "../../middlewares/error/api.error.middleware.js";
import { NextFunction, Request, Response } from "express";

const JWT_EXPIRES_IN = "7d" as const;

const signin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { password } = req.body as { password?: string };
    const user = req.user;
    const jwtSecret = process.env.JWT_SECRET;

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    if (typeof password !== "string" || password.length === 0) {
      throw ApiError.badRequest("Password is required");
    }

    if (!jwtSecret) {
      throw ApiError.internal("JWT secret is not configured");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw ApiError.unauthorized("Invalid password");
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      jwtSecret,
      { expiresIn: JWT_EXPIRES_IN },
    );

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
    next(error);
  }
};

export { signin };
