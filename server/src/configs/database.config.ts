import { drizzle } from "drizzle-orm/neon-http";
import "dotenv/config";

// Global database connection instance
let db: ReturnType<typeof drizzle> | null = null;

/**
 * Initialize database connection using Neon HTTP driver
 * Uses DATABASE_URL environment variable for connection string
 * Implements singleton pattern to reuse connection
 */
/**
 * Initialize database connection using Neon HTTP driver
 * Creates singleton connection to prevent multiple instances
 */
const connectDB = () => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  // Create connection only if it doesn't exist (singleton pattern)
  if (!db) {
    db = drizzle(connectionString);
    console.log("Database connected successfully");
  }

  return db;
};

export { connectDB, db };