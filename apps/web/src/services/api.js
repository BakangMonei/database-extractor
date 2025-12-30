import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Test database connection
 */
export const testConnection = async (config) => {
  const response = await api.post('/api/connect/test', { config });
  return response.data;
};

/**
 * Discover collections/tables
 */
export const discoverCollections = async (config) => {
  const response = await api.post('/api/discover', { config });
  return response.data;
};

/**
 * Inspect schema for a collection/table
 */
export const inspectSchema = async (config, name) => {
  const response = await api.post('/api/schema/inspect', { config, name });
  return response.data;
};

/**
 * Start migration
 */
export const startMigration = async (migrationConfig) => {
  const response = await api.post('/api/migrate/start', { config: migrationConfig });
  return response.data;
};

/**
 * Get migration status
 */
export const getMigrationStatus = async (jobId) => {
  const response = await api.get(`/api/migrate/status/${jobId}`);
  return response.data;
};

/**
 * Get migration logs
 */
export const getMigrationLogs = async (jobId) => {
  const response = await api.get(`/api/migrate/logs/${jobId}`);
  return response.data;
};

/**
 * Get migration errors
 */
export const getMigrationErrors = async (jobId) => {
  const response = await api.get(`/api/migrate/errors/${jobId}`);
  return response.data;
};
