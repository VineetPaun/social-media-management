/**
 * Custom API Error class for consistent error handling
 * Provides static methods for common HTTP error types
 */
/**
 * Custom API Error class for structured error handling
 * Provides static methods for common HTTP error responses
 */
class ApiError extends Error {
  statusCode: number;        // HTTP status code
  errors: unknown[] | null;  // Additional error details (e.g., validation errors)
  isOperational: boolean;    // Flag to distinguish operational vs programming errors

  constructor(statusCode: number, message: string, errors: unknown[] | null = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true; // Mark as operational error (expected/handled)
  }

  // Static factory methods for common error types
  
  static badRequest(message: string, errors = null) {
    return new ApiError(400, message || "Bad Request", errors);
  }

  static unauthorized(message: string) {
    return new ApiError(401, message || "Unauthorized");
  }

  static forbidden(message: string) {
    return new ApiError(403, message || "Forbidden");
  }

  static notFound(message: string) {
    return new ApiError(404, message || "Resource not found");
  }

  static conflict(message: string) {
    return new ApiError(409, message || "Conflict");
  }

  static tooManyRequests(message: string) {
    return new ApiError(429, message || "Too many requests");
  }

  static internal(message: string) {
    return new ApiError(500, message || "Internal server error");
  }
}

export { ApiError };
