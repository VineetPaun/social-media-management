import {
  boolean,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { usersTable } from "./user.model";
import { postsTable } from "./post.model";

/**
 * Comments table definition
 * Stores user comments on posts with soft delete capability
 * Includes foreign keys to both users and posts tables
 */
/**
 * Comments table schema
 * Stores user comments on posts with soft delete capability
 */
export const commentsTable = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),           // Unique comment identifier
  userId: uuid("user_id")                               // Foreign key to users table
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  postId: uuid("post_id")                               // Foreign key to posts table
    .notNull()
    .references(() => postsTable.id, { onDelete: "cascade" }),
  content: varchar({ length: 500 }).notNull(),          // Comment text content (required)
  createdAt: timestamp("created_at").defaultNow().notNull(), // Comment creation time
  updatedAt: timestamp("updated_at")                    // Last update time
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  isDeleted: boolean("is_deleted").default(false).notNull(), // Soft delete flag
  deletedAt: timestamp("deleted_at"),                   // Deletion timestamp
});
