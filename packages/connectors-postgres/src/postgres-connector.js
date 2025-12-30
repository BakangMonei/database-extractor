/**
 * @fileoverview PostgreSQL connector implementation.
 * @module @db-migrate/connectors-postgres
 */

import pkg from 'pg';
const { Pool } = pkg;
import { Connector } from '@db-migrate/shared';

/**
 * PostgreSQL connector.
 * @extends Connector
 */
export class PostgreSQLConnector extends Connector {
  /**
   * @param {object} config - PostgreSQL configuration
   */
  constructor(config) {
    super();
    this.config = config;
    this.pool = null;
  }

  /**
   * Initialize PostgreSQL connection pool.
   */
  async initialize() {
    if (this.pool) {
      return; // Already initialized
    }

    try {
      this.pool = new Pool({
        host: this.config.host,
        port: this.config.port || 5432,
        database: this.config.database,
        user: this.config.user,
        password: this.config.password,
        ssl: this.config.ssl || false,
        max: 10, // Maximum pool size
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
    } catch (error) {
      throw new Error(`Failed to initialize PostgreSQL pool: ${error.message}`);
    }
  }

  /**
   * Test the PostgreSQL connection.
   * @returns {Promise<{success: boolean, message?: string, error?: Error}>}
   */
  async testConnection() {
    try {
      await this.initialize();
      const result = await this.pool.query('SELECT NOW() as current_time, version() as version');
      const version = result.rows[0].version;
      return {
        success: true,
        message: `Successfully connected to PostgreSQL: ${version}`,
      };
    } catch (error) {
      return {
        success: false,
        error,
        message: `Connection failed: ${error.message}`,
      };
    }
  }

  /**
   * Discover available tables in the database.
   * @returns {Promise<Array<{name: string, type: string, schema?: object}>>}
   */
  async discover() {
    await this.initialize();

    try {
      const schema = this.config.schema || 'public';
      const query = `
        SELECT 
          table_name,
          (SELECT COUNT(*) FROM information_schema.columns 
           WHERE table_schema = $1 AND table_name = t.table_name) as column_count
        FROM information_schema.tables t
        WHERE table_schema = $1
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `;

      const result = await this.pool.query(query, [schema]);
      const tables = [];

      for (const row of result.rows) {
        const tableName = row.table_name;
        const schemaInfo = await this.getSchema(tableName);
        tables.push({
          name: tableName,
          type: 'table',
          schema: schemaInfo,
          columnCount: parseInt(row.column_count),
        });
      }

      return tables;
    } catch (error) {
      throw new Error(`Failed to discover tables: ${error.message}`);
    }
  }

  /**
   * Get primary keys for a table.
   * @param {string} tableName - Table name
   * @returns {Promise<Array<string>>} Array of primary key column names
   */
  async getPrimaryKeys(tableName) {
    await this.initialize();
    const schema = this.config.schema || 'public';

    try {
      const query = `
        SELECT a.attname
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = $1::regclass
        AND i.indisprimary;
      `;

      const fullTableName = `"${schema}"."${tableName}"`;
      const result = await this.pool.query(query, [fullTableName]);
      return result.rows.map(row => row.attname);
    } catch (error) {
      return [];
    }
  }

  /**
   * Get foreign key relationships for a table.
   * @param {string} tableName - Table name
   * @returns {Promise<Array<object>>} Array of foreign key relationships
   */
  async getForeignKeys(tableName) {
    await this.initialize();
    const schema = this.config.schema || 'public';

    try {
      const query = `
        SELECT
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = $1
        AND tc.table_schema = $2;
      `;

      const result = await this.pool.query(query, [tableName, schema]);
      return result.rows.map(row => ({
        constraintName: row.constraint_name,
        columnName: row.column_name,
        foreignTableName: row.foreign_table_name,
        foreignColumnName: row.foreign_column_name,
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Get schema information for a table.
   * @param {string} name - Table name
   * @returns {Promise<object>} Schema information
   */
  async getSchema(name) {
    await this.initialize();

    try {
      const schema = this.config.schema || 'public';
      const query = `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = $1
        AND table_name = $2
        ORDER BY ordinal_position;
      `;

      const result = await this.pool.query(query, [schema, name]);
      const columns = {};

      for (const row of result.rows) {
        columns[row.column_name] = {
          type: this.mapPostgresType(row.data_type),
          nullable: row.is_nullable === 'YES',
          default: row.column_default,
          maxLength: row.character_maximum_length,
        };
      }

      // Get primary keys and foreign keys
      const [primaryKeys, foreignKeys] = await Promise.all([
        this.getPrimaryKeys(name),
        this.getForeignKeys(name),
      ]);

      return {
        columns,
        primaryKeys,
        foreignKeys,
      };
    } catch (error) {
      throw new Error(`Failed to get schema for table ${name}: ${error.message}`);
    }
  }

  /**
   * Map PostgreSQL data type to standard type.
   * @param {string} pgType - PostgreSQL data type
   * @returns {string} Standard type name
   */
  mapPostgresType(pgType) {
    const typeMap = {
      'character varying': 'string',
      varchar: 'string',
      text: 'string',
      char: 'string',
      integer: 'integer',
      bigint: 'integer',
      smallint: 'integer',
      serial: 'integer',
      bigserial: 'integer',
      real: 'float',
      'double precision': 'float',
      numeric: 'number',
      decimal: 'number',
      boolean: 'boolean',
      date: 'date',
      timestamp: 'timestamp',
      'timestamp with time zone': 'timestamp',
      'timestamp without time zone': 'timestamp',
      time: 'time',
      json: 'json',
      jsonb: 'json',
      uuid: 'uuid',
      bytea: 'binary',
      array: 'array',
    };

    return typeMap[pgType.toLowerCase()] || 'string';
  }

  /**
   * Read data in batches.
   * @param {string} name - Table name
   * @param {object} options - Read options (batchSize, limit, offset, orderBy)
   * @yields {Array<object>} Batch of rows
   */
  async *readBatch(name, options = {}) {
    await this.initialize();

    const batchSize = options.batchSize || 100;
    const limit = options.limit || Infinity;
    const schema = this.config.schema || 'public';
    let offset = options.offset || 0;
    const orderBy = options.orderBy || '1'; // Default to first column

    try {
      while (offset < limit) {
        const currentLimit = Math.min(batchSize, limit - offset);
        const query = `SELECT * FROM "${schema}"."${name}" ORDER BY ${orderBy} LIMIT $1 OFFSET $2`;

        const result = await this.pool.query(query, [currentLimit, offset]);

        if (result.rows.length === 0) {
          break;
        }

        yield result.rows;
        offset += result.rows.length;

        if (result.rows.length < batchSize) {
          break; // Last batch
        }
      }
    } catch (error) {
      throw new Error(`Failed to read batch from table ${name}: ${error.message}`);
    }
  }

  /**
   * Write a batch of records.
   * @param {string} name - Table name
   * @param {Array<object>} records - Records to write
   * @param {object} options - Write options (upsert, conflictColumns)
   * @returns {Promise<{success: boolean, count: number, errors?: Array<Error>}>}
   */
  async writeBatch(name, records, options = {}) {
    await this.initialize();

    if (records.length === 0) {
      return { success: true, count: 0 };
    }

    const schema = this.config.schema || 'public';
    const errors = [];

    try {
      const client = await this.pool.connect();

      try {
        await client.query('BEGIN');

        for (const record of records) {
          try {
            const columns = Object.keys(record);
            const values = Object.values(record);
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
            const columnList = columns.map((col) => `"${col}"`).join(', ');

            if (options.upsert && options.conflictColumns) {
              // UPSERT using ON CONFLICT
              const conflictCols = options.conflictColumns.map((col) => `"${col}"`).join(', ');
              const updateCols = columns
                .filter((col) => !options.conflictColumns.includes(col))
                .map((col) => `"${col}" = EXCLUDED."${col}"`)
                .join(', ');

              const upsertQuery = `
                INSERT INTO "${schema}"."${name}" (${columnList})
                VALUES (${placeholders})
                ON CONFLICT (${conflictCols}) ${updateCols ? `DO UPDATE SET ${updateCols}` : 'DO NOTHING'}
              `;

              await client.query(upsertQuery, values);
            } else {
              // Regular INSERT
              const insertQuery = `
                INSERT INTO "${schema}"."${name}" (${columnList})
                VALUES (${placeholders})
              `;

              await client.query(insertQuery, values);
            }
          } catch (error) {
            errors.push(error);
          }
        }

        await client.query('COMMIT');

        return {
          success: errors.length === 0,
          count: records.length - errors.length,
          errors: errors.length > 0 ? errors : undefined,
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      return {
        success: false,
        count: 0,
        errors: [error],
      };
    }
  }

  /**
   * Create a table.
   * @param {string} name - Table name
   * @param {object} schema - Table schema definition
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  async createTable(name, schema) {
    await this.initialize();

    try {
      const schemaName = this.config.schema || 'public';
      const columns = schema.columns || {};
      const columnDefs = [];

      for (const [columnName, columnDef] of Object.entries(columns)) {
        const pgType = this.mapStandardTypeToPostgres(columnDef.type);
        const nullable = columnDef.nullable !== false ? '' : 'NOT NULL';
        const defaultVal = columnDef.default ? `DEFAULT ${columnDef.default}` : '';
        columnDefs.push(`"${columnName}" ${pgType} ${nullable} ${defaultVal}`.trim());
      }

      const createQuery = `
        CREATE TABLE IF NOT EXISTS "${schemaName}"."${name}" (
          ${columnDefs.join(',\n')}
        )
      `;

      await this.pool.query(createQuery);

      return {
        success: true,
        message: `Table ${name} created successfully`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create table: ${error.message}`,
      };
    }
  }

  /**
   * Map standard type to PostgreSQL type.
   * @param {string} type - Standard type name
   * @returns {string} PostgreSQL type
   */
  mapStandardTypeToPostgres(type) {
    const typeMap = {
      string: 'TEXT',
      integer: 'INTEGER',
      number: 'NUMERIC',
      float: 'REAL',
      boolean: 'BOOLEAN',
      date: 'DATE',
      timestamp: 'TIMESTAMP',
      json: 'JSONB',
      uuid: 'UUID',
      binary: 'BYTEA',
      text: 'TEXT',
    };

    return typeMap[type.toLowerCase()] || 'TEXT';
  }

  /**
   * Close the connection pool.
   * @returns {Promise<void>}
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}
