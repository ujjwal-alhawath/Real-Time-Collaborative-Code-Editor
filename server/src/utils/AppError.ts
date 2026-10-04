import { StatusCodes } from 'http-status-codes';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string): AppError {
    return new AppError(message, StatusCodes.BAD_REQUEST);
  }

  static unauthorized(message = 'Unauthorized'): AppError {
    return new AppError(message, StatusCodes.UNAUTHORIZED);
  }

  static forbidden(message = 'Forbidden'): AppError {
    return new AppError(message, StatusCodes.FORBIDDEN);
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError(message, StatusCodes.NOT_FOUND);
  }

  static conflict(message: string): AppError {
    return new AppError(message, StatusCodes.CONFLICT);
  }

  static tooManyRequests(message = 'Too many requests'): AppError {
    return new AppError(message, StatusCodes.TOO_MANY_REQUESTS);
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError(message, StatusCodes.INTERNAL_SERVER_ERROR, false);
  }
}
