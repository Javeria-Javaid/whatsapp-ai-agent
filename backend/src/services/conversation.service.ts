import { logger } from '../config/logger.js';
import { conversationMemoryService } from '../memory/conversation-memory.service.js';
import { knowledgeBaseService } from './knowledge-base.service.js';
import { openAiService } from './openai.service.js';
import { aiRateLimitService } from './ai-rate-limit.service.js';
import type { ParsedWhatsAppMessage } from '../types/whatsapp.types.js';

class ConversationService {
  async generateReplyForIncomingMessage(message: ParsedWhatsAppMessage): Promise<string> {
    const memoryContext = await conversationMemoryService.prepareContextForIncomingMessage({
      phoneNumber: message.from,
      contactName: message.contactName,
      sourceMessageId: message.messageId,
      text: message.text ?? `[${message.type} message received]`,
      timestamp: message.timestamp,
    });

    if (!message.text) {
      const reply = `I received your ${message.type} message. Text, image, document, and voice intelligence will expand across the next phases.`;

      await conversationMemoryService.recordAssistantReply(memoryContext, reply);

      return reply;
    }

    try {
      await aiRateLimitService.assertAllowed(message.from);
    } catch (error) {
      if (error instanceof Error && error.message === 'AI_RATE_LIMIT_EXCEEDED') {
        logger.warn('AI rate limit exceeded', {
          phoneNumber: message.from,
          messageId: message.messageId,
        });

        const reply =
          'I am receiving a lot of messages right now. Please wait a minute and try again.';

        await conversationMemoryService.recordAssistantReply(memoryContext, reply);

        return reply;
      }

      throw error;
    }

    const knowledgeContext = await knowledgeBaseService.buildPromptContext(message.text);

    const aiReply = await openAiService.generateWhatsAppReply({
      userMessage: message.text,
      userPhoneNumber: message.from,
      contactName: message.contactName,
      conversationSummary: memoryContext.summary,
      conversationHistory: memoryContext.history,
      knowledgeContext,
    });

    await conversationMemoryService.recordAssistantReply(memoryContext, aiReply.text);

    return aiReply.text;
  }
}

export const conversationService = new ConversationService();
