import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError } from '../utils/app-error.js';

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: unknown;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    details = error.details;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    details = error.flatten();
  }

  const logContext = {
    statusCode,
    details,
    stack: error instanceof Error ? error.stack : undefined,
  };

  if (statusCode >= 500) {
    logger.error(message, logContext);
  } else {
    logger.warn(message, logContext);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      details,
      ...(env.NODE_ENV !== 'production' && {
        stack: error instanceof Error ? error.stack : undefined,
      }),
    },
  });
};
