import express from "express";
import { validatePostInput } from "../middlewares/post/validate.post.middleware";
import { verifyAuthToken } from "../middlewares/auth/verify.auth.middleware";
import { post } from "../controllers/post/post.controller";
import { uploadPostImage } from "../middlewares/post/upload.post.middleware";

const postRouter = express.Router();

postRouter.post(
    "/create",
    verifyAuthToken,
    uploadPostImage,
    validatePostInput("create"),
    post("create"),
);

postRouter.patch(
    '/:postId',
    verifyAuthToken,
    uploadPostImage,
    validatePostInput("edit"),
    post("edit")
);

postRouter.delete(
    '/:postId',
    verifyAuthToken,
    validatePostInput("delete"),
    post("delete"),
);

export default postRouter;
