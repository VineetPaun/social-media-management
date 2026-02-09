import express from "express";
import { validateAuthInput } from "../middlewares/auth/validate.auth.middleware";
import { checkUser } from "../middlewares/auth/check.auth.middleware";
import { asyncHandler } from "../middlewares/error/global.error.middleware";
import { signup } from "../controllers/user/signup.user.controller";
import { signin } from "../controllers/user/signin.user.controller";
import { getProfile } from "../controllers/user/profile.user.controller";
import { uploadProfileImage } from "../middlewares/user/upload.user.middleware";
import { verifyAuthToken } from "../middlewares/auth/verify.auth.middleware";

const userRouter = express.Router();

userRouter.post(
  "/signup",
  uploadProfileImage,
  validateAuthInput("signup"),
  checkUser("signup"),
  asyncHandler(signup),
);

userRouter.post(
  "/signin",
  validateAuthInput("signin"),
  checkUser("signin"),
  asyncHandler(signin),
);

import { deleteUser } from "../controllers/user/delete.user.controller";

userRouter.get("/profile/:userId", verifyAuthToken, asyncHandler(getProfile));

userRouter.delete("/delete", verifyAuthToken, asyncHandler(deleteUser));

export default userRouter;
