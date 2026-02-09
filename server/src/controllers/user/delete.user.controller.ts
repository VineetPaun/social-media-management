import { NextFunction, Request, Response } from "express";
import { db } from "../../configs/database.config";
import { usersTable } from "../../models/user.model";
import { postsTable } from "../../models/post.model";
import { ApiError } from "../../middlewares/error/api.error.middleware";
import { eq } from "drizzle-orm";

/**
 * Soft delete user account and all associated posts
 * Marks user and posts as deleted without removing from database
 */
const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authUser = req.authUser;

    if (!authUser) {
      throw ApiError.unauthorized("Unauthorized");
    }

    if (!db) {
      throw ApiError.internal("Database connection not established");
    }

    console.log(`[DELETE USER] Soft deleting user: ${authUser.id}`);

    // Soft delete user
    const [deletedUser] = await db
      .update(usersTable)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
      })
      .where(eq(usersTable.id, authUser.id))
      .returning({ id: usersTable.id });

    if (!deletedUser) {
      throw ApiError.notFound("User not found");
    }

    // Soft delete all user's posts
    await db
      .update(postsTable)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
      })
      .where(eq(postsTable.userId, authUser.id));

    res.status(200).json({
      success: true,
      message: "Account and associated posts deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export { deleteUser };
