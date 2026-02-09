import { NextFunction, Request, Response } from "express";
import { db } from "../../configs/database.config";
import { commentsTable } from "../../models/comment.model";
import { postsTable } from "../../models/post.model";
import { usersTable } from "../../models/user.model";
import { ApiError } from "../../middlewares/error/api.error.middleware";
import { and, eq, desc, count } from "drizzle-orm";

const createComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = req.authUser;
    const { postId } = req.params as { postId?: string };
    const { content } = (req.body || {}) as { content?: string };

    if (!authUser) {
      throw ApiError.unauthorized("Unauthorized");
    }

    if (!db) {
      throw ApiError.internal("Database connection not established");
    }

    if (!postId) {
      throw ApiError.badRequest("Post ID is required");
    }

    if (!content || content.trim().length === 0) {
      throw ApiError.badRequest("Comment content is required");
    }

    if (content.trim().length > 500) {
      throw ApiError.badRequest("Comment must be 500 characters or less");
    }

    // Check that the post exists and is not deleted
    const [post] = await db
      .select({ id: postsTable.id })
      .from(postsTable)
      .where(and(eq(postsTable.id, postId), eq(postsTable.isDeleted, false)));

    if (!post) {
      throw ApiError.notFound("Post not found");
    }

    const [newComment] = await db
      .insert(commentsTable)
      .values({
        userId: authUser.id,
        postId,
        content: content.trim(),
      })
      .returning({
        id: commentsTable.id,
        content: commentsTable.content,
        createdAt: commentsTable.createdAt,
      });

    // Get user info for the response
    const [user] = await db
      .select({
        name: usersTable.name,
        profilePic: usersTable.profilePic,
      })
      .from(usersTable)
      .where(eq(usersTable.id, authUser.id));

    res.status(201).json({
      success: true,
      message: "Comment added",
      data: {
        id: newComment.id,
        content: newComment.content,
        createdAt: newComment.createdAt,
        userId: authUser.id,
        userName: user?.name || "Unknown",
        userProfilePic: user?.profilePic || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getComments = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
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

    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "50", 10);
    const offset = (page - 1) * limit;

    const comments = await db
      .select({
        id: commentsTable.id,
        content: commentsTable.content,
        createdAt: commentsTable.createdAt,
        userId: commentsTable.userId,
        userName: usersTable.name,
        userProfilePic: usersTable.profilePic,
      })
      .from(commentsTable)
      .leftJoin(usersTable, eq(commentsTable.userId, usersTable.id))
      .where(
        and(
          eq(commentsTable.postId, postId),
          eq(commentsTable.isDeleted, false),
        ),
      )
      .orderBy(desc(commentsTable.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalResult] = await db
      .select({ count: count() })
      .from(commentsTable)
      .where(
        and(
          eq(commentsTable.postId, postId),
          eq(commentsTable.isDeleted, false),
        ),
      );

    const totalComments = totalResult ? totalResult.count : 0;

    res.status(200).json({
      success: true,
      message: "Comments fetched",
      data: comments,
      pagination: {
        page,
        limit,
        totalComments,
        totalPages: Math.ceil(totalComments / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = req.authUser;
    const { commentId } = req.params as { commentId?: string };

    if (!authUser) {
      throw ApiError.unauthorized("Unauthorized");
    }

    if (!db) {
      throw ApiError.internal("Database connection not established");
    }

    if (!commentId) {
      throw ApiError.badRequest("Comment ID is required");
    }

    const [deleted] = await db
      .update(commentsTable)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
      })
      .where(
        and(
          eq(commentsTable.id, commentId),
          eq(commentsTable.userId, authUser.id),
          eq(commentsTable.isDeleted, false),
        ),
      )
      .returning({ id: commentsTable.id });

    if (!deleted) {
      throw ApiError.notFound("Comment not found");
    }

    res.status(200).json({
      success: true,
      message: "Comment deleted",
      data: { commentId: deleted.id },
    });
  } catch (error) {
    next(error);
  }
};

export { createComment, getComments, deleteComment };
