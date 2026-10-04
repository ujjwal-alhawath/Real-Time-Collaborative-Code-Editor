import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { env, isDevelopment } from './env';
import { logger } from '../utils/logger';

let mongoServer: MongoMemoryServer | null = null;

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 2000, // Reduced for faster fallback
      socketTimeoutMS: 45000,
    });

    logger.info(`MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      logger.error({ err }, 'MongoDB connection error');
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
  } catch (error) {
    if (isDevelopment) {
      logger.warn('Real MongoDB connection failed, falling back to in-memory mock DB...');
      try {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri, { maxPoolSize: 10 });
        logger.info(`Mock MongoDB connected: ${uri}`);
      } catch (mockError) {
        logger.fatal({ error: mockError }, 'Mock MongoDB connection failed');
        process.exit(1);
      }
    } else {
      logger.fatal({ error }, 'MongoDB connection failed');
      process.exit(1);
    }
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
  logger.info('MongoDB disconnected gracefully');
};
