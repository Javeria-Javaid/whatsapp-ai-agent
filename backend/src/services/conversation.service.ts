import { logger } from '../config/logger.js';
import { openAiService } from './openai.service.js';
import { aiRateLimitService } from './ai-rate-limit.service.js';
import type { ParsedWhatsAppMessage } from '../types/whatsapp.types.js';

class ConversationService {
  async generateReplyForIncomingMessage(message: ParsedWhatsAppMessage): Promise<string> {
    if (!message.text) {
      return `I received your ${message.type} message. Text, image, document, and voice intelligence will expand across the next phases.`;
    }

    try {
      await aiRateLimitService.assertAllowed(message.from);
    } catch (error) {
      if (error instanceof Error && error.message === 'AI_RATE_LIMIT_EXCEEDED') {
        logger.warn('AI rate limit exceeded', {
          phoneNumber: message.from,
          messageId: message.messageId,
        });

        return 'I am receiving a lot of messages right now. Please wait a minute and try again.';
      }

      throw error;
    }

    const aiReply = await openAiService.generateWhatsAppReply({
      userMessage: message.text,
      userPhoneNumber: message.from,
      contactName: message.contactName,
      conversationHistory: [],
    });

    return aiReply.text;
  }
}

export const conversationService = new ConversationService();
