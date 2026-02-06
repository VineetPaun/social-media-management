import { NextFunction, Request, Response } from "express";
import { db } from "../../configs/database.config";
import { postsTable } from "../../models/post.model";
import { ApiError } from "../../middlewares/error/api.error.middleware";

const createPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { image, description } = req.body as {
      image: string;
      description?: string;
    };
    const authUser = req.authUser;

    if (!authUser) {
      throw ApiError.unauthorized("Unauthorized");
    }

    if (!db) {
      throw ApiError.internal("Database connection not established");
    }

    await db.insert(postsTable).values({
      image,
      description,
      userId: authUser.id,
    });

    res.status(201).json({
      success: true,
      message: "Post created successfully",
    });
  } catch (error) {
    next(error);
  }
};

export { createPost };
