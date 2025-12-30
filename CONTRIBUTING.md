# Contributing to DB Migrate

First off, thank you for considering contributing to DB Migrate! It's people like you that make DB Migrate such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to [maintainers].

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Describe the behavior you observed after following the steps**
- **Describe the behavior you expected to see instead**
- **Include screenshots if applicable**
- **Include relevant database types and versions**
- **Include Node.js and npm versions**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Provide specific examples to demonstrate the steps**
- **Describe the current behavior and explain which behavior you expected to see instead**
- **Explain why this enhancement would be useful**

### Pull Requests

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. Ensure the test suite passes.
4. Make sure your code follows the existing style (ESLint + Prettier).
5. Write clear, concise commit messages.
6. Update the CHANGELOG.md with your changes.

## Development Setup

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

# Start development servers
npm run dev
```

This will start both the web app (http://localhost:3000) and API server (http://localhost:3001).

### Project Structure

```
db-migrate/
├── apps/
│   ├── web/          # React frontend
│   └── api/          # Express backend
├── packages/
│   ├── core/         # Migration engine
│   ├── connectors-*/ # Database connectors
│   └── shared/       # Shared utilities
└── docs/             # Documentation
```

### Adding a New Connector

1. Create a new package: `packages/connectors-<name>`
2. Implement the connector interface (see `packages/shared/src/connector-interface.js`)
3. Export your connector class
4. Register it in `packages/core/src/connectors/index.js`
5. Add UI components for connection configuration
6. Write tests
7. Update documentation

See `docs/connector-guide.md` for detailed instructions.

## Coding Standards

- Use JavaScript (ES6+), not TypeScript
- Use JSDoc for type documentation
- Follow ESLint and Prettier configurations
- Write unit tests for new features
- Keep functions small and focused
- Use descriptive variable and function names

## Testing

Run the test suite:

```bash
npm test
```

Write tests for:

- New connectors
- Migration logic
- Schema mapping
- Data transformations

## Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

Example:

```
Add PostgreSQL connector support

Implements the PostgreSQL connector with connection testing,
schema discovery, and batch reading/writing capabilities.

Fixes #123
```

## Questions?

Feel free to open an issue for any questions or concerns.
