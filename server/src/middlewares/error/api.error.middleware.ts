class ApiError extends Error {
  statusCode: number;
  errors: unknown[] | null;
  isOperational: boolean;

  constructor(statusCode: number, message: string, errors: unknown[] | null = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
  }

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
