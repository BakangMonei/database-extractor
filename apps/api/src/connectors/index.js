/**
 * @fileoverview Connector factory for creating connector instances.
 * @module @db-migrate/api/connectors
 */

import { FirebaseFirestoreConnector } from '@db-migrate/connectors-firebase';
import { PostgreSQLConnector } from '@db-migrate/connectors-postgres';
import { MongoDBConnector } from '@db-migrate/connectors-mongo';

/**
 * Create a connector instance based on configuration.
 * @param {object} config - Connection configuration
 * @returns {Connector} Connector instance
 */
export function createConnector(config) {
  switch (config.type) {
    case 'firebase-firestore':
      return new FirebaseFirestoreConnector(config);
    case 'postgresql':
      return new PostgreSQLConnector(config);
    case 'mongodb':
      return new MongoDBConnector(config);
    default:
      throw new Error(`Unsupported database type: ${config.type}`);
  }
}
