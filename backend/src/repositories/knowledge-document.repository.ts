import {
  KnowledgeDocumentModel,
  type KnowledgeDocumentDocument,
  type KnowledgeDocumentStatus,
} from '../models/knowledge-document.model.js';

interface CreateKnowledgeDocumentInput {
  originalName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
}

class KnowledgeDocumentRepository {
  async create(input: CreateKnowledgeDocumentInput): Promise<KnowledgeDocumentDocument> {
    return KnowledgeDocumentModel.create({
      ...input,
      status: 'processing',
    });
  }

  async markReady(documentId: string, chunkCount: number): Promise<void> {
    await this.updateStatus(documentId, 'ready', chunkCount);
  }

  async markFailed(documentId: string, errorMessage: string): Promise<void> {
    await KnowledgeDocumentModel.updateOne(
      { _id: documentId },
      {
        $set: {
          status: 'failed',
          errorMessage,
        },
      },
    );
  }

  async listReady(): Promise<KnowledgeDocumentDocument[]> {
    return KnowledgeDocumentModel.find({ status: 'ready' }).sort({ createdAt: -1 });
  }

  private async updateStatus(
    documentId: string,
    status: KnowledgeDocumentStatus,
    chunkCount: number,
  ): Promise<void> {
    await KnowledgeDocumentModel.updateOne(
      { _id: documentId },
      {
        $set: {
          status,
          chunkCount,
        },
      },
    );
  }
}

export const knowledgeDocumentRepository = new KnowledgeDocumentRepository();
