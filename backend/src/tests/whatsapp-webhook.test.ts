import crypto from 'node:crypto';
import request from 'supertest';
import { createApp } from '../app.js';

const app = createApp();

describe('WhatsApp webhook', () => {
  it('returns the challenge when Meta verifies the webhook', async () => {
    const response = await request(app).get('/api/v1/webhooks/whatsapp').query({
      'hub.mode': 'subscribe',
      'hub.verify_token': 'test-verify-token',
      'hub.challenge': 'challenge-code',
    });

    expect(response.status).toBe(200);
    expect(response.text).toBe('challenge-code');
  });

  it('rejects webhook POST requests with an invalid signature', async () => {
    const response = await request(app)
      .post('/api/v1/webhooks/whatsapp')
      .set('x-hub-signature-256', 'sha256=invalid')
      .send({ object: 'whatsapp_business_account', entry: [] });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Invalid WhatsApp signature');
  });

  it('accepts signed webhook POST requests and processes message statuses', async () => {
    const payload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'waba-id',
          changes: [
            {
              field: 'messages',
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '15551234567',
                  phone_number_id: 'test-phone-number-id',
                },
                statuses: [
                  {
                    id: 'wamid.status-id',
                    status: 'delivered',
                    timestamp: '1782980000',
                    recipient_id: '15557654321',
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const rawPayload = JSON.stringify(payload);
    const signature = `sha256=${crypto
      .createHmac('sha256', 'test-app-secret')
      .update(Buffer.from(rawPayload))
      .digest('hex')}`;

    const response = await request(app)
      .post('/api/v1/webhooks/whatsapp')
      .set('content-type', 'application/json')
      .set('x-hub-signature-256', signature)
      .send(rawPayload);

    expect(response.status).toBe(200);
    expect(response.body.processed).toEqual({
      messages: 0,
      statuses: 1,
    });
  });
});
