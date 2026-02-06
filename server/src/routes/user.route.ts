import express from "express";
import { validateAuthInput } from "../middlewares/auth/validate.auth.middleware";
import { checkUser } from "../middlewares/auth/check.auth.middleware";
import { asyncHandler } from "../middlewares/error/global.error.middleware";
import { signup } from "../controllers/user/signup.user.controller";
import { signin } from "../controllers/user/signin.user.controller";
const userRouter = express.Router();

userRouter.post(
  "/signup",
  validateAuthInput,
  checkUser("signup"),
  asyncHandler(signup),
);

userRouter.post(
  "/signin",
  validateAuthInput,
  checkUser("signin"),
  asyncHandler(signin),
);

export default userRouter;
