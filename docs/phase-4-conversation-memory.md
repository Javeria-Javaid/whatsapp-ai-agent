# Phase 4: Conversation Memory

## What This Phase Builds

Phase 4 gives the WhatsApp assistant memory:

- Stores users by phone number.
- Stores conversations with session IDs.
- Stores every incoming user message.
- Stores every assistant reply.
- Tracks timestamps, roles, conversation IDs, session IDs, and last activity.
- Retrieves recent conversation history before calling OpenAI.
- Adds conversation summaries for long chats.
- Adds automatic cleanup for inactive conversations and expired messages.

## Main Files

- `backend/src/models/user.model.ts`: MongoDB schema for WhatsApp users.
- `backend/src/models/conversation.model.ts`: MongoDB schema for conversation sessions.
- `backend/src/models/message.model.ts`: MongoDB schema for user, assistant, and system messages.
- `backend/src/repositories/user.repository.ts`: User database access.
- `backend/src/repositories/conversation.repository.ts`: Conversation database access.
- `backend/src/repositories/message.repository.ts`: Message database access.
- `backend/src/memory/conversation-memory.service.ts`: Memory orchestration.
- `backend/src/jobs/memory-cleanup.job.ts`: Automatic cleanup job.

## Environment Variables

```env
MEMORY_SESSION_TIMEOUT_MINUTES=30
MEMORY_CONTEXT_MESSAGE_LIMIT=12
MEMORY_SUMMARY_TRIGGER_MESSAGES=30
MEMORY_RETENTION_DAYS=365
MEMORY_CLEANUP_INTERVAL_MINUTES=60
```

## Data Stored

### User

```ts
{
  phoneNumber: string;
  displayName?: string;
  lastActivityAt: Date;
}
```

### Conversation

```ts
{
  userId: ObjectId;
  phoneNumber: string;
  sessionId: string;
  status: 'active' | 'closed';
  summary: string;
  messageCount: number;
  summarizedMessageCount: number;
  lastActivityAt: Date;
}
```

### Message

```ts
{
  conversationId: ObjectId;
  userId: ObjectId;
  phoneNumber: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  sourceMessageId?: string;
  metadata: object;
  timestamp: Date;
  expiresAt: Date;
}
```

## Message Flow

```text
WhatsApp message received
  -> upsert user by phone number
  -> find active conversation for that phone number
  -> create a new session if the old one expired
  -> store incoming user message
  -> retrieve summary and recent messages
  -> call OpenAI with memory context
  -> store assistant reply
  -> maybe summarize the conversation
  -> send reply through WhatsApp
```

## Session Logic

A conversation stays active while the user continues messaging within `MEMORY_SESSION_TIMEOUT_MINUTES`.

Default:

```env
MEMORY_SESSION_TIMEOUT_MINUTES=30
```

If a user sends a message after 30 minutes of inactivity, the app creates a new conversation with a new `sessionId`. This keeps separate support sessions clean while still preserving user-level history in MongoDB.

## Context Window

Only recent messages are sent to OpenAI on each request.

Default:

```env
MEMORY_CONTEXT_MESSAGE_LIMIT=12
```

This prevents prompts from growing forever. The context window includes:

- The durable summary, if one exists.
- Recent user and assistant messages.
- The current user message is excluded from the retrieved history because `openai.service.ts` appends it separately.

## Long-Term Memory

Long-term memory is handled through summaries.

After enough new messages accumulate, the app asks OpenAI to summarize the conversation. The summary keeps durable facts such as:

- User preferences
- Names
- Important dates
- Open requests
- Business context
- Decisions made during the chat

The app then stores that summary on the conversation document and keeps using it in future prompts.

Default trigger:

```env
MEMORY_SUMMARY_TRIGGER_MESSAGES=30
```

## Automatic Cleanup

The cleanup job runs every `MEMORY_CLEANUP_INTERVAL_MINUTES`.

It does two things:

1. Closes inactive conversations.
2. Deletes expired messages.

Messages also have a MongoDB TTL index on `expiresAt`, so MongoDB can remove old messages automatically.

Default retention:

```env
MEMORY_RETENTION_DAYS=365
```

## Why Repositories

Repositories keep database queries out of services and controllers.

This makes the code easier to test and prepares the project for:

- Admin dashboard conversation search
- Analytics
- Exports
- Message moderation
- Future database migrations

## Architectural Decisions

- Users are keyed by phone number because WhatsApp Cloud API identifies contacts by WhatsApp phone number.
- Conversations use `sessionId` so one user can have multiple separate sessions over time.
- Messages store both `conversationId` and `sessionId` for easier querying and analytics.
- Summaries live on conversations rather than users because they describe one support session.
- Cleanup is implemented as a lightweight interval job for now; reminder scheduling in later phases can replace or expand this with `node-cron`.

## Alternatives Considered

- Send all messages to OpenAI every time: rejected because it gets slow and expensive.
- Store one giant text transcript: rejected because structured messages are easier to query, test, summarize, and display in the dashboard.
- User-level summary only: rejected for now because it can mix unrelated support sessions.
- No TTL cleanup: rejected because production chat systems need retention boundaries.

## Tests

Tests added:

- Memory stores incoming user messages.
- Memory retrieves summary-aware context.
- Memory excludes the current message from retrieved history.
- Memory stores assistant replies.
- Existing WhatsApp and AI tests continue to pass.

## Suggested Commit For Phase 4

```bash
git add .
git commit -m "feat: add conversation memory"
```
