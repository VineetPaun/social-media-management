import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { NextFunction, Request, Response } from "express";
import { db } from "../../configs/database.config";
import { postsTable } from "../../models/post.model";
import { usersTable } from "../../models/user.model";
import { ApiError } from "../../middlewares/error/api.error.middleware";
import { and, eq } from "drizzle-orm";

type PostMode = "create" | "edit" | "delete" | "get";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const uploadsRootDir = path.resolve(currentDir, "../../../uploads");

const removeUploadedImage = async (publicImagePath?: string | null) => {
  if (!publicImagePath) {
    return;
  }

  const normalizedPath = publicImagePath.replace(/^\/+/, "");

  if (!normalizedPath.startsWith("uploads/")) {
    return;
  }

  const absoluteImagePath = path.resolve(
    uploadsRootDir,
    normalizedPath.replace(/^uploads\//, ""),
  );

  try {
    await fs.unlink(absoluteImagePath);
  } catch (error) {
    const fsError = error as NodeJS.ErrnoException;
    if (fsError.code !== "ENOENT") {
      throw error;
    }
  }
};

const post =
  (mode: PostMode) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { description, image: imageRaw } = (req.body || {}) as {
        description?: string;
        image?: string;
      };
      const { postId } = req.params as {
        postId?: string;
      };
      const authUser = req.authUser;
      const imageFile = req.file;

      if (!authUser) {
        throw ApiError.unauthorized("Unauthorized");
      }

      if (!db) {
        throw ApiError.internal("Database connection not established");
      }

      const imagePathFromBody =
        typeof imageRaw === "string" && imageRaw.trim().length > 0
          ? imageRaw.trim()
          : undefined;

      const imagePath = imageFile
        ? `/uploads/posts/${imageFile.filename}`
        : imagePathFromBody;

      if (mode === "get") {
        const posts = await db
          .select({
            id: postsTable.id,
            description: postsTable.description,
            image: postsTable.image,
            userId: postsTable.userId,
            userName: usersTable.name,
            userProfilePic: usersTable.profilePic,
          })
          .from(postsTable)
          .leftJoin(usersTable, eq(postsTable.userId, usersTable.id))
          .where(
            and(
              eq(postsTable.isDeleted, false),
              eq(usersTable.isDeleted, false),
            ),
          ); // Filter out soft deleted posts and posts from soft deleted users

        return res.status(200).json({
          success: true,
          message: "Posts fetched successfully",
          data: posts,
        });
      }

      if (mode === "create") {
        if (!imagePath) {
          throw ApiError.badRequest("Image is required");
        }

        await db.insert(postsTable).values({
          image: imagePath,
          description,
          userId: authUser.id,
        });
      } else if (mode === "edit") {
        if (!postId) {
          throw ApiError.badRequest("Post id is required");
        }

        const updateValues: {
          image?: string;
          description?: string;
        } = {};

        if (imagePath) {
          updateValues.image = imagePath;
        }

        if (description && description.length > 0) {
          updateValues.description = description;
        }

        if (Object.keys(updateValues).length === 0) {
          throw ApiError.badRequest("Provide at least one field to update");
        }

        const [updatedPost] = await db
          .update(postsTable)
          .set(updateValues)
          .where(
            and(eq(postsTable.id, postId), eq(postsTable.userId, authUser.id)),
          )
          .returning({
            id: postsTable.id,
            image: postsTable.image,
            description: postsTable.description,
          });

        if (!updatedPost) {
          throw ApiError.notFound("Post not found");
        }
      } else if (mode === "delete") {
        console.log(
          `[DELETE] Starting soft deletion process for post: ${postId}, user: ${authUser.id}`,
        );

        if (!postId) {
          throw ApiError.badRequest("Post id is required");
        }

        let softDeletedPost;
        try {
          console.log(`[DELETE] Attempting DB soft delete update...`);
          // Perform soft delete by updating isDeleted flag
          const result = await db
            .update(postsTable)
            .set({
              isDeleted: true,
              deletedAt: new Date(),
            })
            .where(
              and(
                eq(postsTable.id, postId),
                eq(postsTable.userId, authUser.id),
                eq(postsTable.isDeleted, false),
              ),
            )
            .returning({
              id: postsTable.id,
              image: postsTable.image,
            });

          softDeletedPost = result[0];
          console.log(`[DELETE] DB soft delete result:`, softDeletedPost);
        } catch (dbError) {
          console.error(`[DELETE] DB Error:`, dbError);
          throw ApiError.internal("Database error during post deletion");
        }

        if (!softDeletedPost) {
          console.log(`[DELETE] Post not found or not owned by user`);
          throw ApiError.notFound("Post not found");
        }

        // We do NOT delete the image file for soft delete to preserve data

        return res.status(200).json({
          success: true,
          message: "Post deleted successfully",
          data: {
            postId: softDeletedPost.id,
          },
        });
      }

      res.status(mode === "create" ? 201 : 200).json({
        success: true,
        message:
          mode === "create"
            ? "Post created successfully"
            : "Post updated successfully",
        data: {
          image: imagePath ?? null,
        },
      });
    } catch (error) {
      console.error(
        `[CONTROLLER ERROR] Post controller failed in mode ${mode}:`,
        error,
      );
      next(error);
    }
  };

export { post };
