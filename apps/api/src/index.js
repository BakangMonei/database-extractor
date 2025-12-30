/**
 * @fileoverview Express API server for database migrations.
 * @module @db-migrate/api
 */

import express from 'express';
import cors from 'cors';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { migrateRouter } from './routes/migrate.js';
import { connectRouter } from './routes/connect.js';
import { discoverRouter } from './routes/discover.js';
import { schemaRouter } from './routes/schema.js';
import { mappingRouter } from './routes/mapping.js';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  } : undefined,
});

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(pinoHttp({ logger }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/connect', connectRouter);
app.use('/api/discover', discoverRouter);
app.use('/api/schema', schemaRouter);
app.use('/api/mapping', mappingRouter);
app.use('/api/migrate', migrateRouter);

// Error handler
app.use((err, req, res, next) => {
  logger.error({ err }, 'Request error');
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  logger.info(`API server listening on port ${PORT}`);
});

export default app;
