export type SupportedKnowledgeMimeType =
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'text/plain'
  | 'text/markdown';

export interface ParsedDocument {
  text: string;
  metadata: {
    filename: string;
    mimeType: string;
    sizeBytes: number;
  };
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  text: string;
  index: number;
  metadata: Record<string, string | number | boolean>;
}

export interface KnowledgeSearchResult {
  documentId: string;
  chunkId: string;
  text: string;
  score?: number;
  metadata: Record<string, unknown>;
}
