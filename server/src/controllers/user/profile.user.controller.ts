import { NextFunction, Request, Response } from "express";
import { db } from "../../configs/database.config";
import { usersTable } from "../../models/user.model";
import { postsTable } from "../../models/post.model";
import { ApiError } from "../../middlewares/error/api.error.middleware";
import { and, eq } from "drizzle-orm";

const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params as { userId: string };

    if (!db) {
      throw ApiError.internal("Database connection not established");
    }

    const [user] = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        profilePic: usersTable.profilePic,
        isDeleted: usersTable.isDeleted,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (!user || user.isDeleted) {
      throw ApiError.notFound("User not found");
    }

    const posts = await db
      .select({
        id: postsTable.id,
        description: postsTable.description,
        image: postsTable.image,
      })
      .from(postsTable)
      .where(
        and(eq(postsTable.userId, userId), eq(postsTable.isDeleted, false)),
      );

    // Remove isDeleted from user object before sending response
    const { isDeleted, ...userResponse } = user;

    res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: {
        ...userResponse,
        postCount: posts.length,
        posts,
      },
    });
  } catch (error) {
    next(error);
  }
};

export { getProfile };
