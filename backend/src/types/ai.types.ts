export type AiMessageRole = 'system' | 'user' | 'assistant';

export interface AiConversationMessage {
  role: AiMessageRole;
  content: string;
}

export interface GenerateReplyInput {
  userMessage: string;
  userPhoneNumber: string;
  contactName?: string;
  conversationSummary?: string;
  conversationHistory?: AiConversationMessage[];
  knowledgeContext?: string;
}

export interface GenerateReplyResult {
  text: string;
  model: string;
}

export interface SummarizeConversationInput {
  existingSummary?: string;
  messages: AiConversationMessage[];
}
