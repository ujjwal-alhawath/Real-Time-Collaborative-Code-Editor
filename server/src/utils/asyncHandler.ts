import { Request, Response, NextFunction } from 'express';

/**
 * Wraps an async route handler to catch errors and pass them to Express error middleware.
 * Eliminates the need for try/catch in every controller.
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
