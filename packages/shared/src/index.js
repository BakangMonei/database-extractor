/**
 * @fileoverview Shared utilities and interfaces for database connectors.
 * @module @db-migrate/shared
 */

export { Connector, DatabaseType, FieldType } from './connector-interface.js';
export {
  ConnectionConfigSchema,
  MigrationConfigSchema,
  SchemaMappingSchema,
  FieldMappingSchema,
  FirebaseFirestoreConfigSchema,
  PostgreSQLConfigSchema,
  MongoDBConfigSchema,
  SupabaseConfigSchema,
} from './schemas.js';
