import OpenAI from 'openai';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { whatsappAssistantSystemPrompt } from '../prompts/whatsapp-system.prompt.js';
import type {
  AiConversationMessage,
  GenerateReplyInput,
  GenerateReplyResult,
} from '../types/ai.types.js';
import { AppError } from '../utils/app-error.js';

class OpenAiService {
  private readonly client = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

  async generateWhatsAppReply(input: GenerateReplyInput): Promise<GenerateReplyResult> {
    const messages = this.formatConversation(input);

    const response = await this.withRetry(async () => {
      return this.client.responses.create({
        model: env.OPENAI_MODEL,
        instructions: whatsappAssistantSystemPrompt,
        input: messages.map((message) => ({
          role: message.role === 'system' ? 'developer' : message.role,
          content: message.content,
        })),
        temperature: env.OPENAI_TEMPERATURE,
        max_output_tokens: env.OPENAI_MAX_OUTPUT_TOKENS,
      });
    });

    const text = response.output_text?.trim();

    if (!text) {
      throw new AppError('OpenAI returned an empty response', 502);
    }

    return {
      text,
      model: env.OPENAI_MODEL,
    };
  }

  async generateWhatsAppReplyStream(input: GenerateReplyInput): Promise<GenerateReplyResult> {
    const messages = this.formatConversation(input);
    let text = '';

    const stream = await this.withRetry(async () => {
      return this.client.responses.stream({
        model: env.OPENAI_MODEL,
        instructions: whatsappAssistantSystemPrompt,
        input: messages.map((message) => ({
          role: message.role === 'system' ? 'developer' : message.role,
          content: message.content,
        })),
        temperature: env.OPENAI_TEMPERATURE,
        max_output_tokens: env.OPENAI_MAX_OUTPUT_TOKENS,
      });
    });

    for await (const event of stream) {
      if (event.type === 'response.output_text.delta') {
        text += event.delta;
      }
    }

    const finalText = text.trim();

    if (!finalText) {
      throw new AppError('OpenAI returned an empty streamed response', 502);
    }

    return {
      text: finalText,
      model: env.OPENAI_MODEL,
    };
  }

  private formatConversation(input: GenerateReplyInput): AiConversationMessage[] {
    const userLabel = input.contactName
      ? `${input.contactName} (${input.userPhoneNumber})`
      : input.userPhoneNumber;

    return [
      ...(input.conversationHistory ?? []),
      {
        role: 'user',
        content: `WhatsApp user ${userLabel} says: ${input.userMessage}`,
      },
    ];
  }

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= env.OPENAI_MAX_RETRIES; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt === env.OPENAI_MAX_RETRIES || !this.isRetryable(error)) {
          break;
        }

        const delayMs = 500 * 2 ** attempt;
        logger.warn('Retrying OpenAI request', {
          attempt: attempt + 1,
          nextDelayMs: delayMs,
        });

        await new Promise((resolve) => {
          setTimeout(resolve, delayMs);
        });
      }
    }

    logger.error('OpenAI request failed', { error: lastError });
    throw new AppError('OpenAI request failed', 502, this.sanitizeError(lastError));
  }

  private isRetryable(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    const status = 'status' in error && typeof error.status === 'number' ? error.status : undefined;

    return (
      status === 408 || status === 409 || status === 429 || (status !== undefined && status >= 500)
    );
  }

  private sanitizeError(error: unknown): Record<string, unknown> {
    if (!(error instanceof Error)) {
      return { message: 'Unknown OpenAI error' };
    }

    const status = 'status' in error && typeof error.status === 'number' ? error.status : undefined;

    return {
      message: error.message,
      status,
    };
  }
}

export const openAiService = new OpenAiService();
