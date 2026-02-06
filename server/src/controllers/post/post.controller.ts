import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { NextFunction, Request, Response } from "express";
import { db } from "../../configs/database.config";
import { postsTable } from "../../models/post.model";
import { ApiError } from "../../middlewares/error/api.error.middleware";
import { and, eq } from "drizzle-orm";

type PostMode = "create" | "edit" | "delete";

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
  (mode: PostMode) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { description } = req.body as {
        description?: string;
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

      const imagePath = imageFile
        ? `/uploads/posts/${imageFile.filename}`
        : undefined;

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
            and(
              eq(postsTable.id, postId),
              eq(postsTable.userId, authUser.id),
            ),
          )
          .returning({
            id: postsTable.id,
            image: postsTable.image,
            description: postsTable.description,
          });

        if (!updatedPost) {
          throw ApiError.notFound("Post not found");
        }
      } else {
        if (!postId) {
          throw ApiError.badRequest("Post id is required");
        }

        const [deletedPost] = await db
          .delete(postsTable)
          .where(
            and(
              eq(postsTable.id, postId),
              eq(postsTable.userId, authUser.id),
            ),
          )
          .returning({
            id: postsTable.id,
            image: postsTable.image,
          });

        if (!deletedPost) {
          throw ApiError.notFound("Post not found");
        }

        await removeUploadedImage(deletedPost.image);

        return res.status(200).json({
          success: true,
          message: "Post deleted successfully",
          data: {
            postId: deletedPost.id,
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
      next(error);
    }
  };

export { post };
