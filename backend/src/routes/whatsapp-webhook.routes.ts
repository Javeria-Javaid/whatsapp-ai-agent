import { Router } from 'express';
import { receiveWebhook, verifyWebhook } from '../controllers/whatsapp-webhook.controller.js';
import { verifyWhatsAppSignature } from '../middlewares/whatsapp-signature.middleware.js';

export const whatsappWebhookRouter = Router();

whatsappWebhookRouter.get('/', verifyWebhook);
whatsappWebhookRouter.post('/', verifyWhatsAppSignature, receiveWebhook);
