/**
 * @fileoverview Core migration engine that orchestrates data migration between connectors.
 * @module @db-migrate/core/migration-engine
 */

import { MigrationConfigSchema } from '@db-migrate/shared';

/**
 * Migration engine that coordinates data migration between source and destination connectors.
 */
export class MigrationEngine {
  /**
   * @param {object} sourceConnector - Source database connector instance
   * @param {object} destinationConnector - Destination database connector instance
   * @param {object} config - Migration configuration
   */
  constructor(sourceConnector, destinationConnector, config) {
    this.sourceConnector = sourceConnector;
    this.destinationConnector = destinationConnector;
    this.config = MigrationConfigSchema.parse(config);
    this.status = {
      state: 'idle', // idle, running, paused, completed, failed
      progress: 0,
      totalRecords: 0,
      processedRecords: 0,
      errors: [],
      logs: [],
    };
  }

  /**
   * Transform a record according to field mappings.
   * @param {object} record - Source record
   * @param {object} mapping - Schema mapping configuration
   * @returns {object} Transformed record
   */
  transformRecord(record, mapping) {
    const transformed = {};
    const options = mapping.options || {};

    // Apply field mappings
    for (const fieldMapping of mapping.fieldMappings) {
      const sourceValue = this.getNestedValue(record, fieldMapping.sourceField);
      let value = sourceValue !== undefined ? sourceValue : fieldMapping.defaultValue;

      // Type conversion
      value = this.convertType(value, fieldMapping.sourceType, fieldMapping.targetType);

      // Apply transformation if specified
      if (fieldMapping.transform) {
        value = this.applyTransform(value, fieldMapping.transform);
      }

      this.setNestedValue(transformed, fieldMapping.targetField, value);
    }

    // Handle flattening
    if (options.flatten) {
      return this.flattenObject(transformed, options.prefix);
    }

    return transformed;
  }

  /**
   * Get nested value from object using dot notation.
   * @param {object} obj - Object to get value from
   * @param {string} path - Dot notation path (e.g., "user.name")
   * @returns {any} Value at path
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Set nested value in object using dot notation.
   * @param {object} obj - Object to set value in
   * @param {string} path - Dot notation path
   * @param {any} value - Value to set
   */
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * Convert value from one type to another.
   * @param {any} value - Value to convert
   * @param {string} sourceType - Source type
   * @param {string} targetType - Target type
   * @returns {any} Converted value
   */
  convertType(value, sourceType, targetType) {
    if (value === null || value === undefined) {
      return value;
    }

    // Same type, no conversion needed
    if (sourceType === targetType) {
      return value;
    }

    try {
      switch (targetType) {
        case 'string':
          return String(value);
        case 'number':
        case 'integer':
        case 'float':
          return Number(value);
        case 'boolean':
          return Boolean(value);
        case 'date':
        case 'timestamp':
          return new Date(value);
        case 'json':
          return typeof value === 'string' ? JSON.parse(value) : value;
        default:
          return value;
      }
    } catch (error) {
      this.status.logs.push({
        level: 'warn',
        message: `Type conversion failed: ${sourceType} -> ${targetType}`,
        error: error.message,
      });
      return value;
    }
  }

  /**
   * Apply a transformation function to a value.
   * @param {any} value - Value to transform
   * @param {string} transformName - Name of transformation function
   * @returns {any} Transformed value
   */
  applyTransform(value, transformName) {
    // Built-in transformations
    switch (transformName) {
      case 'toLowerCase':
        return String(value).toLowerCase();
      case 'toUpperCase':
        return String(value).toUpperCase();
      case 'trim':
        return String(value).trim();
      default:
        return value;
    }
  }

  /**
   * Flatten a nested object.
   * @param {object} obj - Object to flatten
   * @param {string} prefix - Optional prefix for keys
   * @returns {object} Flattened object
   */
  flattenObject(obj, prefix = '') {
    const flattened = {};
    const pre = prefix ? `${prefix}_` : '';

    for (const [key, value] of Object.entries(obj)) {
      const newKey = `${pre}${key}`;
      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        !(value instanceof Date)
      ) {
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    }

    return flattened;
  }

  /**
   * Run the migration.
   * @returns {AsyncGenerator<object, void, unknown>} Progress updates
   */
  async *run() {
    this.status.state = 'running';
    this.status.progress = 0;
    this.status.errors = [];
    this.status.logs = [];

    const settings = this.config.settings || {};
    const batchSize = settings.batchSize || 100;
    const dryRun = settings.dryRun || false;

    try {
      for (const mapping of this.config.mappings) {
        this.status.logs.push({
          level: 'info',
          message: `Starting migration: ${mapping.sourceCollection} -> ${mapping.targetTable}`,
        });

        // Create table if needed (SQL destinations)
        if (settings.createTable && this.destinationConnector.createTable) {
          const schema = await this.inferSchema(mapping);
          await this.destinationConnector.createTable(mapping.targetTable, schema);
        }

        let batch = [];
        let totalProcessed = 0;

        // Read in batches from source
        for await (const records of this.sourceConnector.readBatch(mapping.sourceCollection, {
          batchSize,
        })) {
          // Transform records
          const transformedRecords = records.map(record => this.transformRecord(record, mapping));

          if (!dryRun) {
            // Write to destination
            const result = await this.destinationConnector.writeBatch(
              mapping.targetTable,
              transformedRecords,
              {
                upsert: settings.upsert || false,
              }
            );

            if (result.errors && result.errors.length > 0) {
              this.status.errors.push(...result.errors);
            }

            totalProcessed += result.count || transformedRecords.length;
          } else {
            totalProcessed += transformedRecords.length;
          }

          this.status.processedRecords = totalProcessed;
          this.status.progress = this.status.totalRecords
            ? (totalProcessed / this.status.totalRecords) * 100
            : 0;

          yield {
            ...this.status,
            currentMapping: mapping.sourceCollection,
            currentBatch: totalProcessed,
          };
        }

        this.status.logs.push({
          level: 'info',
          message: `Completed migration: ${mapping.sourceCollection} -> ${mapping.targetTable} (${totalProcessed} records)`,
        });
      }

      this.status.state = 'completed';
      this.status.progress = 100;
    } catch (error) {
      this.status.state = 'failed';
      this.status.errors.push(error);
      this.status.logs.push({
        level: 'error',
        message: `Migration failed: ${error.message}`,
        error: error.stack,
      });
      throw error;
    }

    yield this.status;
  }

  /**
   * Infer schema from mapping for table creation.
   * @param {object} mapping - Schema mapping
   * @returns {Promise<object>} Schema definition
   */
  async inferSchema(mapping) {
    // Simple schema inference - can be enhanced
    const columns = {};
    for (const fieldMapping of mapping.fieldMappings) {
      columns[fieldMapping.targetField] = {
        type: fieldMapping.targetType,
        nullable: fieldMapping.defaultValue === null,
      };
    }
    return { columns };
  }
}
