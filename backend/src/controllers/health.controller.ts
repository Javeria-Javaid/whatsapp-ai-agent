import type { RequestHandler } from 'express';
import { env } from '../config/env.js';
import { getMongoStatus } from '../config/database.js';
import { getRedisStatus } from '../config/redis.js';

export const getHealth: RequestHandler = (_req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: env.NODE_ENV,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      mongodb: getMongoStatus(),
      redis: getRedisStatus(),
    },
  });
};
