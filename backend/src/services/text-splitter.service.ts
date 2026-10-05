import { env } from '../config/env.js';
import type { DocumentChunk } from '../types/rag.types.js';

interface SplitDocumentInput {
  documentId: string;
  text: string;
  filename: string;
  mimeType: string;
}

class TextSplitterService {
  split(input: SplitDocumentInput): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const normalized = input.text.trim();
    let start = 0;
    let index = 0;

    while (start < normalized.length) {
      const end = this.findChunkEnd(normalized, start);
      const text = normalized.slice(start, end).trim();

      if (text) {
        chunks.push({
          id: `${input.documentId}:${index}`,
          documentId: input.documentId,
          text,
          index,
          metadata: {
            documentId: input.documentId,
            chunkIndex: index,
            filename: input.filename,
            mimeType: input.mimeType,
          },
        });
        index += 1;
      }

      if (end >= normalized.length) {
        break;
      }

      start = Math.max(end - env.RAG_CHUNK_OVERLAP, start + 1);
    }

    return chunks;
  }

  private findChunkEnd(text: string, start: number): number {
    const targetEnd = Math.min(start + env.RAG_CHUNK_SIZE, text.length);

    if (targetEnd === text.length) {
      return targetEnd;
    }

    const paragraphBreak = text.lastIndexOf('\n\n', targetEnd);
    if (paragraphBreak > start + env.RAG_CHUNK_SIZE * 0.5) {
      return paragraphBreak;
    }

    const sentenceBreak = text.lastIndexOf('. ', targetEnd);
    if (sentenceBreak > start + env.RAG_CHUNK_SIZE * 0.5) {
      return sentenceBreak + 1;
    }

    const wordBreak = text.lastIndexOf(' ', targetEnd);
    if (wordBreak > start + env.RAG_CHUNK_SIZE * 0.5) {
      return wordBreak;
    }

    return targetEnd;
  }
}

export const textSplitterService = new TextSplitterService();
