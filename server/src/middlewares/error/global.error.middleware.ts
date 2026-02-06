// import { ApiError } from "./api.error.middleware.js";
// import { logError } from "../logger/error.logger.middleware.js";
import { NextFunction, Request, Response } from "express";

// const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
//   const error = ApiError.notFound(
//     `Route ${req.method} ${req.originalUrl} not found`,
//   );
//   next(error);
// };

// const globalErrorHandler = (err, req: Request, res: Response, next: NextFunction) => {
//   logError(err, req);
//   res.locals.errorLogged = true;

//   if (err.name === "ValidationError") {
//     const errors = Object.values(err.errors).map((e) => ({
//       field: e.path,
//       message: e.message,
//     }));
//     return res.status(400).json({
//       success: false,
//       statusCode: 400,
//       message: "Validation Error",
//       errors,
//     });
//   }

//   if (err.name === "CastError") {
//     return res.status(400).json({
//       success: false,
//       statusCode: 400,
//       message: `Invalid ${err.path}: ${err.value}`,
//     });
//   }

//   if (err.code === 11000) {
//     const field = Object.keys(err.keyValue)[0];
//     return res.status(409).json({
//       success: false,
//       statusCode: 409,
//       message: `Duplicate value for field: ${field}`,
//     });
//   }

//   if (err.name === "JsonWebTokenError") {
//     return res.status(401).json({
//       success: false,
//       statusCode: 401,
//       message: "Invalid token",
//     });
//   }

//   if (err.name === "TokenExpiredError") {
//     return res.status(401).json({
//       success: false,
//       statusCode: 401,
//       message: "Token has expired",
//     });
//   }

//   if (err instanceof ApiError) {
//     return res.status(err.statusCode).json({
//       success: false,
//       statusCode: err.statusCode,
//       message: err.message,
//       errors: err.errors,
//     });
//   }

//   const statusCode = err.statusCode || 500;
//   const message = err.message || "Something went wrong";

//   res.status(statusCode).json({
//     success: false,
//     statusCode,
//     message,
//     ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
//   });
// };

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      Promise.resolve(fn(req, res, next)).catch(next);
    } catch (error) {
      next(error);
    }
  };

export { asyncHandler };
