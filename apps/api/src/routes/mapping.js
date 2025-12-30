/**
 * @fileoverview Mapping validation routes.
 * @module @db-migrate/api/routes/mapping
 */

import express from 'express';
import { SchemaMappingSchema } from '@db-migrate/shared';

export const mappingRouter = express.Router();

/**
 * POST /api/mapping/validate
 * Validate a schema mapping configuration.
 */
mappingRouter.post('/validate', (req, res, next) => {
  try {
    const { mapping } = req.body;

    if (!mapping) {
      return res.status(400).json({ error: 'Missing mapping configuration' });
    }

    // Validate using Zod schema
    const result = SchemaMappingSchema.safeParse(mapping);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        errors: result.error.errors,
      });
    }

    res.json({
      success: true,
      message: 'Mapping is valid',
    });
  } catch (error) {
    next(error);
  }
});
