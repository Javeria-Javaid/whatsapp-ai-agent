import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().default('/api/v1'),
  MONGODB_URI: z.string().url().or(z.string().startsWith('mongodb://')),
  REDIS_URL: z.string().url().or(z.string().startsWith('redis://')),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),
  OPENAI_API_KEY: z.string().min(1).default('replace-with-openai-api-key'),
  OPENAI_MODEL: z.string().min(1).default('gpt-4.1-mini'),
  OPENAI_EMBEDDING_MODEL: z.string().min(1).default('text-embedding-3-small'),
  OPENAI_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.4),
  OPENAI_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().default(600),
  OPENAI_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
  AI_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(60),
  AI_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(20),
  MEMORY_SESSION_TIMEOUT_MINUTES: z.coerce.number().int().positive().default(30),
  MEMORY_CONTEXT_MESSAGE_LIMIT: z.coerce.number().int().positive().default(12),
  MEMORY_SUMMARY_TRIGGER_MESSAGES: z.coerce.number().int().positive().default(30),
  MEMORY_RETENTION_DAYS: z.coerce.number().int().positive().default(365),
  MEMORY_CLEANUP_INTERVAL_MINUTES: z.coerce.number().int().positive().default(60),
  CHROMA_URL: z.string().url().default('http://localhost:8000'),
  CHROMA_COLLECTION_NAME: z.string().min(1).default('whatsapp_ai_agent_knowledge'),
  RAG_CHUNK_SIZE: z.coerce.number().int().positive().default(900),
  RAG_CHUNK_OVERLAP: z.coerce.number().int().min(0).default(150),
  RAG_TOP_K: z.coerce.number().int().positive().default(5),
  RAG_MAX_CONTEXT_CHARACTERS: z.coerce.number().int().positive().default(4000),
  UPLOAD_MAX_FILE_SIZE_MB: z.coerce.number().int().positive().default(20),
  WHATSAPP_API_VERSION: z.string().default('v23.0'),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1).default('replace-with-meta-phone-number-id'),
  WHATSAPP_ACCESS_TOKEN: z.string().min(1).default('replace-with-meta-access-token'),
  WHATSAPP_VERIFY_TOKEN: z.string().min(1).default('replace-with-webhook-verify-token'),
  WHATSAPP_APP_SECRET: z.string().min(1).default('replace-with-meta-app-secret'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const formatted = parsedEnv.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n');

  throw new Error(`Invalid environment configuration:\n${formatted}`);
}

export const env = parsedEnv.data;
