// Central schema export file
// Exports all database table definitions for easy importing
// Central schema export file
// Re-exports all database table definitions for easy importing
import { usersTable } from "../models/user.model";
import { postsTable } from "../models/post.model";
import { likesTable } from "../models/like.model";
import { commentsTable } from "../models/comment.model";
import { logsTable } from "../models/log.model";

// Export all table schemas for use in migrations and queries
export { usersTable, postsTable, likesTable, commentsTable, logsTable };
