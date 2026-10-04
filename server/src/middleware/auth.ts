import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import { User } from '../models/User';

/**
 * Extend Express Request to include authenticated user.
 */
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
    }
  }
}

/**
 * Authentication middleware.
 * Extracts JWT from Authorization header, verifies it, and attaches user info to request.
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw AppError.unauthorized('No token provided');
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    // Verify user still exists
    const user = await User.findById(payload.userId).select('_id email').lean();
    if (!user) {
      throw AppError.unauthorized('User no longer exists');
    }

    req.userId = payload.userId;
    req.userEmail = payload.email;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(AppError.unauthorized('Invalid or expired token'));
  }
};
