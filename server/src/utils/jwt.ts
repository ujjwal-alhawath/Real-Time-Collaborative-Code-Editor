import jwt from 'jsonwebtoken';
import { env } from '../config/env';

interface AccessTokenPayload {
  userId: string;
  email: string;
}

interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
}

/**
 * Sign an access token (short-lived, sent in response body).
 */
export const signAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
    issuer: 'codesync',
    audience: 'codesync-client',
  });
};

/**
 * Sign a refresh token (long-lived, sent in httpOnly cookie).
 */
export const signRefreshToken = (payload: RefreshTokenPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
    issuer: 'codesync',
    audience: 'codesync-client',
  });
};

/**
 * Verify and decode an access token.
 */
export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: 'codesync',
    audience: 'codesync-client',
  }) as AccessTokenPayload;
};

/**
 * Verify and decode a refresh token.
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: 'codesync',
    audience: 'codesync-client',
  }) as RefreshTokenPayload;
};

/**
 * Parse the refresh token expiry string into milliseconds for cookie maxAge.
 */
export const getRefreshTokenMaxAge = (): number => {
  const match = env.JWT_REFRESH_EXPIRES_IN.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7 days

  const value = parseInt(match[1]!, 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
};
