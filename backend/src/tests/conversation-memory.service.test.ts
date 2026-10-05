import { conversationMemoryService } from '../memory/conversation-memory.service.js';
import { conversationRepository } from '../repositories/conversation.repository.js';
import { messageRepository } from '../repositories/message.repository.js';
import { userRepository } from '../repositories/user.repository.js';

jest.mock('../repositories/user.repository.js', () => ({
  userRepository: {
    upsertByPhoneNumber: jest.fn(),
  },
}));

jest.mock('../repositories/conversation.repository.js', () => ({
  conversationRepository: {
    findActive: jest.fn(),
    create: jest.fn(),
    touch: jest.fn(),
    incrementMessageCount: jest.fn(),
    findById: jest.fn(),
    closeInactive: jest.fn(),
  },
}));

jest.mock('../repositories/message.repository.js', () => ({
  messageRepository: {
    create: jest.fn(),
    findRecentByConversation: jest.fn(),
    deleteExpired: jest.fn(),
    findUnsummarizedByConversation: jest.fn(),
  },
}));

jest.mock('../services/openai.service.js', () => ({
  openAiService: {
    summarizeConversation: jest.fn(),
  },
}));

const mockedUserRepository = jest.mocked(userRepository);
const mockedConversationRepository = jest.mocked(conversationRepository);
const mockedMessageRepository = jest.mocked(messageRepository);

const objectIdLike = (value: string) => ({
  toString: () => value,
});

describe('Conversation memory service', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedUserRepository.upsertByPhoneNumber.mockResolvedValue({
      _id: objectIdLike('user-id'),
    } as never);

    mockedConversationRepository.findActive.mockResolvedValue({
      _id: objectIdLike('conversation-id'),
      userId: objectIdLike('user-id'),
      phoneNumber: '15551234567',
      sessionId: 'session-id',
      summary: 'User asked about pricing.',
      messageCount: 4,
      summarizedMessageCount: 0,
    } as never);

    mockedMessageRepository.findRecentByConversation.mockResolvedValue([
      {
        role: 'assistant',
        content: 'Earlier answer',
      },
      {
        role: 'user',
        content: 'Current user message',
        sourceMessageId: 'wamid.current',
      },
    ] as never);
  });

  it('stores incoming messages and returns summary-aware context', async () => {
    const context = await conversationMemoryService.prepareContextForIncomingMessage({
      phoneNumber: '15551234567',
      contactName: 'Aisha',
      sourceMessageId: 'wamid.current',
      text: 'What is the price?',
      timestamp: new Date('2026-07-03T08:00:00.000Z'),
    });

    expect(mockedUserRepository.upsertByPhoneNumber).toHaveBeenCalledWith('15551234567', 'Aisha');
    expect(mockedConversationRepository.touch).toHaveBeenCalled();
    expect(mockedMessageRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'user',
        content: 'What is the price?',
        sourceMessageId: 'wamid.current',
      }),
    );
    expect(context).toEqual({
      conversationId: 'conversation-id',
      sessionId: 'session-id',
      summary: 'User asked about pricing.',
      history: [
        {
          role: 'system',
          content: 'Conversation summary so far: User asked about pricing.',
        },
        {
          role: 'assistant',
          content: 'Earlier answer',
        },
      ],
    });
  });

  it('records assistant replies against the existing conversation session', async () => {
    mockedConversationRepository.findById.mockResolvedValue({
      _id: objectIdLike('conversation-id'),
      userId: objectIdLike('user-id'),
      phoneNumber: '15551234567',
      sessionId: 'session-id',
      messageCount: 4,
      summarizedMessageCount: 0,
    } as never);

    await conversationMemoryService.recordAssistantReply(
      {
        conversationId: 'conversation-id',
        sessionId: 'session-id',
        history: [],
      },
      'Here is the answer.',
    );

    expect(mockedMessageRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 'conversation-id',
        userId: 'user-id',
        phoneNumber: '15551234567',
        sessionId: 'session-id',
        role: 'assistant',
        content: 'Here is the answer.',
      }),
    );
  });
});
