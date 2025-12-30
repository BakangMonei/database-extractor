# Connector Development Guide

This guide explains how to add a new database connector to DB Migrate.

## Connector Interface

All connectors must implement the `Connector` base class from `@db-migrate/shared`. The interface includes:

- `testConnection()` - Test database connection
- `discover()` - Discover collections/tables
- `getSchema(name)` - Get schema for a collection/table
- `readBatch(name, options)` - Read data in batches (async generator)
- `writeBatch(name, records, options)` - Write data in batches
- `createTable(name, schema)` - Create table (SQL databases only, optional)
- `close()` - Close connection and cleanup

## Step 1: Create Package

Create a new package in `packages/connectors-<name>`:

```bash
mkdir -p packages/connectors-<name>/src
```

Create `package.json`:

```json
{
  "name": "@db-migrate/connectors-<name>",
  "version": "0.1.0",
  "description": "<Database> connector for database migrations",
  "main": "src/index.js",
  "type": "module",
  "dependencies": {
    "@db-migrate/shared": "*",
    "<database-driver>": "^x.x.x"
  }
}
```

## Step 2: Implement Connector

Create `src/<name>-connector.js`:

```javascript
import { Connector } from '@db-migrate/shared';
import DatabaseDriver from 'database-driver';

export class DatabaseConnector extends Connector {
  constructor(config) {
    super();
    this.config = config;
    this.client = null;
  }

  async initialize() {
    // Initialize database connection
    this.client = new DatabaseDriver(this.config);
    await this.client.connect();
  }

  async testConnection() {
    try {
      await this.initialize();
      // Test connection logic
      return { success: true, message: 'Connected successfully' };
    } catch (error) {
      return { success: false, error, message: error.message };
    }
  }

  async discover() {
    await this.initialize();
    // Return array of { name, type, schema } objects
    return [];
  }

  async getSchema(name) {
    await this.initialize();
    // Return schema information
    return {};
  }

  async *readBatch(name, options = {}) {
    await this.initialize();
    const batchSize = options.batchSize || 100;
    // Yield batches of records
    yield [];
  }

  async writeBatch(name, records, options = {}) {
    await this.initialize();
    // Write records and return { success, count, errors }
    return { success: true, count: records.length };
  }

  async close() {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
  }
}
```

Export in `src/index.js`:

```javascript
export { DatabaseConnector } from './database-connector.js';
```

## Step 3: Register Connector

Add to `apps/api/src/connectors/index.js`:

```javascript
import { DatabaseConnector } from '@db-migrate/connectors-<name>';

export function createConnector(config) {
  switch (config.type) {
    // ... existing cases
    case 'database-type':
      return new DatabaseConnector(config);
    default:
      throw new Error(`Unsupported database type: ${config.type}`);
  }
}
```

## Step 4: Add Configuration Schema

Add to `packages/shared/src/schemas.js`:

```javascript
export const DatabaseConfigSchema = z.object({
  type: z.literal('database-type'),
  // ... connection fields
});

export const ConnectionConfigSchema = z.discriminatedUnion('type', [
  // ... existing schemas
  DatabaseConfigSchema,
]);
```

## Step 5: Add UI Components

### Connection Form

Add to `apps/web/src/components/steps/StepConnection.js`:

```javascript
const renderSourceForm = () => {
  if (source === 'database-type') {
    return <form onSubmit={handleSubmitSource(onSubmitSource)}>{/* Form fields */}</form>;
  }
  // ...
};
```

### Database Type Selection

Add to database type arrays in:

- `apps/web/src/components/steps/StepSource.js`
- `apps/web/src/components/steps/StepDestination.js`

```javascript
const databaseTypes = [
  // ... existing
  { id: 'database-type', name: 'Database Name', icon: '🔷' },
];
```

## Step 6: Write Tests

Create test files in `packages/connectors-<name>/src/__tests__/`:

```javascript
import { DatabaseConnector } from '../database-connector.js';

describe('DatabaseConnector', () => {
  let connector;

  beforeEach(() => {
    connector = new DatabaseConnector({
      /* test config */
    });
  });

  afterEach(async () => {
    await connector.close();
  });

  it('should test connection', async () => {
    const result = await connector.testConnection();
    expect(result.success).toBe(true);
  });

  // More tests...
});
```

## Step 7: Documentation

1. Update README.md with new database support
2. Add usage examples
3. Document any special configuration requirements
4. Update CHANGELOG.md

## Best Practices

1. **Error Handling**: Always return structured error objects
2. **Connection Pooling**: Use connection pooling for SQL databases
3. **Batch Processing**: Implement efficient batch reading/writing
4. **Resource Cleanup**: Always close connections in `close()`
5. **Type Safety**: Use JSDoc for type documentation
6. **Testing**: Test with real databases (use Docker for CI)
7. **Security**: Never log credentials or sensitive data

## Example: Firebase Firestore Connector

See `packages/connectors-firebase/src/firebase-connector.js` for a complete reference implementation.

## Getting Help

- Check existing connectors for patterns
- Open an issue for questions
- See [CONTRIBUTING.md](../CONTRIBUTING.md) for general guidelines
