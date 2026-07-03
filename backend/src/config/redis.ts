import { createClient } from 'redis';
import { env } from './env.js';
import { logger } from './logger.js';

export const redisClient = createClient({
  url: env.REDIS_URL,
});

redisClient.on('error', (error) => {
  logger.error('Redis client error', { error });
});

redisClient.on('connect', () => {
  logger.info('Redis connecting');
});

redisClient.on('ready', () => {
  logger.info('Redis connected');
});

export const connectRedis = async (): Promise<void> => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient.isOpen) {
    await redisClient.quit();
    logger.info('Redis disconnected');
  }
};

export const getRedisStatus = (): string => {
  if (redisClient.isReady) {
    return 'connected';
  }

  if (redisClient.isOpen) {
    return 'connecting';
  }

  return 'disconnected';
};
