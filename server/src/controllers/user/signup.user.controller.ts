import bcrypt from "bcrypt";
import { usersTable } from "../../models/user.model.js";
import { ApiError } from "../../middlewares/error/api.error.middleware.js";
import { NextFunction, Request, Response } from "express";
import { db } from "../../configs/database.config.js";

const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;

    if (!db) {
      throw ApiError.badRequest("Database connection not established");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(usersTable)
      .values({
        name,
        email,
        password: hashedPassword,
      })
      .returning();

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        userId: newUser.id,
        userName: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

export { signup };
