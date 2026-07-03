import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError } from '../utils/app-error.js';
import type {
  ParsedWhatsAppMessage,
  ParsedWhatsAppStatus,
  ParsedWhatsAppWebhook,
  WhatsAppWebhookPayload,
} from '../types/whatsapp.types.js';

interface SendTextMessageInput {
  to: string;
  body: string;
  replyToMessageId?: string;
}

interface SendImageMessageInput {
  to: string;
  imageId?: string;
  imageUrl?: string;
  caption?: string;
}

interface SendDocumentMessageInput {
  to: string;
  documentId?: string;
  documentUrl?: string;
  filename?: string;
  caption?: string;
}

class WhatsAppService {
  private readonly graphBaseUrl = `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}`;

  verifyWebhook(mode: unknown, token: unknown, challenge: unknown): string {
    if (
      mode !== 'subscribe' ||
      token !== env.WHATSAPP_VERIFY_TOKEN ||
      typeof challenge !== 'string'
    ) {
      throw new AppError('WhatsApp webhook verification failed', 403);
    }

    return challenge;
  }

  parseWebhook(payload: WhatsAppWebhookPayload): ParsedWhatsAppWebhook {
    const messages: ParsedWhatsAppMessage[] = [];
    const statuses: ParsedWhatsAppStatus[] = [];

    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes) {
        const contactsByWaId = new Map(
          (change.value.contacts ?? []).map((contact) => [contact.wa_id, contact.profile?.name]),
        );

        for (const message of change.value.messages ?? []) {
          messages.push({
            messageId: message.id,
            from: message.from,
            timestamp: new Date(Number(message.timestamp) * 1000),
            type: message.type,
            text: this.extractText(message),
            contactName: contactsByWaId.get(message.from),
          });
        }

        for (const status of change.value.statuses ?? []) {
          const firstError = status.errors?.[0];

          statuses.push({
            messageId: status.id,
            recipientId: status.recipient_id,
            status: status.status,
            timestamp: new Date(Number(status.timestamp) * 1000),
            error: firstError
              ? `${firstError.title}${firstError.error_data?.details ? `: ${firstError.error_data.details}` : ''}`
              : undefined,
          });
        }
      }
    }

    return { messages, statuses };
  }

  async sendTextMessage(input: SendTextMessageInput): Promise<unknown> {
    const payload: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: input.to,
      type: 'text',
      text: {
        preview_url: false,
        body: input.body,
      },
    };

    if (input.replyToMessageId) {
      payload.context = {
        message_id: input.replyToMessageId,
      };
    }

    return this.sendMessage(payload);
  }

  async sendImageMessage(input: SendImageMessageInput): Promise<unknown> {
    if (!input.imageId && !input.imageUrl) {
      throw new AppError('Either imageId or imageUrl is required', 400);
    }

    return this.sendMessage({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: input.to,
      type: 'image',
      image: {
        ...(input.imageId ? { id: input.imageId } : { link: input.imageUrl }),
        ...(input.caption ? { caption: input.caption } : {}),
      },
    });
  }

  async sendDocumentMessage(input: SendDocumentMessageInput): Promise<unknown> {
    if (!input.documentId && !input.documentUrl) {
      throw new AppError('Either documentId or documentUrl is required', 400);
    }

    return this.sendMessage({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: input.to,
      type: 'document',
      document: {
        ...(input.documentId ? { id: input.documentId } : { link: input.documentUrl }),
        ...(input.filename ? { filename: input.filename } : {}),
        ...(input.caption ? { caption: input.caption } : {}),
      },
    });
  }

  async markMessageAsRead(messageId: string): Promise<unknown> {
    return this.sendMessage({
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    });
  }

  async sendTypingIndicator(messageId: string): Promise<unknown> {
    return this.sendMessage({
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
      typing_indicator: {
        type: 'text',
      },
    });
  }

  private extractText(message: { type: string; text?: { body: string } }): string | undefined {
    if (message.type === 'text') {
      return message.text?.body;
    }

    return undefined;
  }

  private async sendMessage(payload: Record<string, unknown>): Promise<unknown> {
    const response = await fetch(`${this.graphBaseUrl}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseBody = (await response.json().catch(() => undefined)) as unknown;

    if (!response.ok) {
      logger.error('WhatsApp Cloud API request failed', {
        status: response.status,
        responseBody,
      });

      throw new AppError('WhatsApp Cloud API request failed', response.status, responseBody);
    }

    return responseBody;
  }
}

export const whatsappService = new WhatsAppService();
