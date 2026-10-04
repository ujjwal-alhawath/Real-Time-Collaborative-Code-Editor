import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { getRedis } from '../config/redis';
import { logger } from '../utils/logger';
import { socketAuthMiddleware } from './middleware';
import { handleRoomEvents } from './handlers/room.handler';
import { handleChatEvents } from './handlers/chat.handler';
import { isDevelopment } from '../config/env';

let io: Server;

export const initSocket = (httpServer: HttpServer): void => {
  io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
    // We increase maxHttpBufferSize for large Yjs document syncs
    maxHttpBufferSize: 1e8, // 100 MB
  });

  const pubClient = getRedis();
  
  // Create a separate subscriber client for Redis adapter
  // If we are using ioredis-mock, duplicate() works perfectly.
  const subClient = pubClient.duplicate();
  
  // Only use redis adapter if we actually have a working pubClient
  // (In our case, getRedis returns mock in dev, so it's safe)
  io.adapter(createAdapter(pubClient, subClient));

  // Middleware
  io.use(socketAuthMiddleware);

  io.on('connection', (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id} (User: ${socket.data.user?.name})`);

    // Setup event handlers
    handleRoomEvents(io, socket);
    handleChatEvents(io, socket);

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};
