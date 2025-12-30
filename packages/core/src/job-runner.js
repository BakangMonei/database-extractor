/**
 * @fileoverview In-memory job runner for managing migration jobs.
 * @module @db-migrate/core/job-runner
 */

/**
 * In-memory job runner for migration jobs.
 */
export class JobRunner {
  constructor() {
    /** @type {Map<string, object>} */
    this.jobs = new Map();
  }

  /**
   * Create a new job.
   * @param {string} jobId - Unique job ID
   * @param {object} jobData - Job data
   * @returns {object} Created job
   */
  createJob(jobId, jobData) {
    const job = {
      id: jobId,
      status: 'pending',
      progress: 0,
      logs: [],
      errors: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...jobData,
    };
    this.jobs.set(jobId, job);
    return job;
  }

  /**
   * Get a job by ID.
   * @param {string} jobId - Job ID
   * @returns {object|undefined} Job data
   */
  getJob(jobId) {
    return this.jobs.get(jobId);
  }

  /**
   * Update job status.
   * @param {string} jobId - Job ID
   * @param {object} updates - Status updates
   */
  updateJob(jobId, updates) {
    const job = this.jobs.get(jobId);
    if (job) {
      Object.assign(job, updates, { updatedAt: new Date() });
      this.jobs.set(jobId, job);
    }
  }

  /**
   * Add log entry to job.
   * @param {string} jobId - Job ID
   * @param {string} level - Log level (info, warn, error)
   * @param {string} message - Log message
   * @param {object} meta - Additional metadata
   */
  addLog(jobId, level, message, meta = {}) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.logs.push({
        timestamp: new Date(),
        level,
        message,
        ...meta,
      });
      job.updatedAt = new Date();
    }
  }

  /**
   * Add error to job.
   * @param {string} jobId - Job ID
   * @param {Error} error - Error object
   */
  addError(jobId, error) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.errors.push({
        timestamp: new Date(),
        message: error.message,
        stack: error.stack,
      });
      job.updatedAt = new Date();
    }
  }

  /**
   * Get all jobs.
   * @returns {Array<object>} List of all jobs
   */
  getAllJobs() {
    return Array.from(this.jobs.values());
  }

  /**
   * Delete a job.
   * @param {string} jobId - Job ID
   */
  deleteJob(jobId) {
    this.jobs.delete(jobId);
  }
}
