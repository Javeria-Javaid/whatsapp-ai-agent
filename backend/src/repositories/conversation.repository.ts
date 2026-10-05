import { randomUUID } from 'node:crypto';
import type { Types } from 'mongoose';
import { ConversationModel, type ConversationDocument } from '../models/conversation.model.js';

interface FindActiveConversationInput {
  phoneNumber: string;
  activeSince: Date;
}

interface CreateConversationInput {
  userId: Types.ObjectId;
  phoneNumber: string;
}

class ConversationRepository {
  async findById(conversationId: string | Types.ObjectId): Promise<ConversationDocument | null> {
    return ConversationModel.findById(conversationId);
  }

  async findActive(input: FindActiveConversationInput): Promise<ConversationDocument | null> {
    return ConversationModel.findOne({
      phoneNumber: input.phoneNumber,
      status: 'active',
      lastActivityAt: { $gte: input.activeSince },
    }).sort({ lastActivityAt: -1 });
  }

  async create(input: CreateConversationInput): Promise<ConversationDocument> {
    return ConversationModel.create({
      userId: input.userId,
      phoneNumber: input.phoneNumber,
      sessionId: randomUUID(),
      status: 'active',
      lastActivityAt: new Date(),
    });
  }

  async touch(conversationId: string | Types.ObjectId): Promise<void> {
    await ConversationModel.updateOne(
      { _id: conversationId },
      {
        $set: { lastActivityAt: new Date() },
      },
    );
  }

  async incrementMessageCount(conversationId: string | Types.ObjectId): Promise<void> {
    await ConversationModel.updateOne(
      { _id: conversationId },
      {
        $inc: { messageCount: 1 },
        $set: { lastActivityAt: new Date() },
      },
    );
  }

  async updateSummary(
    conversationId: string | Types.ObjectId,
    summary: string,
    summarizedMessageCount: number,
  ): Promise<void> {
    await ConversationModel.updateOne(
      { _id: conversationId },
      {
        $set: {
          summary,
          summarizedMessageCount,
          lastActivityAt: new Date(),
        },
      },
    );
  }

  async closeInactive(cutoff: Date): Promise<number> {
    const result = await ConversationModel.updateMany(
      {
        status: 'active',
        lastActivityAt: { $lt: cutoff },
      },
      {
        $set: { status: 'closed' },
      },
    );

    return result.modifiedCount;
  }
}

export const conversationRepository = new ConversationRepository();
