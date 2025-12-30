/**
 * @fileoverview Connection testing routes.
 * @module @db-migrate/api/routes/connect
 */

import express from 'express';
import { createConnector } from '../connectors/index.js';

export const connectRouter = express.Router();

/**
 * POST /api/connect/test
 * Test a database connection.
 */
connectRouter.post('/test', async (req, res, next) => {
  try {
    const { config } = req.body;

    if (!config || !config.type) {
      return res.status(400).json({ error: 'Missing connection configuration' });
    }

    const connector = createConnector(config);
    const result = await connector.testConnection();

    // Always close the connection
    await connector.close().catch(() => {});

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error?.message,
      });
    }
  } catch (error) {
    next(error);
  }
});
