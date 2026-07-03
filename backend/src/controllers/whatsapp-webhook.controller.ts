import type { RequestHandler } from 'express';
import { logger } from '../config/logger.js';
import { conversationService } from '../services/conversation.service.js';
import { whatsappService } from '../services/whatsapp.service.js';
import type { WhatsAppWebhookPayload } from '../types/whatsapp.types.js';

export const verifyWebhook: RequestHandler = (req, res, next) => {
  try {
    const challenge = whatsappService.verifyWebhook(
      req.query['hub.mode'],
      req.query['hub.verify_token'],
      req.query['hub.challenge'],
    );

    res.status(200).send(challenge);
  } catch (error) {
    next(error);
  }
};

export const receiveWebhook: RequestHandler = async (req, res, next) => {
  try {
    const parsed = whatsappService.parseWebhook(req.body as WhatsAppWebhookPayload);

    for (const status of parsed.statuses) {
      logger.info('WhatsApp message status received', status);
    }

    for (const message of parsed.messages) {
      logger.info('WhatsApp message received', {
        messageId: message.messageId,
        from: message.from,
        type: message.type,
      });

      await whatsappService.sendTypingIndicator(message.messageId);

      const reply = await conversationService.generateReplyForIncomingMessage(message);

      await whatsappService.sendTextMessage({
        to: message.from,
        body: reply,
        replyToMessageId: message.messageId,
      });
    }

    res.status(200).json({
      success: true,
      processed: {
        messages: parsed.messages.length,
        statuses: parsed.statuses.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
