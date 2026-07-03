import crypto from 'node:crypto';
import type { RequestHandler } from 'express';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

export const verifyWhatsAppSignature: RequestHandler = (req, _res, next) => {
  const signatureHeader = req.header('x-hub-signature-256');

  if (!signatureHeader) {
    next(new AppError('Missing WhatsApp signature header', 401));
    return;
  }

  if (!req.rawBody) {
    next(new AppError('Raw request body unavailable for signature verification', 500));
    return;
  }

  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', env.WHATSAPP_APP_SECRET)
    .update(req.rawBody)
    .digest('hex')}`;

  const provided = Buffer.from(signatureHeader, 'utf8');
  const expected = Buffer.from(expectedSignature, 'utf8');

  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    next(new AppError('Invalid WhatsApp signature', 401));
    return;
  }

  next();
};
