/**
 * @fileoverview Schema inspection routes.
 * @module @db-migrate/api/routes/schema
 */

import express from 'express';
import { createConnector } from '../connectors/index.js';

export const schemaRouter = express.Router();

/**
 * POST /api/schema/inspect
 * Inspect schema for a collection/table.
 */
schemaRouter.post('/inspect', async (req, res, next) => {
  try {
    const { config, name } = req.body;

    if (!config || !config.type) {
      return res.status(400).json({ error: 'Missing connection configuration' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Missing collection/table name' });
    }

    const connector = createConnector(config);
    const schema = await connector.getSchema(name);

    await connector.close().catch(() => {});

    res.json({
      success: true,
      name,
      schema,
    });
  } catch (error) {
    next(error);
  }
});
