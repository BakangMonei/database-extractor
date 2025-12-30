# DB Migrate

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![CI](https://github.com/yourusername/db-migrate/workflows/CI/badge.svg)](https://github.com/yourusername/db-migrate/actions)

An open-source tool for migrating data between SQL and NoSQL databases. Built with JavaScript, React, Node.js, and a modular connector architecture.

## Features

- **Multi-Database Support**: Migrate between Firebase Firestore, PostgreSQL, MySQL, MongoDB, and more
- **Flexible Migration Directions**:
  - NoSQL → SQL (Firestore → PostgreSQL/MySQL)
  - SQL → NoSQL (PostgreSQL/MySQL → MongoDB/Firestore)
  - SQL → SQL
  - NoSQL → NoSQL
- **Schema Mapping**: Visual field mapping with type conversions
- **Batch Processing**: Configurable batch sizes for efficient migrations
- **Progress Tracking**: Real-time migration progress and logs
- **Dry Run Mode**: Test migrations without writing data
- **Secure by Default**: All database credentials handled server-side

## Architecture

This project uses a monorepo structure with npm workspaces:

```
db-migrate/
├── apps/
│   ├── web/          # React frontend (TailwindCSS, Redux Toolkit)
│   └── api/          # Express backend API
├── packages/
│   ├── core/         # Migration engine & mapping logic
│   ├── shared/       # Shared utilities & schemas
│   └── connectors-*/ # Database connectors (plugin system)
└── docs/             # Documentation
```

### Technology Stack

- **Frontend**: React 19, Redux Toolkit, TailwindCSS, React Hook Form
- **Backend**: Node.js, Express, Pino (logging)
- **Database Drivers**: Firebase Admin SDK, pg (PostgreSQL), mongodb
- **Validation**: Zod schemas
- **Build**: npm workspaces, Create React App

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
# Clone the repository
git clone https://github.com/BakangMonei/database-extractor
cd db-migrate

# Install dependencies
npm install
```

### Development

```bash
# Start both frontend and backend in development mode
npm run dev

# Or start them separately:
npm run dev:web  # Frontend on http://localhost:3000
npm run dev:api  # Backend on http://localhost:3001
```

### Environment Setup

Create `.env` files for configuration (see `.env.example`):

**Backend (`apps/api/.env`)**:

```env
PORT=3001
LOG_LEVEL=info
NODE_ENV=development
```

**Frontend (`apps/web/.env`)**:

```env
REACT_APP_API_URL=http://localhost:3001
```

### Usage

1. **Select Databases**: Choose source and destination database types
2. **Configure Connections**: Enter connection details (credentials handled securely on backend)
3. **Discover Data**: Browse collections/tables and select what to migrate
4. **Map Fields**: Map source fields to destination fields with type conversions
5. **Configure Settings**: Set batch size, upsert options, dry run mode
6. **Run Migration**: Monitor progress in real-time

> 📘 **New to testing database connections?** See the comprehensive [Testing Guide](docs/TESTING_GUIDE.md) for detailed, step-by-step instructions for each database type.

## MVP: Firestore → PostgreSQL

The current MVP supports end-to-end migration from Firebase Firestore to PostgreSQL:

### Firebase Setup

For Firebase Firestore, you need:

1. **Service Account JSON** (recommended for production):
   - Download from Firebase Console → Project Settings → Service Accounts
   - Paste JSON content in the connection form (not stored, used temporarily)

2. **Or Firebase Client Config** (development only):
   ```javascript
   {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     // ... other config
   }
   ```

### PostgreSQL Setup

Standard PostgreSQL connection:

- Host, Port (default: 5432)
- Database name
- Username and password
- SSL option

### Example Migration

1. Select **Firebase Firestore** as source
2. Select **PostgreSQL** as destination
3. Configure Firebase (service account JSON or client config)
4. Configure PostgreSQL connection
5. Discover collections and tables
6. Map Firestore collection fields to PostgreSQL table columns
7. Run migration!

## Project Structure

### Packages

- **@db-migrate/shared**: Connector interface, schemas, types
- **@db-migrate/core**: Migration engine, job runner, transformation logic
- **@db-migrate/connectors-firebase**: Firebase Firestore connector
- **@db-migrate/connectors-postgres**: PostgreSQL connector
- **@db-migrate/connectors-mongo**: MongoDB connector (stub)

### Apps

- **@db-migrate/web**: React frontend application
- **@db-migrate/api**: Express API server

## Adding a New Connector

1. Create a new package: `packages/connectors-<name>`
2. Implement the `Connector` interface from `@db-migrate/shared`
3. Register in `apps/api/src/connectors/index.js`
4. Add connection form UI in `apps/web/src/components/steps/StepConnection.js`
5. Add to database type lists in step components
6. Write tests
7. Update documentation

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## Security

**IMPORTANT**: This tool handles sensitive database credentials. Key security practices:

- ✅ All database connections are made server-side (backend API)
- ✅ Credentials are never stored in frontend or localStorage
- ✅ Service account files are handled as temporary uploads (not persisted)
- ✅ Environment variables for sensitive configuration
- ✅ HTTPS required in production

See [SECURITY.md](SECURITY.md) for full security guidelines.

## Testing

```bash
# Run all tests
npm test

# Run tests for a specific package
npm test --workspace=@db-migrate/core
```

## Building

```bash
# Build all packages and apps
npm run build

# Build specific workspace
npm run build --workspace=@db-migrate/web
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Code of Conduct
- Development setup
- How to add connectors
- Pull request process
- Coding standards

## Roadmap

### Phase 1: MVP (Current) ✅

- [x] Monorepo structure
- [x] Firebase Firestore → PostgreSQL migration
- [x] Basic UI wizard
- [x] Schema mapping
- [x] Progress tracking

### Phase 2: Enhanced Features

- [ ] MongoDB connector (full implementation)
- [ ] MySQL connector
- [ ] Oracle connector
- [ ] Advanced field transformations
- [ ] Data validation
- [ ] Migration rollback
- [ ] Scheduled migrations

### Phase 3: Enterprise Features

- [ ] Redis/BullMQ for job queue
- [ ] Webhook notifications
- [ ] Migration history & audit logs
- [ ] Multi-tenant support
- [ ] CLI tool
- [ ] Docker images

### Phase 4: Extended Support

- [ ] More database types (Redis, DynamoDB, etc.)
- [ ] Incremental migrations
- [ ] Data transformation scripts
- [ ] Schema evolution handling
- [ ] Performance optimization tools

See [GitHub Issues](https://github.com/yourusername/db-migrate/issues) for detailed feature requests.

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.

## Documentation

- 📖 [Full Documentation](docs/)
- 🧪 [Testing Guide](docs/TESTING_GUIDE.md) - Detailed instructions for testing each database connector
- 🔌 [Connector Guide](docs/connector-guide.md) - How to add new database connectors

## Support

- 🐛 [Issue Tracker](https://github.com/BakangMonei/database-extractor/issues)
- 💬 [Discussions](https://github.com/BakangMonei/database-extractor/discussions)

## Acknowledgments

Built with ❤️ by the open-source community. Special thanks to all contributors!
