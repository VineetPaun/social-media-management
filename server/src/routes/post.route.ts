import express from "express";
import { validatePostInput } from "../middlewares/post/validate.post.middleware";
import { verifyAuthToken } from "../middlewares/auth/verify.auth.middleware";
import { createPost } from "../controllers/post/create.post.controller";
import { uploadPostImage } from "../middlewares/post/upload.post.middleware";

const postRouter = express.Router();

postRouter.post(
    "/create",
    verifyAuthToken,
    uploadPostImage,
    validatePostInput,
    createPost,
);

postRouter.patch(
    '/edit',
    verifyAuthToken,
    validatePostInput,
);

postRouter.delete(
    '/delete',
    verifyAuthToken,
    validatePostInput,
);

export default postRouter;
