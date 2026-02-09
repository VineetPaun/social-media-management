import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import rateLimit from "express-rate-limit";
import { connectDB, db } from "./configs/database.config";
import userRouter from "./routes/user.route";
import { usersTable } from "./models/user.model";
import postRouter from "./routes/post.route";
import { postsTable } from "./models/post.model";
import logger from "./configs/logger.config";

const port = 3000;
const app = express();
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(currentDir, "../uploads");

// Morgan removed, using custom middleware with Winston
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const authUser = (req as any).authUser;
    const basicUser = (req as any).user;
    const userId = authUser?.id || basicUser?.id || "Guest";
    const userEmail = authUser?.email || basicUser?.email || "";
    const userInfo = userEmail ? `${userId} (${userEmail})` : userId;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms - User:${userInfo}`;

    if (res.statusCode >= 500) {
      logger.error(message);
    } else if (res.statusCode >= 400) {
      logger.warn(message);
    } else {
      logger.info(message);
    }
  });
  next();
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes",
});

app.use(limiter);

app.use(
  cors({
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400,
  }),
);

app.use(express.json());
app.use("/uploads", express.static(uploadsDir));
app.use(`/user`, userRouter);
app.use("/post", postRouter);

// Just for development, not for production
app.delete("/drop", async (req, res, next) => {
  try {
    await db?.delete(usersTable);
    await db?.delete(postsTable);
    logger.warn("Database dropped via API request");
    res.json({ success: true, message: "Database dropped successfully" });
  } catch (error) {
    next(error);
  }
});

// Global error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    logger.error(`Global Error Handler: ${err.message}`);

    const statusCode = err.statusCode || 500;
    const message = err.message || "Something went wrong";

    res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    });
  },
);

app.listen(port, () => {
  console.log(`
    ╔════════════════════════════════════════════╗
    ║    Instagram Management App                ║
    ╠════════════════════════════════════════════╣
    ║  Port:        ${port}                         ║
    ║  Environment: development                  ║
    ║  Status:      Running ✓                    ║
    ╚════════════════════════════════════════════╝
    `);
});

connectDB();
