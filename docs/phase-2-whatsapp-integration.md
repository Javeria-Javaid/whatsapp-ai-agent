# Phase 2: WhatsApp Cloud API Integration

## What This Phase Builds

Phase 2 connects the backend to Meta WhatsApp Cloud API:

- Webhook verification
- Signed webhook receiving
- Message parsing
- Message status parsing
- Text replies
- Image send helper
- Document send helper
- Typing indicator helper
- Read receipt helper
- Error handling and logging
- Webhook tests

## Environment Variables

```env
WHATSAPP_API_VERSION=v23.0
WHATSAPP_PHONE_NUMBER_ID=replace-with-meta-phone-number-id
WHATSAPP_ACCESS_TOKEN=replace-with-meta-access-token
WHATSAPP_VERIFY_TOKEN=replace-with-webhook-verify-token
WHATSAPP_APP_SECRET=replace-with-meta-app-secret
```

## Endpoints

### `GET /api/v1/webhooks/whatsapp`

Meta calls this endpoint when you configure the webhook callback URL.

Query parameters sent by Meta:

- `hub.mode`: should be `subscribe`
- `hub.verify_token`: must match `WHATSAPP_VERIFY_TOKEN`
- `hub.challenge`: random challenge string that must be returned as plain text

Successful response:

```text
hub.challenge value
```

Failure response:

```json
{
  "success": false,
  "error": {
    "message": "WhatsApp webhook verification failed"
  }
}
```

### `POST /api/v1/webhooks/whatsapp`

Meta calls this endpoint whenever a subscribed WhatsApp event occurs.

Required header:

```text
X-Hub-Signature-256: sha256=<hmac>
```

The server calculates its own HMAC SHA-256 digest using `WHATSAPP_APP_SECRET` and the raw request body. It then compares the provided and expected signatures using `crypto.timingSafeEqual`.

Example status payload:

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "waba-id",
      "changes": [
        {
          "field": "messages",
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15551234567",
              "phone_number_id": "123456789"
            },
            "statuses": [
              {
                "id": "wamid.message-id",
                "status": "delivered",
                "timestamp": "1782980000",
                "recipient_id": "15557654321"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

Successful response:

```json
{
  "success": true,
  "processed": {
    "messages": 0,
    "statuses": 1
  }
}
```

## Message Flow In This Phase

1. Meta sends a signed webhook request.
2. `verifyWhatsAppSignature` validates `X-Hub-Signature-256`.
3. `receiveWebhook` parses messages and statuses.
4. Status events are logged.
5. Incoming messages trigger a typing indicator.
6. Text messages receive a deterministic placeholder reply.
7. Non-text messages receive a placeholder reply that acknowledges the type.

The deterministic reply is intentional. Phase 3 replaces it with OpenAI-generated responses.

## WhatsApp Service Methods

- `verifyWebhook`: Validates Meta webhook setup requests.
- `parseWebhook`: Converts raw Meta webhook payloads into simpler internal objects.
- `sendTextMessage`: Sends a WhatsApp text message.
- `sendImageMessage`: Sends an image by media ID or public URL.
- `sendDocumentMessage`: Sends a document by media ID or public URL.
- `markMessageAsRead`: Sends a read receipt for a WhatsApp message.
- `sendTypingIndicator`: Sends a typing indicator tied to a received message.

## Why Signature Verification Matters

Without signature verification, anyone who knows the webhook URL could post fake WhatsApp events into the system. The signature proves the request body came from Meta and was not changed in transit.

## Architectural Decisions

- Webhook routes live under `/api/v1/webhooks/whatsapp` to keep third-party callbacks separate from dashboard APIs.
- Meta-specific HTTP calls are isolated in `whatsapp.service.ts`.
- Parsed webhook data uses internal types so future phases do not depend on raw Meta payload structure.
- The raw request body is captured in Express JSON parsing so HMAC verification uses the exact bytes Meta signed.
- Status handling is logged now and can later update conversation/message records in MongoDB during Phase 4.

## Alternatives Considered

- Calling OpenAI directly from the webhook controller: deferred to Phase 3 so transport code and AI logic stay separate.
- Storing webhook payloads immediately: deferred to Phase 4, where conversation memory and message models are introduced properly.
- Skipping signature verification in development: rejected because it creates insecure habits and misses a critical production behavior.

## Suggested Commit For Phase 2

```bash
git add .
git commit -m "feat: add WhatsApp Cloud API webhook integration"
```
