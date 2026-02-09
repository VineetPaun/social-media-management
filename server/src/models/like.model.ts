import { pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { usersTable } from "./user.model";
import { postsTable } from "./post.model";

/**
 * Likes table definition
 * Stores like relationships between users and posts
 * Uses composite primary key to prevent duplicate likes
 * No soft delete needed - likes are either present or absent
 */
/**
 * Likes table schema
 * Junction table for user-post likes with composite primary key
 */
export const likesTable = pgTable(
  "likes",
  {
    userId: uuid("user_id")                             // Foreign key to users table
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    postId: uuid("post_id")                             // Foreign key to posts table
      .notNull()
      .references(() => postsTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(), // Like creation time
  },
  (table) => [
    // Composite primary key prevents duplicate likes from same user on same post
    primaryKey({ columns: [table.userId, table.postId] })
  ],
);
