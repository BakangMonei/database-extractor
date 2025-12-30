/**
 * @fileoverview Firebase Firestore connector implementation.
 * @module @db-migrate/connectors-firebase
 */

import admin from 'firebase-admin';
import { Connector } from '@db-migrate/shared';

/**
 * Firebase Firestore connector.
 * @extends Connector
 */
export class FirebaseFirestoreConnector extends Connector {
  /**
   * @param {object} config - Firebase configuration
   */
  constructor(config) {
    super();
    this.config = config;
    this.db = null;
    this.app = null;
  }

  /**
   * Initialize Firebase Admin SDK.
   */
  async initialize() {
    if (this.app) {
      return; // Already initialized
    }

    try {
      // If service account is provided, use it
      if (this.config.serviceAccount) {
        this.app = admin.initializeApp({
          credential: admin.credential.cert(this.config.serviceAccount),
          projectId: this.config.projectId,
        });
      } else {
        // Try to use default credentials (for local development)
        this.app = admin.initializeApp({
          projectId: this.config.projectId,
        });
      }

      this.db = admin.firestore();
    } catch (error) {
      throw new Error(`Failed to initialize Firebase: ${error.message}`);
    }
  }

  /**
   * Test the Firebase connection.
   * @returns {Promise<{success: boolean, message?: string, error?: Error}>}
   */
  async testConnection() {
    try {
      await this.initialize();
      // Try to list collections (requires read permission)
      const collections = await this.db.listCollections();
      return {
        success: true,
        message: `Successfully connected to Firestore. Found ${collections.length} collections.`,
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
   * Discover available collections in Firestore.
   * @returns {Promise<Array<{name: string, type: string, schema?: object}>>}
   */
  async discover() {
    await this.initialize();

    try {
      const collections = await this.db.listCollections();
      const result = [];

      for (const collection of collections) {
        // Get a sample document to infer schema
        const snapshot = await collection.limit(1).get();
        let schema = null;

        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          schema = this.inferSchema(doc.data());
        }

        result.push({
          name: collection.id,
          type: 'collection',
          schema,
          documentCount: await this.getCollectionSize(collection.id),
        });
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to discover collections: ${error.message}`);
    }
  }

  /**
   * Get approximate collection size.
   * @param {string} collectionName - Collection name
   * @returns {Promise<number>} Document count (approximate)
   */
  async getCollectionSize(collectionName) {
    try {
      const snapshot = await this.db.collection(collectionName).count().get();
      return snapshot.data().count;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Infer schema from a Firestore document.
   * @param {object} data - Document data
   * @returns {object} Schema object
   */
  inferSchema(data) {
    const schema = {};

    for (const [key, value] of Object.entries(data)) {
      schema[key] = this.inferFieldType(value);
    }

    return schema;
  }

  /**
   * Infer field type from value.
   * @param {any} value - Field value
   * @returns {string} Field type
   */
  inferFieldType(value) {
    if (value === null) return 'null';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (value instanceof Date || value.toDate) return 'timestamp';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') {
      // Check if it's a Firestore GeoPoint, Reference, etc.
      if (value.constructor.name === 'GeoPoint') return 'geopoint';
      if (value.constructor.name === 'Timestamp') return 'timestamp';
      if (value.path) return 'reference'; // DocumentReference
      return 'object';
    }
    return 'unknown';
  }

  /**
   * Get schema information for a collection.
   * @param {string} name - Collection name
   * @returns {Promise<object>} Schema information
   */
  async getSchema(name) {
    await this.initialize();

    try {
      const snapshot = await this.db.collection(name).limit(10).get();
      const schemas = [];

      for (const doc of snapshot.docs) {
        schemas.push(this.inferSchema(doc.data()));
      }

      // Merge schemas to get union of all fields
      const mergedSchema = {};
      for (const schema of schemas) {
        for (const [key, type] of Object.entries(schema)) {
          if (!mergedSchema[key]) {
            mergedSchema[key] = new Set();
          }
          mergedSchema[key].add(type);
        }
      }

      // Convert sets to arrays
      const result = {};
      for (const [key, types] of Object.entries(mergedSchema)) {
        result[key] = Array.from(types);
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to get schema for collection ${name}: ${error.message}`);
    }
  }

  /**
   * Read data in batches.
   * @param {string} name - Collection name
   * @param {object} options - Read options (batchSize, limit, offset)
   * @yields {Array<object>} Batch of documents
   */
  async *readBatch(name, options = {}) {
    await this.initialize();

    const batchSize = options.batchSize || 100;
    const limit = options.limit || Infinity;
    let lastDoc = null;
    let totalRead = 0;

    try {
      while (totalRead < limit) {
        let query = this.db.collection(name).limit(Math.min(batchSize, limit - totalRead));

        if (lastDoc) {
          query = query.startAfter(lastDoc);
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
          break;
        }

        const batch = [];
        for (const doc of snapshot.docs) {
          batch.push({
            _id: doc.id,
            ...doc.data(),
          });
          lastDoc = doc;
        }

        yield batch;
        totalRead += batch.length;

        if (snapshot.size < batchSize) {
          break; // Last batch
        }
      }
    } catch (error) {
      throw new Error(`Failed to read batch from collection ${name}: ${error.message}`);
    }
  }

  /**
   * Write a batch of records (not supported for read-only connector).
   * @param {string} name - Collection name
   * @param {Array<object>} records - Records to write
   * @param {object} options - Write options
   * @returns {Promise<{success: boolean, count: number, errors?: Array<Error>}>}
   */
  async writeBatch(name, records, options = {}) {
    // Firestore is typically the source, not destination
    // But we can implement write for completeness
    await this.initialize();

    const batch = this.db.batch();
    const errors = [];

    try {
      for (const record of records) {
        const { _id, ...data } = record;
        const docRef = _id ? this.db.collection(name).doc(_id) : this.db.collection(name).doc();

        if (options.upsert) {
          batch.set(docRef, data, { merge: true });
        } else {
          batch.set(docRef, data);
        }
      }

      await batch.commit();
      return {
        success: true,
        count: records.length,
      };
    } catch (error) {
      errors.push(error);
      return {
        success: false,
        count: 0,
        errors,
      };
    }
  }

  /**
   * Close the connection.
   * @returns {Promise<void>}
   */
  async close() {
    if (this.app) {
      await this.app.delete();
      this.app = null;
      this.db = null;
    }
  }
}
