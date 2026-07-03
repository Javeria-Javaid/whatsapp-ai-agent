import { conversationService } from '../services/conversation.service.js';
import { openAiService } from '../services/openai.service.js';
import type { ParsedWhatsAppMessage } from '../types/whatsapp.types.js';

jest.mock('../services/openai.service.js', () => ({
  openAiService: {
    generateWhatsAppReply: jest.fn(),
  },
}));

const mockedOpenAiService = jest.mocked(openAiService);

describe('Conversation service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      conversationHistory: [],
    });
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
  });
});
