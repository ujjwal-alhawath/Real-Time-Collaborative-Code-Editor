import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AccessTokenPayload } from '../utils/jwt';
import User from '../models/User';
import { logger } from '../utils/logger';

export const socketAuthMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    // 1. Try to get token from handshake auth or headers
    let token = socket.handshake.auth?.token;
    
    if (!token && socket.handshake.headers.authorization?.startsWith('Bearer ')) {
      token = socket.handshake.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // 2. Verify token
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;

    // 3. Find user
    const user = await User.findById(decoded.userId).lean();
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    // 4. Attach user to socket data
    socket.data.user = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatarColor: user.avatarColor,
    };

    next();
  } catch (error) {
    logger.error({ error }, 'Socket authentication failed');
    next(new Error('Authentication error: Invalid token'));
  }
};
