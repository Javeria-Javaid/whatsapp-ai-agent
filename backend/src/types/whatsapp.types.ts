export type WhatsAppMessageType =
  | 'text'
  | 'image'
  | 'document'
  | 'audio'
  | 'video'
  | 'button'
  | 'interactive'
  | 'location'
  | 'contacts'
  | 'sticker'
  | 'unknown';

export interface WhatsAppContact {
  profile?: {
    name?: string;
  };
  wa_id: string;
}

export interface WhatsAppIncomingMessage {
  from: string;
  id: string;
  timestamp: string;
  type: WhatsAppMessageType;
  text?: {
    body: string;
  };
  image?: {
    id: string;
    mime_type?: string;
    sha256?: string;
    caption?: string;
  };
  document?: {
    id: string;
    filename?: string;
    mime_type?: string;
    sha256?: string;
    caption?: string;
  };
  audio?: {
    id: string;
    mime_type?: string;
    sha256?: string;
    voice?: boolean;
  };
}

export interface WhatsAppStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'deleted' | string;
  timestamp: string;
  recipient_id: string;
  conversation?: {
    id: string;
    origin?: {
      type?: string;
    };
    expiration_timestamp?: string;
  };
  pricing?: {
    billable?: boolean;
    pricing_model?: string;
    category?: string;
  };
  errors?: Array<{
    code: number;
    title: string;
    message?: string;
    error_data?: {
      details?: string;
    };
  }>;
}

export interface WhatsAppWebhookValue {
  messaging_product: 'whatsapp';
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: WhatsAppContact[];
  messages?: WhatsAppIncomingMessage[];
  statuses?: WhatsAppStatus[];
}

export interface WhatsAppWebhookChange {
  field: 'messages' | string;
  value: WhatsAppWebhookValue;
}

export interface WhatsAppWebhookEntry {
  id: string;
  changes: WhatsAppWebhookChange[];
}

export interface WhatsAppWebhookPayload {
  object: 'whatsapp_business_account' | string;
  entry?: WhatsAppWebhookEntry[];
}

export interface ParsedWhatsAppMessage {
  messageId: string;
  from: string;
  timestamp: Date;
  type: WhatsAppMessageType;
  text?: string;
  contactName?: string;
}

export interface ParsedWhatsAppStatus {
  messageId: string;
  recipientId: string;
  status: string;
  timestamp: Date;
  error?: string;
}

export interface ParsedWhatsAppWebhook {
  messages: ParsedWhatsAppMessage[];
  statuses: ParsedWhatsAppStatus[];
}
