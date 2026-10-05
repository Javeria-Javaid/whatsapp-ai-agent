import { conversationService } from '../services/conversation.service.js';
import { openAiService } from '../services/openai.service.js';
import { conversationMemoryService } from '../memory/conversation-memory.service.js';
import { knowledgeBaseService } from '../services/knowledge-base.service.js';
import type { ParsedWhatsAppMessage } from '../types/whatsapp.types.js';

jest.mock('../services/openai.service.js', () => ({
  openAiService: {
    generateWhatsAppReply: jest.fn(),
  },
}));

jest.mock('../memory/conversation-memory.service.js', () => ({
  conversationMemoryService: {
    prepareContextForIncomingMessage: jest.fn(),
    recordAssistantReply: jest.fn(),
  },
}));

jest.mock('../services/knowledge-base.service.js', () => ({
  knowledgeBaseService: {
    buildPromptContext: jest.fn(),
  },
}));

const mockedOpenAiService = jest.mocked(openAiService);
const mockedConversationMemoryService = jest.mocked(conversationMemoryService);
const mockedKnowledgeBaseService = jest.mocked(knowledgeBaseService);

describe('Conversation service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedConversationMemoryService.prepareContextForIncomingMessage.mockResolvedValue({
      conversationId: 'conversation-id',
      sessionId: 'session-id',
      summary: 'The user prefers quick replies.',
      history: [
        {
          role: 'user',
          content: 'Earlier question',
        },
      ],
    });
    mockedKnowledgeBaseService.buildPromptContext.mockResolvedValue(
      '[1] Source: faq.md\nWe are open from 9 AM to 5 PM.',
    );
  });

  it('generates an OpenAI reply for text messages', async () => {
    mockedOpenAiService.generateWhatsAppReply.mockResolvedValue({
      text: 'Hello from AI',
      model: 'gpt-4.1-mini',
    });

    const message: ParsedWhatsAppMessage = {
      messageId: 'wamid.text-message',
      from: '15551234567',
      timestamp: new Date('2026-07-02T09:00:00.000Z'),
      type: 'text',
      text: 'Hi there',
      contactName: 'Aisha',
    };

    await expect(conversationService.generateReplyForIncomingMessage(message)).resolves.toBe(
      'Hello from AI',
    );

    expect(mockedOpenAiService.generateWhatsAppReply).toHaveBeenCalledWith({
      userMessage: 'Hi there',
      userPhoneNumber: '15551234567',
      contactName: 'Aisha',
      conversationSummary: 'The user prefers quick replies.',
      conversationHistory: [
        {
          role: 'user',
          content: 'Earlier question',
        },
      ],
      knowledgeContext: '[1] Source: faq.md\nWe are open from 9 AM to 5 PM.',
    });
    expect(mockedConversationMemoryService.recordAssistantReply).toHaveBeenCalledWith(
      {
        conversationId: 'conversation-id',
        sessionId: 'session-id',
        summary: 'The user prefers quick replies.',
        history: [
          {
            role: 'user',
            content: 'Earlier question',
          },
        ],
      },
      'Hello from AI',
    );
  });

  it('does not call OpenAI for non-text messages in this phase', async () => {
    const message: ParsedWhatsAppMessage = {
      messageId: 'wamid.image-message',
      from: '15551234567',
      timestamp: new Date('2026-07-02T09:00:00.000Z'),
      type: 'image',
    };

    const reply = await conversationService.generateReplyForIncomingMessage(message);

    expect(reply).toContain('I received your image message');
    expect(mockedOpenAiService.generateWhatsAppReply).not.toHaveBeenCalled();
    expect(mockedKnowledgeBaseService.buildPromptContext).not.toHaveBeenCalled();
    expect(mockedConversationMemoryService.recordAssistantReply).toHaveBeenCalled();
  });
});
