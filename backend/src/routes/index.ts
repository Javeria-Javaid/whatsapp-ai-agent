import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { knowledgeRouter } from './knowledge.routes.js';
import { whatsappWebhookRouter } from './whatsapp-webhook.routes.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/knowledge', knowledgeRouter);
apiRouter.use('/webhooks/whatsapp', whatsappWebhookRouter);
