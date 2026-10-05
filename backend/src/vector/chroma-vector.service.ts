import { ChromaClient, type Collection, type Metadata } from 'chromadb';
import { env } from '../config/env.js';
import type { DocumentChunk, KnowledgeSearchResult } from '../types/rag.types.js';

class ChromaVectorService {
  private readonly client: ChromaClient;
  private collection?: Collection;

  constructor() {
    const chromaUrl = new URL(env.CHROMA_URL);

    this.client = new ChromaClient({
      host: chromaUrl.hostname,
      port: Number(chromaUrl.port || (chromaUrl.protocol === 'https:' ? 443 : 80)),
      ssl: chromaUrl.protocol === 'https:',
    });
  }

  async addChunks(chunks: DocumentChunk[], embeddings: number[][]): Promise<void> {
    if (chunks.length === 0) {
      return;
    }

    const collection = await this.getCollection();

    await collection.upsert({
      ids: chunks.map((chunk) => chunk.id),
      documents: chunks.map((chunk) => chunk.text),
      embeddings,
      metadatas: chunks.map((chunk) => chunk.metadata as Metadata),
    });
  }

  async search(embedding: number[], topK: number): Promise<KnowledgeSearchResult[]> {
    const collection = await this.getCollection();
    const result = await collection.query({
      queryEmbeddings: [embedding],
      nResults: topK,
      include: ['documents', 'metadatas', 'distances'],
    });

    const ids = result.ids[0] ?? [];
    const documents = result.documents?.[0] ?? [];
    const metadatas = result.metadatas?.[0] ?? [];
    const distances = result.distances?.[0] ?? [];

    return ids.map((id, index) => ({
      chunkId: id,
      documentId: String(metadatas[index]?.documentId ?? ''),
      text: documents[index] ?? '',
      score: typeof distances[index] === 'number' ? distances[index] : undefined,
      metadata: metadatas[index] ?? {},
    }));
  }

  private async getCollection(): Promise<Collection> {
    if (!this.collection) {
      this.collection = await this.client.getOrCreateCollection({
        name: env.CHROMA_COLLECTION_NAME,
        embeddingFunction: null,
        metadata: {
          description: 'Knowledge base chunks for WhatsApp AI Agent',
        },
      });
    }

    return this.collection;
  }
}

export const chromaVectorService = new ChromaVectorService();
