import bcrypt from 'bcryptjs';
import { User, IUserDocument } from '../models';
import { AppError } from '../utils/AppError';
import { signAccessToken, signRefreshToken, verifyRefreshToken, getRefreshTokenMaxAge } from '../utils/jwt';
import { getRandomAvatarColor } from '../utils/helpers';
import { RegisterInput, LoginInput } from '@codesync/shared';
import { Response } from 'express';

const BCRYPT_ROUNDS = 12;
const MAX_REFRESH_TOKENS = 5;

interface AuthResult {
  user: IUserDocument;
  accessToken: string;
}

/**
 * Register a new user.
 */
export const register = async (
  input: RegisterInput,
  res: Response,
): Promise<AuthResult> => {
  const { name, email, password } = input;

  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw AppError.conflict('Email already registered');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Create user
  const user = await User.create({
    name,
    email,
    passwordHash,
    avatarColor: getRandomAvatarColor(),
  });

  // Generate tokens
  const accessToken = signAccessToken({ userId: user._id.toString(), email: user.email });
  const refreshToken = signRefreshToken({ userId: user._id.toString(), tokenVersion: 0 });

  // Store hashed refresh token
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
  await User.findByIdAndUpdate(user._id, {
    $push: { refreshTokens: hashedRefreshToken },
  });

  // Set refresh token cookie
  setRefreshTokenCookie(res, refreshToken);

  return { user, accessToken };
};

/**
 * Login an existing user.
 */
export const login = async (
  input: LoginInput,
  res: Response,
): Promise<AuthResult> => {
  const { email, password } = input;

  // Find user with password field
  const user = await User.findOne({ email }).select('+passwordHash +refreshTokens');
  if (!user || !user.passwordHash) {
    throw AppError.unauthorized('Invalid email or password');
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw AppError.unauthorized('Invalid email or password');
  }

  // Generate tokens
  const accessToken = signAccessToken({ userId: user._id.toString(), email: user.email });
  const refreshToken = signRefreshToken({ userId: user._id.toString(), tokenVersion: 0 });

  // Store hashed refresh token (limit to MAX_REFRESH_TOKENS)
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
  const tokens = user.refreshTokens || [];
  if (tokens.length >= MAX_REFRESH_TOKENS) {
    tokens.shift(); // Remove oldest
  }
  tokens.push(hashedRefreshToken);
  await User.findByIdAndUpdate(user._id, { refreshTokens: tokens });

  // Set refresh token cookie
  setRefreshTokenCookie(res, refreshToken);

  return { user, accessToken };
};

/**
 * Refresh the access token using a valid refresh token.
 * Implements token rotation: old refresh token is replaced with a new one.
 */
export const refresh = async (
  refreshTokenFromCookie: string | undefined,
  res: Response,
): Promise<AuthResult> => {
  if (!refreshTokenFromCookie) {
    throw AppError.unauthorized('No refresh token provided');
  }

  // Verify the JWT
  const payload = verifyRefreshToken(refreshTokenFromCookie);
  const user = await User.findById(payload.userId).select('+refreshTokens');
  if (!user) {
    throw AppError.unauthorized('User not found');
  }

  // Find and validate the stored hashed refresh token
  const tokens = user.refreshTokens || [];
  let matchedIndex = -1;
  for (let i = 0; i < tokens.length; i++) {
    const isMatch = await bcrypt.compare(refreshTokenFromCookie, tokens[i]!);
    if (isMatch) {
      matchedIndex = i;
      break;
    }
  }

  if (matchedIndex === -1) {
    // Token reuse detected — invalidate all tokens (potential compromise)
    await User.findByIdAndUpdate(user._id, { refreshTokens: [] });
    throw AppError.unauthorized('Token reuse detected. All sessions revoked.');
  }

  // Rotate: remove old token, create new one
  tokens.splice(matchedIndex, 1);
  const newAccessToken = signAccessToken({ userId: user._id.toString(), email: user.email });
  const newRefreshToken = signRefreshToken({
    userId: user._id.toString(),
    tokenVersion: payload.tokenVersion + 1,
  });

  const hashedNewRefresh = await bcrypt.hash(newRefreshToken, 10);
  tokens.push(hashedNewRefresh);
  await User.findByIdAndUpdate(user._id, { refreshTokens: tokens });

  setRefreshTokenCookie(res, newRefreshToken);

  return { user, accessToken: newAccessToken };
};

/**
 * Logout: revoke the refresh token from the cookie.
 */
export const logout = async (
  refreshTokenFromCookie: string | undefined,
  userId: string,
  res: Response,
): Promise<void> => {
  if (refreshTokenFromCookie) {
    const user = await User.findById(userId).select('+refreshTokens');
    if (user) {
      const tokens = user.refreshTokens || [];
      const filtered: string[] = [];
      for (const hashed of tokens) {
        const isMatch = await bcrypt.compare(refreshTokenFromCookie, hashed);
        if (!isMatch) {
          filtered.push(hashed);
        }
      }
      await User.findByIdAndUpdate(userId, { refreshTokens: filtered });
    }
  }

  // Clear cookie
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
};

/**
 * Get current user profile.
 */
export const getMe = async (userId: string): Promise<IUserDocument> => {
  const user = await User.findById(userId);
  if (!user) {
    throw AppError.notFound('User not found');
  }
  return user;
};

// ── Helpers ──────────────────────────────────

function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: getRefreshTokenMaxAge(),
    path: '/',
  });
}
