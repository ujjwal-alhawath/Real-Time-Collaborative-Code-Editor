import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as authService from '../services/auth.service';
import { RegisterInput, LoginInput } from '@codesync/shared';

/**
 * POST /api/v1/auth/register
 */
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = req.body as RegisterInput;
  const { user, accessToken } = await authService.register(input, res);

  res.status(201).json({
    success: true,
    data: {
      user,
      tokens: { accessToken },
    },
  });
});

/**
 * POST /api/v1/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = req.body as LoginInput;
  const { user, accessToken } = await authService.login(input, res);

  res.status(200).json({
    success: true,
    data: {
      user,
      tokens: { accessToken },
    },
  });
});

/**
 * POST /api/v1/auth/logout
 */
export const logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies?.refreshToken as string | undefined;
  await authService.logout(refreshToken, req.userId!, res);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * POST /api/v1/auth/refresh
 */
export const refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies?.refreshToken as string | undefined;
  const { user, accessToken } = await authService.refresh(refreshToken, res);

  res.status(200).json({
    success: true,
    data: {
      user,
      tokens: { accessToken },
    },
  });
});

/**
 * GET /api/v1/auth/me
 */
export const getMe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await authService.getMe(req.userId!);

  res.status(200).json({
    success: true,
    data: { user },
  });
});
