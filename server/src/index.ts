import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import { connectDB, db } from "./configs/database.config";
import userRouter from "./routes/user.route";
import { usersTable } from "./models/user.model";
import postRouter from "./routes/post.route";
import { postsTable } from "./models/post.model";

const port = 3000;
const app = express();
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(currentDir, "../uploads");

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
app.use('/post', postRouter)

// Just for development, not for production
app.delete("/drop", async (req, res, next) => {
  try {
    await db?.delete(usersTable)
    await db?.delete(postsTable)
    // logger.warn("Database dropped via API request");
    res.json({ success: true, message: "Database dropped successfully" });
  } catch (error) {
    next(error);
  }
});

app.listen(port, () => {
  console.log(`
    ╔════════════════════════════════════════════╗
    ║    Instagram Management App             ║
    ╠════════════════════════════════════════════╣
    ║  Port:        ${port}                         ║
    ║  Environment: development                  ║
    ║  Status:      Running ✓                    ║
    ╚════════════════════════════════════════════╝
    `);
});

connectDB();
