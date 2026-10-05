import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { knowledgeDocumentRepository } from '../repositories/knowledge-document.repository.js';
import { chromaVectorService } from '../vector/chroma-vector.service.js';
import { documentParserService } from './document-parser.service.js';
import { openAiService } from './openai.service.js';
import { textSplitterService } from './text-splitter.service.js';
import type { KnowledgeSearchResult } from '../types/rag.types.js';

class KnowledgeBaseService {
  async ingestUploadedFile(file: Express.Multer.File): Promise<{
    documentId: string;
    chunkCount: number;
  }> {
    const document = await knowledgeDocumentRepository.create({
      originalName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    });

    try {
      const parsed = await documentParserService.parseFile(file);
      const chunks = textSplitterService.split({
        documentId: document._id.toString(),
        text: parsed.text,
        filename: parsed.metadata.filename,
        mimeType: parsed.metadata.mimeType,
      });

      const embeddings = await openAiService.createEmbeddings(chunks.map((chunk) => chunk.text));

      await chromaVectorService.addChunks(chunks, embeddings);
      await knowledgeDocumentRepository.markReady(document._id.toString(), chunks.length);

      logger.info('Knowledge document indexed', {
        documentId: document._id.toString(),
        chunkCount: chunks.length,
      });

      return {
        documentId: document._id.toString(),
        chunkCount: chunks.length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown indexing error';
      await knowledgeDocumentRepository.markFailed(document._id.toString(), message);
      throw error;
    }
  }

  async search(query: string, topK = env.RAG_TOP_K): Promise<KnowledgeSearchResult[]> {
    const embedding = await openAiService.createEmbedding(query);
    const results = await chromaVectorService.search(embedding, topK);

    return results.filter((result) => result.text.trim().length > 0);
  }

  async buildPromptContext(query: string): Promise<string | undefined> {
    const results = await this.search(query, env.RAG_TOP_K);
    let context = '';

    for (const [index, result] of results.entries()) {
      const source = result.metadata.filename ? `Source: ${String(result.metadata.filename)}` : 'Source: knowledge base';
      const block = `[${index + 1}] ${source}\n${result.text.trim()}\n\n`;

      if (context.length + block.length > env.RAG_MAX_CONTEXT_CHARACTERS) {
        break;
      }

      context += block;
    }

    return context.trim() || undefined;
  }

  async listDocuments() {
    return knowledgeDocumentRepository.listReady();
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
