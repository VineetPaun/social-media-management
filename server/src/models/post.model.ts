import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./user.model";

export const postsTable = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  description: varchar({ length: 500 }),
  image: varchar({ length: 255 }).notNull(),
});
