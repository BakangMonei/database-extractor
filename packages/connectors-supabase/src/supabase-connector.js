/**
 * @fileoverview Supabase connector implementation.
 * Supabase uses PostgreSQL, so we extend the PostgreSQL connector.
 * @module @db-migrate/connectors-supabase
 */

import { PostgreSQLConnector } from '@db-migrate/connectors-postgres';

/**
 * Supabase connector.
 * Supabase uses PostgreSQL under the hood, so we extend PostgreSQLConnector.
 * @extends PostgreSQLConnector
 */
export class SupabaseConnector extends PostgreSQLConnector {
  /**
   * @param {object} config - Supabase configuration
   */
  constructor(config) {
    // Supabase connection uses PostgreSQL connection string format
    // Transform Supabase config to PostgreSQL config if needed
    const pgConfig = {
      type: 'postgresql',
      host: config.host || config.connectionString?.match(/@([^:]+):/)?.[1] || 'db.supabase.co',
      port: config.port || parseInt(config.connectionString?.match(/:(\d+)\//)?.[1]) || 5432,
      database: config.database || config.connectionString?.match(/\/?([^?]+)/)?.[1] || config.db,
      user: config.user || config.connectionString?.match(/\/\/([^:]+):/)?.[1],
      password: config.password || config.connectionString?.match(/:([^@]+)@/)?.[1],
      ssl: config.ssl !== undefined ? config.ssl : true, // Supabase requires SSL
      schema: config.schema || 'public',
    };

    // If connectionString is provided, parse it
    if (config.connectionString && !config.host) {
      // Parse postgres://user:pass@host:port/db?params
      const url = new URL(config.connectionString.replace('postgres://', 'https://'));
      pgConfig.user = decodeURIComponent(url.username);
      pgConfig.password = decodeURIComponent(url.password);
      pgConfig.host = url.hostname;
      pgConfig.port = parseInt(url.port) || 5432;
      pgConfig.database = url.pathname.slice(1).split('?')[0];
    }

    super(pgConfig);
    this.supabaseConfig = config;
  }

  /**
   * Test the Supabase connection.
   * @returns {Promise<{success: boolean, message?: string, error?: Error}>}
   */
  async testConnection() {
    const result = await super.testConnection();
    if (result.success) {
      result.message = `Successfully connected to Supabase: ${result.message}`;
    }
    return result;
  }

  // Inherits getPrimaryKeys, getForeignKeys, and getSchema from PostgreSQLConnector
  // which already includes primary keys and foreign keys in schema information
}
