// User routes configuration
// Handles authentication, profile management, and account operations
import express from "express";
import { validateAuthInput } from "../middlewares/auth/validate.auth.middleware";
import { checkUser } from "../middlewares/auth/check.auth.middleware";
import { asyncHandler } from "../middlewares/error/global.error.middleware";
import { signup } from "../controllers/user/signup.user.controller";
import { signin } from "../controllers/user/signin.user.controller";
import { getProfile } from "../controllers/user/profile.user.controller";
import { uploadProfileImage } from "../middlewares/user/upload.user.middleware";
import { verifyAuthToken } from "../middlewares/auth/verify.auth.middleware";
import { deleteUser } from "../controllers/user/delete.user.controller";

// User routes configuration
const userRouter = express.Router();

// User registration endpoint
// POST /user/signup
// Middleware chain: upload profile image -> validate input -> check if user exists -> create user
userRouter.post(
  "/signup",
  uploadProfileImage,        // Handle profile picture upload
  validateAuthInput("signup"), // Validate registration data
  checkUser("signup"),        // Check if user already exists
  asyncHandler(signup),       // Create new user account
);

// User login endpoint
// POST /user/signin
// Middleware chain: validate input -> check if user exists -> authenticate user
// User authentication endpoint
userRouter.post(
  "/signin",
  validateAuthInput("signin"), // Validate login credentials
  checkUser("signin"),        // Check if user exists and is active
  asyncHandler(signin),       // Authenticate and return token
);

// Get user profile endpoint
// GET /user/profile/:userId
// Requires authentication token
userRouter.get("/profile/:userId", verifyAuthToken, asyncHandler(getProfile));

// Delete user account endpoint
// DELETE /user/delete
// Requires authentication token - soft deletes user and their posts
userRouter.delete("/delete", verifyAuthToken, asyncHandler(deleteUser));

export default userRouter;
