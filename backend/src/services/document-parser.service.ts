import fs from 'node:fs/promises';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import { AppError } from '../utils/app-error.js';
import type { ParsedDocument } from '../types/rag.types.js';

const supportedMimeTypes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
]);

class DocumentParserService {
  isSupported(mimeType: string): boolean {
    return supportedMimeTypes.has(mimeType);
  }

  async parseFile(file: Express.Multer.File): Promise<ParsedDocument> {
    if (!this.isSupported(file.mimetype)) {
      throw new AppError(`Unsupported file type: ${file.mimetype}`, 400);
    }

    const buffer = await fs.readFile(file.path);
    const text = await this.extractText(buffer, file.mimetype);
    const normalizedText = this.normalizeText(text);

    if (!normalizedText) {
      throw new AppError('The uploaded document did not contain extractable text', 400);
    }

    return {
      text: normalizedText,
      metadata: {
        filename: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      },
    };
  }

  private async extractText(buffer: Buffer, mimeType: string): Promise<string> {
    if (mimeType === 'application/pdf') {
      const parsed = await pdfParse(buffer);
      return parsed.text;
    }

    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const parsed = await mammoth.extractRawText({ buffer });
      return parsed.value;
    }

    return buffer.toString('utf8');
  }

  private normalizeText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
  }
}

export const documentParserService = new DocumentParserService();
