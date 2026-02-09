// Global error handling middleware (currently commented out)
// This file contains commented-out error handling code that was replaced
// by the simpler global error handler in index.ts
import { NextFunction, Request, Response } from "express";
/**
 * Async handler wrapper for Express route handlers
 * Automatically catches async errors and passes them to Express error handling
 * 
 * @param fn - Async route handler function
 * @returns Express middleware function with error handling
 */
/**
 * Async handler wrapper for Express route handlers
 * Automatically catches and forwards async errors to error middleware
 */
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      // Execute async function and catch any promise rejections
      Promise.resolve(fn(req, res, next)).catch(next);
    } catch (error) {
      // Catch synchronous errors
      next(error);
    }
  };

export { asyncHandler };
