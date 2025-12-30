/**
 * @fileoverview Data preview routes.
 * @module @db-migrate/api/routes/preview
 */

import express from 'express';
import { createConnector } from '../connectors/index.js';

export const previewRouter = express.Router();

/**
 * POST /api/preview
 * Preview data from a collection/table.
 */
previewRouter.post('/', async (req, res, next) => {
  try {
    const { config, name, limit = 10 } = req.body;

    if (!config || !config.type) {
      return res.status(400).json({ error: 'Missing connection configuration' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Missing collection/table name' });
    }

    const connector = createConnector(config);
    const previewData = [];
    let count = 0;

    // Read a limited number of records
    for await (const batch of connector.readBatch(name, { batchSize: limit, limit })) {
      previewData.push(...batch);
      count += batch.length;
      if (count >= limit) break;
    }

    await connector.close().catch(() => {});

    res.json({
      success: true,
      name,
      data: previewData.slice(0, limit),
      count: previewData.length,
    });
  } catch (error) {
    next(error);
  }
});
