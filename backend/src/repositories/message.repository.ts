import type { Types } from 'mongoose';
import { env } from '../config/env.js';
import { MessageModel, type MessageDocument } from '../models/message.model.js';
import type { StoreMessageInput } from '../types/memory.types.js';

class MessageRepository {
  async create(input: StoreMessageInput): Promise<MessageDocument> {
    const retentionMs = env.MEMORY_RETENTION_DAYS * 24 * 60 * 60 * 1000;

    return MessageModel.create({
      ...input,
      timestamp: input.timestamp ?? new Date(),
      expiresAt: new Date(Date.now() + retentionMs),
    });
  }

  async findRecentByConversation(
    conversationId: string | Types.ObjectId,
    limit: number,
  ): Promise<MessageDocument[]> {
    const messages = await MessageModel.find({ conversationId })
      .sort({ timestamp: -1 })
      .limit(limit);

    return messages.reverse();
  }

  async findUnsummarizedByConversation(
    conversationId: string | Types.ObjectId,
    afterCount: number,
  ): Promise<MessageDocument[]> {
    return MessageModel.find({ conversationId }).sort({ timestamp: 1 }).skip(afterCount);
  }

  async deleteExpired(expiredBefore: Date): Promise<number> {
    const result = await MessageModel.deleteMany({
      expiresAt: { $lte: expiredBefore },
    });

    return result.deletedCount;
  }
}

export const messageRepository = new MessageRepository();
