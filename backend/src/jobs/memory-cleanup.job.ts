import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { conversationMemoryService } from '../memory/conversation-memory.service.js';

export const runMemoryCleanup = async (): Promise<void> => {
  const [closedConversations, deletedMessages] = await Promise.all([
    conversationMemoryService.cleanupInactiveConversations(),
    conversationMemoryService.cleanupExpiredMessages(),
  ]);

  logger.info('Memory cleanup completed', {
    closedConversations,
    deletedMessages,
  });
};

export const startMemoryCleanupJob = (): NodeJS.Timeout => {
  const interval = setInterval(
    () => {
      void runMemoryCleanup().catch((error) => {
        logger.error('Memory cleanup failed', { error });
      });
    },
    env.MEMORY_CLEANUP_INTERVAL_MINUTES * 60 * 1000,
  );

  interval.unref();
  return interval;
};
