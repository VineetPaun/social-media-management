import {
  pgTable,
  text,
  timestamp,
  varchar,
  jsonb,
  uuid,
} from "drizzle-orm/pg-core";

export const logsTable = pgTable("logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  level: varchar("level", { length: 50 }).notNull(),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: jsonb("metadata"),
});
