import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Generic Zod validation middleware.
 * Validates request body, query, or params against a Zod schema.
 */
export const validate = (
  schema: ZodSchema,
  source: 'body' | 'query' | 'params' = 'body',
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));

        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: formattedErrors,
        });
        return;
      }
      next(error);
    }
  };
};
