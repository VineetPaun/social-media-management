// Post routes configuration
// Handles post CRUD operations, likes, and comments
import express from "express";
import { validatePostInput } from "../middlewares/post/validate.post.middleware";
import { verifyAuthToken } from "../middlewares/auth/verify.auth.middleware";
import { post, getOnePost } from "../controllers/post/post.controller";
import { uploadPostImage } from "../middlewares/post/upload.post.middleware";
import { toggleLike } from "../controllers/post/like.controller";
import {
  createComment,
  getComments,
  deleteComment,
} from "../controllers/post/comment.controller";

// Post routes configuration
const postRouter = express.Router();

// Create new post endpoint
// POST /post/create
// Requires authentication, image upload, and validation
postRouter.post(
    "/create",
    verifyAuthToken,           // Verify user is authenticated
    uploadPostImage,           // Handle image upload
    validatePostInput("create"), // Validate post data
    post("create"),            // Create the post
);

// Edit existing post endpoint
// PATCH /post/:postId
// Requires authentication and ownership verification
// Update existing post
postRouter.patch(
    '/:postId',
    verifyAuthToken,          // Verify user is authenticated
    uploadPostImage,          // Handle optional new image upload
    validatePostInput("edit"), // Validate edit data
    post("edit")              // Update the post
);

// Delete post endpoint
// DELETE /post/:postId
// Soft deletes the post (requires ownership)
// Delete post (soft delete)
postRouter.delete(
    '/:postId',
    verifyAuthToken,            // Verify user is authenticated
    validatePostInput("delete"), // Validate post ID
    post("delete"),             // Soft delete the post
);

// Get paginated posts feed endpoint
// GET /post
// Returns posts with pagination and optional search
// Get paginated posts with search functionality
postRouter.get(
    "/",
    verifyAuthToken,  // Verify user is authenticated
    post("get"),      // Fetch posts with pagination
)

// Toggle like/unlike on post endpoint
// POST /post/:postId/like
// Adds or removes like from authenticated user
postRouter.post(
    "/:postId/like",
    verifyAuthToken,  // Verify user is authenticated
    toggleLike,       // Toggle like status
);

// Create comment on post endpoint
// POST /post/:postId/comments
// Adds new comment to specified post
postRouter.post(
    "/:postId/comments",
    verifyAuthToken,  // Verify user is authenticated
    createComment,    // Create the comment
);

// Get comments for post endpoint
// GET /post/:postId/comments
// Returns paginated comments for specified post
postRouter.get(
    "/:postId/comments",
    verifyAuthToken,  // Verify user is authenticated
    getComments,      // Fetch comments with pagination
);

// Delete comment endpoint
// DELETE /post/comments/:commentId
// Soft deletes comment (requires ownership)
postRouter.delete(
    "/comments/:commentId",
    verifyAuthToken,  // Verify user is authenticated
    deleteComment,    // Soft delete the comment
);

// Get single post detail endpoint
// GET /post/:postId
// Returns detailed post information with engagement data
// Note: This route is placed last to avoid conflicts with other /:postId/* routes
postRouter.get(
    "/:postId",
    verifyAuthToken,  // Verify user is authenticated
    getOnePost,       // Fetch single post details
);

export default postRouter;
