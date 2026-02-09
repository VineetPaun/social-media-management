import { NextFunction, Request, Response } from "express";
import { db } from "../../configs/database.config";
import { likesTable } from "../../models/like.model";
import { postsTable } from "../../models/post.model";
import { ApiError } from "../../middlewares/error/api.error.middleware";
import { and, eq, count } from "drizzle-orm";

const toggleLike = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authUser = req.authUser;
    const { postId } = req.params as { postId?: string };

    if (!authUser) {
      throw ApiError.unauthorized("Unauthorized");
    }

    if (!db) {
      throw ApiError.internal("Database connection not established");
    }

    if (!postId) {
      throw ApiError.badRequest("Post ID is required");
    }

    // Check that the post exists and is not deleted
    const [post] = await db
      .select({ id: postsTable.id })
      .from(postsTable)
      .where(and(eq(postsTable.id, postId), eq(postsTable.isDeleted, false)));

    if (!post) {
      throw ApiError.notFound("Post not found");
    }

    // Check if already liked
    const [existingLike] = await db
      .select()
      .from(likesTable)
      .where(
        and(eq(likesTable.userId, authUser.id), eq(likesTable.postId, postId)),
      );

    let liked: boolean;

    if (existingLike) {
      // Unlike
      await db
        .delete(likesTable)
        .where(
          and(
            eq(likesTable.userId, authUser.id),
            eq(likesTable.postId, postId),
          ),
        );
      liked = false;
    } else {
      // Like
      await db.insert(likesTable).values({
        userId: authUser.id,
        postId,
      });
      liked = true;
    }

    // Get updated like count
    const [likeCountResult] = await db
      .select({ count: count() })
      .from(likesTable)
      .where(eq(likesTable.postId, postId));

    const likeCount = likeCountResult ? likeCountResult.count : 0;

    res.status(200).json({
      success: true,
      message: liked ? "Post liked" : "Post unliked",
      data: {
        liked,
        likeCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export { toggleLike };
