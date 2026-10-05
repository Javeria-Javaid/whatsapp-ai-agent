import http from 'node:http';
import { createApp } from './app.js';
import { connectMongoDB, disconnectMongoDB } from './config/database.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { startMemoryCleanupJob } from './jobs/memory-cleanup.job.js';

const startServer = async (): Promise<void> => {
  await connectMongoDB();
  await connectRedis();

  const app = createApp();
  const server = http.createServer(app);
  const memoryCleanupJob = startMemoryCleanupJob();

  server.listen(env.PORT, () => {
    logger.info(`Server listening on port ${env.PORT}`);
    logger.info(`Health endpoint: http://localhost:${env.PORT}${env.API_PREFIX}/health`);
  });

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    logger.info(`${signal} received. Shutting down gracefully.`);

    server.close(async () => {
      clearInterval(memoryCleanupJob);
      await disconnectRedis();
      await disconnectMongoDB();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
};

startServer().catch((error) => {
  logger.error('Failed to start server', { error });
  process.exit(1);
});
