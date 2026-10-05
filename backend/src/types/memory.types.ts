import type { AiConversationMessage } from './ai.types.js';
import type { MessageRole } from '../models/message.model.js';

export interface ConversationMemoryContext {
  conversationId: string;
  sessionId: string;
  summary?: string;
  history: AiConversationMessage[];
}

export interface StoreMessageInput {
  conversationId: string;
  userId: string;
  phoneNumber: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  sourceMessageId?: string;
  metadata?: Record<string, unknown>;
  timestamp?: Date;
}

export interface PrepareMemoryInput {
  phoneNumber: string;
  contactName?: string;
  sourceMessageId: string;
  text: string;
  timestamp: Date;
}
