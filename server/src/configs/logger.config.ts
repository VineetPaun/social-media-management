import winston from "winston";
import Transport from "winston-transport";
import { db } from "./database.config";
import { logsTable } from "../models/log.model";

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

class DbTransport extends Transport {
  constructor(opts?: any) {
    super(opts);
  }

  log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit("logged", info);
    });

    if (db) {
      const { level, message, timestamp, ...meta } = info;

      // Strip ANSI color codes from level if present
      const cleanLevel = level.replace(/\u001b\[.*?m/g, "");

      // Allow metadata to be stored as JSON
      const metadata = Object.keys(meta).length > 0 ? meta : undefined;

      db.insert(logsTable)
        .values({
          level: cleanLevel,
          message: message,
          metadata: metadata,
          timestamp: new Date(), // Use current time
        })
        .catch((err) => {
          console.error("Failed to save log to DB:", err);
        });
    }

    callback();
  }
}

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

const transports = [
  new winston.transports.Console({
    format: consoleFormat,
  }),
  new DbTransport(),
];

const logger = winston.createLogger({
  level: "debug",
  levels,
  transports,
});

export default logger;
