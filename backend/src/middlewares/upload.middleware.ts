import path from 'node:path';
import multer from 'multer';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';
import { documentParserService } from '../services/document-parser.service.js';

const uploadDirectory = path.resolve('backend/uploads');

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (_req, file, callback) => {
    const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    callback(null, `${Date.now()}-${safeOriginalName}`);
  },
});

export const knowledgeUpload = multer({
  storage,
  limits: {
    fileSize: env.UPLOAD_MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!documentParserService.isSupported(file.mimetype)) {
      callback(new AppError(`Unsupported file type: ${file.mimetype}`, 400));
      return;
    }

    callback(null, true);
  },
});
