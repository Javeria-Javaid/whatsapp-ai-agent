import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { conversationRepository } from '../repositories/conversation.repository.js';
import { messageRepository } from '../repositories/message.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { openAiService } from '../services/openai.service.js';
import type { AiConversationMessage } from '../types/ai.types.js';
import type {
  ConversationMemoryContext,
  PrepareMemoryInput,
  StoreMessageInput,
} from '../types/memory.types.js';
import type { ConversationDocument } from '../models/conversation.model.js';

class ConversationMemoryService {
  async prepareContextForIncomingMessage(
    input: PrepareMemoryInput,
  ): Promise<ConversationMemoryContext> {
    const user = await userRepository.upsertByPhoneNumber(input.phoneNumber, input.contactName);
    const conversation = await this.getOrCreateConversation(user._id, input.phoneNumber);

    await this.storeMessage({
      conversationId: conversation._id.toString(),
      userId: user._id.toString(),
      phoneNumber: input.phoneNumber,
      sessionId: conversation.sessionId,
      role: 'user',
      content: input.text,
      sourceMessageId: input.sourceMessageId,
      timestamp: input.timestamp,
    });

    const history = await this.retrieveContextWindow(conversation, input.sourceMessageId);

    return {
      conversationId: conversation._id.toString(),
      sessionId: conversation.sessionId,
      summary: conversation.summary || undefined,
      history,
    };
  }

  async recordAssistantReply(context: ConversationMemoryContext, reply: string): Promise<void> {
    await this.storeMessage({
      conversationId: context.conversationId,
      userId: await this.resolveUserIdFromConversation(context.conversationId),
      phoneNumber: await this.resolvePhoneNumberFromConversation(context.conversationId),
      sessionId: context.sessionId,
      role: 'assistant',
      content: reply,
      timestamp: new Date(),
    });

    await this.maybeSummarizeConversation(context.conversationId);
  }

  async retrieveContextWindow(
    conversation: ConversationDocument,
    currentSourceMessageId?: string,
  ): Promise<AiConversationMessage[]> {
    const recentMessages = await messageRepository.findRecentByConversation(
      conversation._id,
      env.MEMORY_CONTEXT_MESSAGE_LIMIT + 1,
    );

    const history: AiConversationMessage[] = [];

    if (conversation.summary) {
      history.push({
        role: 'system',
        content: `Conversation summary so far: ${conversation.summary}`,
      });
    }

    for (const message of recentMessages) {
      if (message.sourceMessageId && message.sourceMessageId === currentSourceMessageId) {
        continue;
      }

      history.push({
        role: message.role,
        content: message.content,
      });
    }

    return history.slice(-env.MEMORY_CONTEXT_MESSAGE_LIMIT);
  }

  async cleanupInactiveConversations(): Promise<number> {
    const cutoff = new Date(Date.now() - env.MEMORY_SESSION_TIMEOUT_MINUTES * 60 * 1000);

    return conversationRepository.closeInactive(cutoff);
  }

  async cleanupExpiredMessages(): Promise<number> {
    return messageRepository.deleteExpired(new Date());
  }

  private async getOrCreateConversation(
    userId: ConversationDocument['userId'],
    phoneNumber: string,
  ): Promise<ConversationDocument> {
    const activeSince = new Date(Date.now() - env.MEMORY_SESSION_TIMEOUT_MINUTES * 60 * 1000);
    const existing = await conversationRepository.findActive({ phoneNumber, activeSince });

    if (existing) {
      await conversationRepository.touch(existing._id);
      return existing;
    }

    return conversationRepository.create({ userId, phoneNumber });
  }

  private async storeMessage(input: StoreMessageInput): Promise<void> {
    await messageRepository.create(input);
    await conversationRepository.incrementMessageCount(input.conversationId);
  }

  private async maybeSummarizeConversation(conversationId: string): Promise<void> {
    const conversation = await conversationRepository.findActive({
      phoneNumber: await this.resolvePhoneNumberFromConversation(conversationId),
      activeSince: new Date(0),
    });

    if (!conversation) {
      return;
    }

    const unsummarizedCount = conversation.messageCount - conversation.summarizedMessageCount;

    if (unsummarizedCount < env.MEMORY_SUMMARY_TRIGGER_MESSAGES) {
      return;
    }

    const messages = await messageRepository.findUnsummarizedByConversation(
      conversation._id,
      conversation.summarizedMessageCount,
    );

    const summary = await openAiService.summarizeConversation({
      existingSummary: conversation.summary || undefined,
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    });

    await conversationRepository.updateSummary(
      conversation._id,
      summary,
      conversation.messageCount,
    );

    logger.info('Conversation memory summarized', {
      conversationId,
      summarizedMessageCount: conversation.messageCount,
    });
  }

  private async resolveUserIdFromConversation(conversationId: string): Promise<string> {
    const conversation = await this.findConversationByIdOrThrow(conversationId);

    return conversation.userId.toString();
  }

  private async resolvePhoneNumberFromConversation(conversationId: string): Promise<string> {
    const conversation = await this.findConversationByIdOrThrow(conversationId);

    return conversation.phoneNumber;
  }

  private async findConversationByIdOrThrow(conversationId: string): Promise<ConversationDocument> {
    const conversation = await conversationRepository.findById(conversationId);

    if (!conversation) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    return conversation;
  }
}

export const conversationMemoryService = new ConversationMemoryService();
