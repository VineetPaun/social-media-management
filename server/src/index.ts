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

// Server configuration
const port = 3000;
const app = express();
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(currentDir, "../uploads"); // Directory for uploaded files

// Custom logging middleware using Winston instead of Morgan
// Logs HTTP requests with user information and response times
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    // Extract user information from request context
    const authUser = (req as any).authUser;
    const basicUser = (req as any).user;
    const userId = authUser?.id || basicUser?.id || "Guest";
    const userEmail = authUser?.email || basicUser?.email || "";
    const userInfo = userEmail ? `${userId} (${userEmail})` : userId;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms - User:${userInfo}`;

    // Log at different levels based on response status
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

// Rate limiting middleware to prevent abuse
// Allows 100 requests per 15-minute window per IP
// Rate limiting configuration - 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                 // Limit each IP to 100 requests per windowMs
  standardHeaders: true,    // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,     // Disable the `X-RateLimit-*` headers
  message: "Too many requests from this IP, please try again after 15 minutes",
});

app.use(limiter);

// CORS configuration for cross-origin requests
// CORS configuration for cross-origin requests
app.use(
  cors({
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,  // Allow cookies and credentials
    maxAge: 86400,     // Cache preflight response for 24 hours
  }),
);

// Middleware setup
app.use(express.json());                    // Parse JSON request bodies
app.use("/uploads", express.static(uploadsDir)); // Serve uploaded files statically
app.use(`/user`, userRouter);               // User-related routes
app.use("/post", postRouter);               // Post-related routes

// Development-only endpoint to clear database tables
// WARNING: This should be removed in production
app.delete("/drop", async (req, res, next) => {
  try {
    await db?.delete(usersTable);  // Delete all users
    await db?.delete(postsTable);  // Delete all posts
    logger.warn("Database dropped via API request");
    res.json({ success: true, message: "Database dropped successfully" });
  } catch (error) {
    next(error);
  }
});

// Global error handling middleware
// Catches all unhandled errors and returns consistent error responses
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
      // Include stack trace in development mode only
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    });
  },
);

// Start the server
// Start server and display startup information
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

// Initialize database connection
connectDB();
