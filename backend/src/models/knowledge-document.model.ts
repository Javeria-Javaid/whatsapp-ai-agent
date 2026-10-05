import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

export type KnowledgeDocumentStatus = 'processing' | 'ready' | 'failed';

const knowledgeDocumentSchema = new Schema(
  {
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    storedName: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      index: true,
    },
    sizeBytes: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['processing', 'ready', 'failed'],
      default: 'processing',
      index: true,
    },
    chunkCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

export type KnowledgeDocument = InferSchemaType<typeof knowledgeDocumentSchema>;
export type KnowledgeDocumentDocument = HydratedDocument<KnowledgeDocument>;

export const KnowledgeDocumentModel = model<KnowledgeDocument>(
  'KnowledgeDocument',
  knowledgeDocumentSchema,
);
