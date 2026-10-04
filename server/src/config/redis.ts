import Redis from 'ioredis';
import RedisMock from 'ioredis-mock';
import { env, isTest, isDevelopment } from './env';
import { logger } from '../utils/logger';

let redis: Redis;

export const initRedis = async (): Promise<void> => {
  if (redis) return;

  try {
    const tempRedis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 0,
      lazyConnect: true,
      connectTimeout: 1000,
    });
    
    await tempRedis.connect();
    tempRedis.disconnect();
    
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: isTest,
      retryStrategy(times) {
        return Math.min(times * 200, 5000);
      }
    });
    
    redis.on('error', (err) => logger.error({ err }, 'Redis connection error'));
    
    logger.info('Real Redis connected');
  } catch (error) {
    if (isDevelopment) {
      logger.warn('Real Redis connection failed, falling back to ioredis-mock');
      // @ts-ignore
      redis = new RedisMock();
    } else {
      logger.fatal({ error }, 'Redis connection failed');
      process.exit(1);
    }
  }
};

export const getRedis = (): Redis => {
  if (!redis) {
    // @ts-ignore
    redis = new RedisMock();
  }
  return redis;
};

export const disconnectRedis = async (): Promise<void> => {
  if (redis) {
    await redis.quit();
    logger.info('Redis disconnected gracefully');
  }
};
