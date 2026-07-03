import { env } from '../config/env.js';
import { redisClient } from '../config/redis.js';

interface MemoryRateLimitEntry {
  count: number;
  resetAt: number;
}

class AiRateLimitService {
  private readonly memoryStore = new Map<string, MemoryRateLimitEntry>();

  async assertAllowed(identifier: string): Promise<void> {
    const key = `rate-limit:ai:${identifier}`;

    if (redisClient.isReady) {
      const count = await redisClient.incr(key);

      if (count === 1) {
        await redisClient.expire(key, env.AI_RATE_LIMIT_WINDOW_SECONDS);
      }

      if (count > env.AI_RATE_LIMIT_MAX_REQUESTS) {
        throw new Error('AI_RATE_LIMIT_EXCEEDED');
      }

      return;
    }

    this.assertAllowedInMemory(key);
  }

  private assertAllowedInMemory(key: string): void {
    const now = Date.now();
    const existing = this.memoryStore.get(key);

    if (!existing || existing.resetAt <= now) {
      this.memoryStore.set(key, {
        count: 1,
        resetAt: now + env.AI_RATE_LIMIT_WINDOW_SECONDS * 1000,
      });
      return;
    }

    existing.count += 1;

    if (existing.count > env.AI_RATE_LIMIT_MAX_REQUESTS) {
      throw new Error('AI_RATE_LIMIT_EXCEEDED');
    }
  }
}

export const aiRateLimitService = new AiRateLimitService();
