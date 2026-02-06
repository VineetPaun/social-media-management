import { drizzle } from "drizzle-orm/neon-http";
import "dotenv/config";

let db: ReturnType<typeof drizzle> | null = null;

const connectDB = () => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  if (!db) {
    db = drizzle(connectionString);
    console.log("Database connected successfully");
  }

  return db;
};

export { connectDB, db };