/**
 * @fileoverview Connector interface that all database connectors must implement.
 * @module @db-migrate/shared/connector-interface
 */

/**
 * Base connector interface for database connectors.
 * All connectors must implement this interface.
 *
 * @interface Connector
 */
export class Connector {
  /**
   * Test the database connection.
   * @returns {Promise<{success: boolean, message?: string, error?: Error}>}
   */
  async testConnection() {
    throw new Error('testConnection() must be implemented');
  }

  /**
   * Discover available collections/tables in the database.
   * @returns {Promise<Array<{name: string, type: string, schema?: object}>>}
   */
  async discover() {
    throw new Error('discover() must be implemented');
  }

  /**
   * Get schema information for a collection/table.
   * @param {string} name - Collection or table name
   * @returns {Promise<object>} Schema information
   */
  async getSchema(name) {
    throw new Error('getSchema() must be implemented');
  }

  /**
   * Read data in batches.
   * @param {string} name - Collection or table name
   * @param {object} options - Read options (limit, offset, filters, etc.)
   * @returns {AsyncGenerator<Array<object>, void, unknown>} Generator yielding batches of records
   */
  async *readBatch(name, options = {}) {
    throw new Error('readBatch() must be implemented');
  }

  /**
   * Write a batch of records.
   * @param {string} name - Collection or table name
   * @param {Array<object>} records - Records to write
   * @param {object} options - Write options (upsert, conflict resolution, etc.)
   * @returns {Promise<{success: boolean, count: number, errors?: Array<Error>}>}
   */
  async writeBatch(name, records, options = {}) {
    throw new Error('writeBatch() must be implemented');
  }

  /**
   * Create a table (SQL databases only).
   * @param {string} name - Table name
   * @param {object} schema - Table schema definition
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  async createTable(name, schema) {
    throw new Error('createTable() is not supported by this connector');
  }

  /**
   * Close the connection and cleanup resources.
   * @returns {Promise<void>}
   */
  async close() {
    throw new Error('close() must be implemented');
  }
}

/**
 * Database types supported by connectors.
 * @readonly
 * @enum {string}
 */
export const DatabaseType = {
  FIREBASE_FIRESTORE: 'firebase-firestore',
  FIREBASE_REALTIME: 'firebase-realtime',
  POSTGRESQL: 'postgresql',
  MYSQL: 'mysql',
  MONGODB: 'mongodb',
  ORACLE: 'oracle',
};

/**
 * Field type mappings for schema conversion.
 * @readonly
 * @enum {string}
 */
export const FieldType = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  DATE: 'date',
  TIMESTAMP: 'timestamp',
  JSON: 'json',
  ARRAY: 'array',
  OBJECT: 'object',
  BINARY: 'binary',
  INTEGER: 'integer',
  FLOAT: 'float',
  TEXT: 'text',
  UUID: 'uuid',
};
