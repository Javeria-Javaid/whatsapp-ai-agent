import { Schema, model, type HydratedDocument, type InferSchemaType, type Types } from 'mongoose';

export type ConversationStatus = 'active' | 'closed';

const conversationSchema = new Schema(
  {
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
    status: {
      type: String,
      enum: ['active', 'closed'],
      default: 'active',
      index: true,
    },
    summary: {
      type: String,
      default: '',
    },
    messageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    summarizedMessageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActivityAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

conversationSchema.index({ phoneNumber: 1, status: 1, lastActivityAt: -1 });
conversationSchema.index({ sessionId: 1, phoneNumber: 1 });

export type Conversation = InferSchemaType<typeof conversationSchema> & {
  userId: Types.ObjectId;
};
export type ConversationDocument = HydratedDocument<Conversation>;

export const ConversationModel = model<Conversation>('Conversation', conversationSchema);
