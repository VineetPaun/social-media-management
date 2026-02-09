import {
  boolean,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Users table definition
 * Stores user account information with soft delete capability
 */
/**
 * Users table schema
 * Stores user account information with soft delete capability
 */
export const usersTable = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),           // Unique user identifier
  name: varchar({ length: 255 }).notNull(),              // User's display name
  email: varchar({ length: 255 }).notNull().unique(),    // User's email (unique)
  password: varchar({ length: 255 }).notNull(),          // Hashed password
  profilePic: varchar("profile_pic", { length: 255 }),   // Profile picture URL
  createdAt: timestamp("created_at").defaultNow().notNull(), // Account creation time
  updatedAt: timestamp("updated_at")                     // Last update time
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  isDeleted: boolean("is_deleted").default(false).notNull(), // Soft delete flag
  deletedAt: timestamp("deleted_at"),                    // Deletion timestamp
});
