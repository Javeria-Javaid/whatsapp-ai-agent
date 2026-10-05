import { Router } from 'express';
import {
  listKnowledgeDocuments,
  searchKnowledge,
  uploadKnowledgeDocument,
} from '../controllers/knowledge.controller.js';
import { knowledgeUpload } from '../middlewares/upload.middleware.js';

export const knowledgeRouter = Router();

knowledgeRouter.get('/documents', listKnowledgeDocuments);
knowledgeRouter.post('/documents', knowledgeUpload.single('file'), uploadKnowledgeDocument);
knowledgeRouter.post('/search', searchKnowledge);
