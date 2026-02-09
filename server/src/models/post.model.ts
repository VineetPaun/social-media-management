import {
  boolean,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { usersTable } from "./user.model";

/**
 * Posts table definition
 * Stores user posts with images and optional descriptions
 * Includes soft delete capability and foreign key to users
 */
/**
 * Posts table schema
 * Stores user posts with image and optional description, supports soft delete
 */
export const postsTable = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),           // Unique post identifier
  userId: uuid("user_id")                               // Foreign key to users table
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  description: varchar({ length: 500 }),                // Optional post description/caption
  image: varchar({ length: 255 }).notNull(),            // Required image URL
  createdAt: timestamp("created_at").defaultNow().notNull(), // Post creation time
  updatedAt: timestamp("updated_at")                    // Last update time
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  isDeleted: boolean("is_deleted").default(false).notNull(), // Soft delete flag
  deletedAt: timestamp("deleted_at"),                   // Deletion timestamp
});
