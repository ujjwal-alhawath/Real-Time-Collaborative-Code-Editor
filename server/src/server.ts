import http from 'http';
import app from './app';
import { env } from './config/env';
import { connectDB, disconnectDB } from './config/db';
import { initRedis, disconnectRedis } from './config/redis';
import { logger } from './utils/logger';

const server = http.createServer(app);

/**
 * Start the server: connect DB, Redis, then listen.
 */
const start = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Initialize Redis connection
    await initRedis();

    // Start HTTP server
    server.listen(env.PORT, () => {
      logger.info(`🚀 CodeSync server running on port ${env.PORT}`);
      logger.info(`📚 API Docs: http://localhost:${env.PORT}/api/docs`);
      logger.info(`🏥 Health: http://localhost:${env.PORT}/api/v1/health`);
    });
  } catch (error) {
    logger.fatal({ error }, 'Failed to start server');
    process.exit(1);
  }
};

/**
 * Graceful shutdown handler.
 */
const shutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received. Shutting down gracefully...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    await disconnectDB();
    await disconnectRedis();

    logger.info('All connections closed. Exiting.');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle unhandled rejections
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled Rejection');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught Exception');
  process.exit(1);
});

start();

export { server };
