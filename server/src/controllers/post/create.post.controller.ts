import { NextFunction, Request, Response } from "express";
import { db } from "../../configs/database.config";
import { postsTable } from "../../models/post.model";
import { ApiError } from "../../middlewares/error/api.error.middleware";

const createPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { description } = req.body as {
      description?: string;
    };
    const authUser = req.authUser;
    const imageFile = req.file;

    if (!authUser) {
      throw ApiError.unauthorized("Unauthorized");
    }

    if (!imageFile) {
      throw ApiError.badRequest("Image is required");
    }

    if (!db) {
      throw ApiError.internal("Database connection not established");
    }

    const imagePath = `/uploads/posts/${imageFile.filename}`;

    await db.insert(postsTable).values({
      image: imagePath,
      description,
      userId: authUser.id,
    });

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: {
        image: imagePath,
      },
    });
  } catch (error) {
    next(error);
  }
};

export { createPost };
