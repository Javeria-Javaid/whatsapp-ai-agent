# Phase 1: Project Setup

## What This Phase Builds

Phase 1 creates the foundation required by every later feature:

- A TypeScript Express backend
- Validated environment variables
- MongoDB and Redis connection helpers
- Winston logging
- Request logging
- Centralized error handling
- Health endpoint
- Scalable folder structure
- Docker Compose services for local MongoDB and Redis

## Why TypeScript

TypeScript is optional in the original requirements, but it is a strong choice for this project because WhatsApp webhooks, OpenAI responses, tool calls, and database documents all have structured payloads. Types catch integration mistakes early and make refactoring safer as the codebase grows.

## Folder Structure

```text
whatsapp-ai-agent/
  backend/
    src/
      config/
      controllers/
      jobs/
      memory/
      middlewares/
      models/
      prompts/
      repositories/
      routes/
      services/
      tools/
      uploads/
      utils/
      vector/
  frontend/
  docs/
  docker/
  tests/
```

## Why Each Folder Exists

- `backend/src/config`: Centralized configuration for environment variables, database clients, and shared infrastructure.
- `backend/src/controllers`: HTTP layer that receives requests and returns responses. Controllers should stay thin.
- `backend/src/routes`: Route definitions that connect URLs to controllers and middleware.
- `backend/src/middlewares`: Express middleware such as request logging, validation, authentication, and error handling.
- `backend/src/services`: Business logic such as WhatsApp messaging, OpenAI calls, reminders, and document processing.
- `backend/src/repositories`: Database access logic. This keeps MongoDB queries out of controllers and services.
- `backend/src/models`: MongoDB/Mongoose schemas and TypeScript model types.
- `backend/src/utils`: Reusable helpers such as custom errors, async wrappers, response helpers, and constants.
- `backend/src/prompts`: System prompts and prompt templates used by the AI layer.
- `backend/src/tools`: Modular AI-callable tools such as calculator, weather, reminders, and CRM lookup.
- `backend/src/memory`: Conversation memory retrieval, summarization, and context-window logic.
- `backend/src/jobs`: Scheduled jobs such as reminder dispatch and cleanup jobs.
- `backend/src/vector`: Embedding and vector database integration for RAG.
- `backend/uploads`: Local file storage for documents, images, and audio during early phases.
- `frontend`: React, Vite, and Tailwind dashboard application. The dashboard is implemented in later phases.
- `docs`: Human-readable architecture, setup, API, and deployment documentation.
- `docker`: Dockerfiles, NGINX config, and deployment-related container files added in production phases.
- `tests`: Cross-cutting test helpers and integration tests. Package-level tests can also live beside source files.

## Dependencies Installed In Phase 1

Backend runtime dependencies:

- `compression`: Compresses HTTP responses in production.
- `cors`: Controls browser access to API resources.
- `dotenv`: Loads environment variables from `.env`.
- `express`: HTTP server framework.
- `helmet`: Adds secure HTTP headers.
- `mongoose`: MongoDB object modeling and connection management.
- `morgan`: HTTP request logging middleware.
- `redis`: Official Redis client.
- `winston`: Structured application logging.
- `zod`: Runtime validation for environment variables and future API inputs.

Backend development dependencies:

- `@eslint/js`: Base ESLint JavaScript rules.
- `@types/compression`: Type definitions for compression.
- `@types/cors`: Type definitions for CORS middleware.
- `@types/express`: Type definitions for Express.
- `@types/jest`: Type definitions for Jest.
- `@types/morgan`: Type definitions for Morgan.
- `@types/node`: Node.js type definitions.
- `eslint`: Static code analysis.
- `jest`: Test runner.
- `supertest`: HTTP API test helper.
- `ts-jest`: Runs TypeScript tests in Jest.
- `tsx`: Runs TypeScript directly during development.
- `typescript`: TypeScript compiler.
- `typescript-eslint`: TypeScript-aware ESLint rules.

Root development dependency:

- `prettier`: Consistent formatting across backend, frontend, docs, and config files.

## Health Endpoint

`GET /api/v1/health`

Example response:

```json
{
  "status": "ok",
  "environment": "development",
  "uptime": 12.34,
  "timestamp": "2026-07-02T10:00:00.000Z",
  "services": {
    "mongodb": "connected",
    "redis": "connected"
  }
}
```

## Architectural Decisions

- Controllers are kept thin so business rules can be tested independently in services.
- Environment variables are validated with Zod at startup so missing secrets fail fast.
- Database clients live in `config` because they are infrastructure concerns used across modules.
- Errors pass through one middleware so the API responds consistently.
- Winston is used for application logs because it supports transports, levels, and JSON logs for production.
- Morgan forwards request logs into Winston so HTTP logs and application logs share one pipeline.

## Alternatives Considered

- JavaScript instead of TypeScript: faster setup, but weaker safety for webhook and AI payloads.
- Prisma instead of Mongoose: excellent for SQL, but Mongoose fits MongoDB document modeling directly.
- Pino instead of Winston: faster and popular, but Winston is explicit in the requirements.
- In-memory Redis substitute: simpler for local development, but using real Redis avoids surprises later.
