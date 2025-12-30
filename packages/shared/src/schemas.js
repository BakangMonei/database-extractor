/**
 * @fileoverview JSON schemas for validation using Zod.
 * @module @db-migrate/shared/schemas
 */

import { z } from 'zod';

/**
 * Connection configuration schema for Firebase Firestore.
 */
export const FirebaseFirestoreConfigSchema = z.object({
  type: z.literal('firebase-firestore'),
  projectId: z.string(),
  serviceAccount: z.record(z.any()).optional(),
  // For client-side Firebase SDK (dev only)
  apiKey: z.string().optional(),
  authDomain: z.string().optional(),
  databaseURL: z.string().optional(),
  storageBucket: z.string().optional(),
  messagingSenderId: z.string().optional(),
  appId: z.string().optional(),
  measurementId: z.string().optional(),
});

/**
 * Connection configuration schema for PostgreSQL.
 */
export const PostgreSQLConfigSchema = z.object({
  type: z.literal('postgresql'),
  host: z.string(),
  port: z.number().int().positive().default(5432),
  database: z.string(),
  user: z.string(),
  password: z.string(),
  ssl: z.boolean().default(false),
  schema: z.string().default('public'),
});

/**
 * Connection configuration schema for MongoDB.
 */
export const MongoDBConfigSchema = z.object({
  type: z.literal('mongodb'),
  connectionString: z.string(),
  database: z.string(),
  options: z.record(z.any()).optional(),
});

/**
 * Union schema for all connection configurations.
 */
export const ConnectionConfigSchema = z.discriminatedUnion('type', [
  FirebaseFirestoreConfigSchema,
  PostgreSQLConfigSchema,
  MongoDBConfigSchema,
]);

/**
 * Field mapping schema.
 */
export const FieldMappingSchema = z.object({
  sourceField: z.string(),
  targetField: z.string(),
  sourceType: z.string(),
  targetType: z.string(),
  transform: z.string().optional(), // Transformation function name
  defaultValue: z.any().optional(),
});

/**
 * Schema mapping configuration.
 */
export const SchemaMappingSchema = z.object({
  sourceCollection: z.string(),
  targetTable: z.string(),
  fieldMappings: z.array(FieldMappingSchema),
  options: z
    .object({
      flatten: z.boolean().default(false),
      prefix: z.string().optional(),
      skipFields: z.array(z.string()).default([]),
    })
    .optional(),
});

/**
 * Migration job configuration.
 */
export const MigrationConfigSchema = z.object({
  source: ConnectionConfigSchema,
  destination: ConnectionConfigSchema,
  mappings: z.array(SchemaMappingSchema),
  settings: z
    .object({
      batchSize: z.number().int().positive().default(100),
      upsert: z.boolean().default(false),
      dryRun: z.boolean().default(false),
      retries: z.number().int().nonnegative().default(3),
      createTable: z.boolean().default(false),
    })
    .optional(),
});
