import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { isProduction } from '../config/env';
import mongoose from 'mongoose';

/**
 * Global error handler middleware.
 * Handles AppError (operational), Mongoose errors, and unexpected errors.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // ── AppError (expected operational errors) ──
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // ── Mongoose validation error ──
  if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map((e) => e.message);
    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: messages,
    });
    return;
  }

  // ── Mongoose cast error (invalid ObjectId, etc.) ──
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      error: `Invalid ${err.path}: ${err.value}`,
    });
    return;
  }

  // ── Mongoose duplicate key ──
  if (err.name === 'MongoServerError' && 'code' in err && (err as Record<string, unknown>)['code'] === 11000) {
    res.status(409).json({
      success: false,
      error: 'Duplicate value. This resource already exists.',
    });
    return;
  }

  // ── JWT errors ──
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'Token expired',
    });
    return;
  }

  // ── Unexpected error (log full stack, send generic message) ──
  logger.error({ err }, 'Unhandled error');

  res.status(500).json({
    success: false,
    error: isProduction ? 'Internal server error' : err.message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
};
