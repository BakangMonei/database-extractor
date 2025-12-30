# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial monorepo structure with npm workspaces
- React frontend with migration wizard UI
- Express backend API with async job handling
- Core migration engine with schema mapping
- Firebase Firestore connector
- PostgreSQL connector
- Shared utilities and connector interface
- Open-source documentation (LICENSE, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY)
- GitHub Actions CI workflow
- ESLint and Prettier configuration
- JSDoc type documentation

### Changed

- Migrated from single React app to monorepo architecture

## [0.1.0] - 2024-01-XX

### Added

- MVP: Firestore → PostgreSQL migration
- Connection testing for Firebase and PostgreSQL
- Schema discovery for Firestore collections and PostgreSQL tables
- Field mapping UI with type conversion options
- Batch migration with progress tracking
- Migration logs and error reporting
- Dry-run mode for testing migrations

[Unreleased]: https://github.com/yourusername/db-migrate/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/yourusername/db-migrate/releases/tag/v0.1.0
