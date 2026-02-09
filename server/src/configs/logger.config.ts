import winston from "winston";
import Transport from "winston-transport";
import { db } from "./database.config";
import { logsTable } from "../models/log.model";

// Custom log levels for the application
// Define log levels hierarchy (lower number = higher priority)
const levels = {
  error: 0,  // Critical errors
  warn: 1,   // Warning messages
  info: 2,   // General information
  http: 3,   // HTTP request logs
  debug: 4,  // Debug information
};

// Color mapping for console output
// Color mapping for console output
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

// Apply colors to Winston
winston.addColors(colors);

/**
 * Custom Winston transport to save logs to database
 * Stores logs in the database for persistence and analysis
 */
class DbTransport extends Transport {
  constructor(opts?: any) {
    super(opts);
  }

  // Override log method to save logs to database
  log(info: any, callback: () => void) {
    // Emit logged event immediately
    setImmediate(() => {
      this.emit("logged", info);
    });

    // Save to database if connection is available
    if (db) {
      const { level, message, timestamp, ...meta } = info;

      // Remove ANSI color codes from level string
      const cleanLevel = level.replace(/\u001b\[.*?m/g, "");

      // Prepare metadata object if it exists
      const metadata = Object.keys(meta).length > 0 ? meta : undefined;

      // Insert log entry into database
      db.insert(logsTable)
        .values({
          level: cleanLevel,
          message: message,
          metadata: metadata,
          timestamp: new Date(), // Use current timestamp
        })
        .catch((err) => {
          console.error("Failed to save log to DB:", err);
        });
    }

    callback();
  }
}

// Console output format with colors and timestamps
// Console output format configuration
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Configure transports for logging
// Configure transport methods (console and database)
const transports = [
  // Console transport for development
  new winston.transports.Console({
    format: consoleFormat,
  }),
  // Database transport for persistence
  new DbTransport(),
];

// Create and configure the main logger instance
// Create Winston logger instance with custom configuration
const logger = winston.createLogger({
  level: "debug",  // Log all levels from debug and above
  levels,          // Use custom levels
  transports,      // Use configured transports
});

export default logger;
