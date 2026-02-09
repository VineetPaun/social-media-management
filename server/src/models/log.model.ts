import {
  pgTable,
  text,
  timestamp,
  varchar,
  jsonb,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Logs table definition
 * Stores application logs for monitoring and debugging
 * Used by the custom Winston database transport
 */
/**
 * Logs table schema
 * Stores application logs with metadata for debugging and monitoring
 */
export const logsTable = pgTable("logs", {
  id: uuid("id").defaultRandom().primaryKey(),     // Unique log entry identifier
  level: varchar("level", { length: 50 }).notNull(), // Log level (error, warn, info, etc.)
  message: text("message").notNull(),               // Log message content
  timestamp: timestamp("timestamp").defaultNow().notNull(), // When the log was created
  metadata: jsonb("metadata"),                     // Additional structured data (optional)
});
