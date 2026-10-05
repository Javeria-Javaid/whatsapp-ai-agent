import { z } from 'zod';
import type { RequestHandler } from 'express';
import { knowledgeBaseService } from '../services/knowledge-base.service.js';
import { AppError } from '../utils/app-error.js';

const searchSchema = z.object({
  query: z.string().trim().min(1),
  topK: z.coerce.number().int().positive().max(20).optional(),
});

export const uploadKnowledgeDocument: RequestHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('A document file is required', 400);
    }

    const result = await knowledgeBaseService.ingestUploadedFile(req.file);

    res.status(201).json({
      success: true,
      document: result,
    });
  } catch (error) {
    next(error);
  }
};

export const searchKnowledge: RequestHandler = async (req, res, next) => {
  try {
    const input = searchSchema.parse(req.body);
    const results = await knowledgeBaseService.search(input.query, input.topK);

    res.status(200).json({
      success: true,
      results,
    });
  } catch (error) {
    next(error);
  }
};

export const listKnowledgeDocuments: RequestHandler = async (_req, res, next) => {
  try {
    const documents = await knowledgeBaseService.listDocuments();

    res.status(200).json({
      success: true,
      documents,
    });
  } catch (error) {
    next(error);
  }
};
