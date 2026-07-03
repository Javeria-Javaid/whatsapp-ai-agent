# Phase 3: OpenAI Integration

## What This Phase Builds

Phase 3 connects incoming WhatsApp text messages to OpenAI:

- Receives a WhatsApp message.
- Sends the message to OpenAI using the Responses API.
- Receives an AI-generated reply.
- Sends the reply back through WhatsApp Cloud API.
- Adds a system prompt.
- Adds temperature and output-token configuration.
- Adds retry logic.
- Adds a streaming response helper.
- Adds rate limiting.
- Adds a conversation formatting boundary for future memory.

## Environment Variables

```env
OPENAI_API_KEY=replace-with-openai-api-key
OPENAI_MODEL=gpt-4.1-mini
OPENAI_TEMPERATURE=0.4
OPENAI_MAX_OUTPUT_TOKENS=600
OPENAI_MAX_RETRIES=2
AI_RATE_LIMIT_WINDOW_SECONDS=60
AI_RATE_LIMIT_MAX_REQUESTS=20
```

## Main Files

- `backend/src/services/openai.service.ts`: Owns OpenAI API calls, retries, streaming, and response extraction.
- `backend/src/services/conversation.service.ts`: Converts incoming WhatsApp messages into AI-ready requests.
- `backend/src/services/ai-rate-limit.service.ts`: Limits per-user AI usage.
- `backend/src/prompts/whatsapp-system.prompt.ts`: Stores the assistant system prompt.
- `backend/src/types/ai.types.ts`: Defines AI conversation message types.

## Request Flow

```text
Meta WhatsApp Webhook
  -> verify signature
  -> parse WhatsApp payload
  -> send typing indicator
  -> conversationService.generateReplyForIncomingMessage
  -> aiRateLimitService.assertAllowed
  -> openAiService.generateWhatsAppReply
  -> whatsappService.sendTextMessage
```

## Why Responses API

The OpenAI Responses API is used because it is the current unified OpenAI API surface for model responses, streaming, multimodal expansion, and tool-using workflows. This project will need tools, RAG, voice, and richer context later, so starting with Responses keeps the architecture aligned with future phases.

## Prompt Engineering Choices

The system prompt is intentionally short and operational:

- It tells the assistant it is acting inside WhatsApp.
- It asks for concise replies because WhatsApp is a short-message channel.
- It prevents invented policies, prices, or private business data.
- It asks for one follow-up question when the request is ambiguous.
- It clearly states current phase limits so the model does not claim memory, media understanding, or tools before those features exist.

This prompt is stored in `prompts/` rather than inline inside the service so prompts can be versioned, reviewed, and tested like application logic.

## Temperature

`OPENAI_TEMPERATURE=0.4` keeps replies flexible without making them overly creative. For business automation, reliability matters more than novelty.

Alternative:

- `0.0` to `0.2`: better for strict FAQ or policy responses.
- `0.7` to `1.0`: better for creative marketing copy, but riskier for support automation.

## Token Limit

`OPENAI_MAX_OUTPUT_TOKENS=600` prevents unusually long responses and helps control cost. The system prompt also asks the model to stay under 900 characters unless the user asks for detail.

## Streaming

`generateWhatsAppReplyStream` is implemented for future channels that can display partial output. WhatsApp messages are sent as complete replies, so the webhook currently uses the non-streaming method.

## Retry Logic

Transient OpenAI failures are retried with exponential backoff:

- HTTP `408`
- HTTP `409`
- HTTP `429`
- HTTP `5xx`

Non-retryable errors fail fast and pass through centralized error handling.

## Rate Limiting

The AI rate limiter uses Redis when Redis is connected. If Redis is not available, it falls back to an in-memory limiter so local development and tests still work.

Production should use Redis because in-memory limits are per-process and reset on restart.

## Conversation Formatting

In Phase 3, the conversation sent to OpenAI contains only:

- The system prompt.
- The latest user message.
- Basic WhatsApp identity context such as phone number and contact name.

Phase 4 will replace the empty `conversationHistory` array with MongoDB-backed conversation memory.

## Example OpenAI Input Shape

```ts
{
  model: "gpt-4.1-mini",
  instructions: whatsappAssistantSystemPrompt,
  input: [
    {
      role: "user",
      content: "WhatsApp user Aisha (15551234567) says: What are your hours?"
    }
  ],
  temperature: 0.4,
  max_output_tokens: 600
}
```

## Example WhatsApp Result

User:

```text
What are your opening hours?
```

Assistant:

```text
I can help with that. Which branch or location are you asking about?
```

## Testing

Tests added:

- Text messages delegate to the AI service.
- Non-text messages do not call OpenAI in this phase.
- Existing WhatsApp webhook verification and signature tests still pass.

The test suite mocks the OpenAI service instead of making live API calls.

## Architectural Decisions

- OpenAI calls are isolated in `openai.service.ts`.
- WhatsApp-specific code does not know about OpenAI SDK details.
- Conversation orchestration lives in `conversation.service.ts`, which becomes the natural home for Phase 4 memory.
- Prompt text lives in `prompts/` so it can evolve independently.
- Rate limiting happens before model calls to reduce cost and protect the API.

## Alternatives Considered

- Calling OpenAI directly from the webhook controller: rejected because controllers should stay thin.
- Storing prompt text in environment variables: rejected because multi-line prompts are harder to review and test there.
- Streaming directly to WhatsApp: not useful yet because WhatsApp sends complete messages, not token-by-token UI updates.
- No rate limiting until production: rejected because model-call cost control should exist from the first AI phase.

## Suggested Commit For Phase 3

```bash
git add .
git commit -m "feat: route WhatsApp messages through OpenAI"
```
