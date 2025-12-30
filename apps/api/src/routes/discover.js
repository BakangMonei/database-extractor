/**
 * @fileoverview Database discovery routes.
 * @module @db-migrate/api/routes/discover
 */

import express from 'express';
import { createConnector } from '../connectors/index.js';

export const discoverRouter = express.Router();

/**
 * POST /api/discover
 * Discover collections/tables in a database.
 */
discoverRouter.post('/', async (req, res, next) => {
  try {
    const { config } = req.body;

    if (!config || !config.type) {
      return res.status(400).json({ error: 'Missing connection configuration' });
    }

    const connector = createConnector(config);
    const collections = await connector.discover();

    await connector.close().catch(() => {});

    res.json({
      success: true,
      collections,
    });
  } catch (error) {
    next(error);
  }
});
