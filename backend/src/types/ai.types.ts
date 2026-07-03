export type AiMessageRole = 'system' | 'user' | 'assistant';

export interface AiConversationMessage {
  role: AiMessageRole;
  content: string;
}

export interface GenerateReplyInput {
  userMessage: string;
  userPhoneNumber: string;
  contactName?: string;
  conversationHistory?: AiConversationMessage[];
}

export interface GenerateReplyResult {
  text: string;
  model: string;
}
