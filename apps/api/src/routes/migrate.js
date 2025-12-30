/**
 * @fileoverview Migration routes.
 * @module @db-migrate/api/routes/migrate
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { MigrationEngine } from '@db-migrate/core';
import { JobRunner } from '@db-migrate/core';
import { createConnector } from '../connectors/index.js';

export const migrateRouter = express.Router();
const jobRunner = new JobRunner();

/**
 * POST /api/migrate/start
 * Start a new migration job.
 */
migrateRouter.post('/start', async (req, res, next) => {
  try {
    const { config } = req.body;

    if (!config || !config.source || !config.destination || !config.mappings) {
      return res.status(400).json({ error: 'Missing migration configuration' });
    }

    const jobId = uuidv4();

    // Create job
    jobRunner.createJob(jobId, {
      config,
      status: 'pending',
    });

    // Start migration asynchronously
    runMigration(jobId, config).catch((error) => {
      jobRunner.addError(jobId, error);
      jobRunner.updateJob(jobId, { status: 'failed' });
    });

    res.json({
      success: true,
      jobId,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/migrate/status/:jobId
 * Get migration job status.
 */
migrateRouter.get('/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobRunner.getJob(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json({
    success: true,
    job: {
      id: job.id,
      status: job.status,
      progress: job.progress,
      processedRecords: job.processedRecords,
      totalRecords: job.totalRecords,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    },
  });
});

/**
 * GET /api/migrate/logs/:jobId
 * Get migration job logs.
 */
migrateRouter.get('/logs/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobRunner.getJob(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json({
    success: true,
    logs: job.logs || [],
  });
});

/**
 * GET /api/migrate/errors/:jobId
 * Get migration job errors.
 */
migrateRouter.get('/errors/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobRunner.getJob(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json({
    success: true,
    errors: job.errors || [],
  });
});

/**
 * Run migration asynchronously.
 * @param {string} jobId - Job ID
 * @param {object} config - Migration configuration
 */
async function runMigration(jobId, config) {
  const sourceConnector = createConnector(config.source);
  const destinationConnector = createConnector(config.destination);

  try {
    jobRunner.updateJob(jobId, { status: 'running' });

    const engine = new MigrationEngine(sourceConnector, destinationConnector, config);

    // Run migration and update job status
    for await (const status of engine.run()) {
      jobRunner.updateJob(jobId, {
        status: status.state,
        progress: status.progress,
        processedRecords: status.processedRecords,
        totalRecords: status.totalRecords,
      });

      // Add logs
      for (const log of status.logs || []) {
        jobRunner.addLog(jobId, log.level, log.message, log);
      }

      // Add errors
      for (const error of status.errors || []) {
        jobRunner.addError(jobId, error instanceof Error ? error : new Error(String(error)));
      }
    }

    jobRunner.updateJob(jobId, { status: 'completed' });
  } catch (error) {
    jobRunner.addError(jobId, error);
    jobRunner.updateJob(jobId, { status: 'failed' });
  } finally {
    await sourceConnector.close().catch(() => {});
    await destinationConnector.close().catch(() => {});
  }
}
