import { Schema, model, type HydratedDocument, type InferSchemaType, type Types } from 'mongoose';

export type MessageRole = 'user' | 'assistant' | 'system';

const messageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    sourceMessageId: {
      type: String,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

messageSchema.index({ conversationId: 1, timestamp: -1 });
messageSchema.index({ phoneNumber: 1, sessionId: 1, timestamp: 1 });
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

export type Message = InferSchemaType<typeof messageSchema> & {
  conversationId: Types.ObjectId;
  userId: Types.ObjectId;
};
export type MessageDocument = HydratedDocument<Message>;

export const MessageModel = model<Message>('Message', messageSchema);
