# WhatsApp AI Agent

A production-oriented AI WhatsApp automation agent built in phases.

## Current Status

Phase 1 is the project foundation:

- Monorepo workspace
- Backend Express server
- TypeScript
- MongoDB connection
- Redis connection
- Environment validation
- Centralized errors
- Winston logging
- Request logging
- Health endpoint
- Professional folder structure

Phase 2 adds WhatsApp Cloud API integration:

- Webhook verification endpoint
- Signed webhook POST endpoint
- WhatsApp message and status parsing
- Text, image, and document send helpers
- Read receipt and typing indicator helpers
- Signature tests

Phase 3 adds OpenAI integration:

- OpenAI Responses API service
- WhatsApp text messages routed through AI
- System prompt
- Temperature and output-token configuration
- Retry logic for transient API failures
- Streaming helper for future channels
- Per-user AI rate limiting
- Conversation formatting boundary for Phase 4 memory

Phase 4 adds conversation memory:

- MongoDB user, conversation, and message models
- Phone-number based multi-user memory
- Session IDs and last-activity tracking
- Recent-message context windows
- Conversation summaries for long-running chats
- Automatic inactive-session and expired-message cleanup
- Repository layer for reusable database access

## Quick Start

```bash
cp .env.example .env
npm install
docker compose up -d mongodb redis
npm run dev --workspace backend
```

Health check:

```bash
curl http://localhost:4000/api/v1/health
```

WhatsApp webhook verification URL:

```text
https://your-domain.com/api/v1/webhooks/whatsapp
```

## Phase Workflow

This project is intentionally built in phases. After each phase is completed, development pauses for confirmation before moving to the next phase.

## Suggested Commit For Phase 1

```bash
git add .
git commit -m "chore: scaffold phase 1 project foundation"
```
