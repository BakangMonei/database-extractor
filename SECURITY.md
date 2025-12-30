# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of DB Migrate seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please do NOT:

- Open a public GitHub issue
- Discuss the vulnerability in public forums
- Share the vulnerability with others until it has been resolved

### Please DO:

1. Email security details to [INSERT SECURITY EMAIL] with:
   - A clear description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact
   - Suggested fix (if you have one)

2. Allow us at least 90 days to address the vulnerability before public disclosure

3. We will:
   - Acknowledge receipt of your report within 48 hours
   - Provide a detailed response within 7 days
   - Keep you informed of our progress
   - Credit you in the security advisory (if desired)

## Security Best Practices

### Never Store Secrets in the Frontend

**CRITICAL**: Database credentials, API keys, and service account files must NEVER be stored in:

- Frontend code
- Browser localStorage
- Browser sessionStorage
- Client-side state management
- Version control

### Backend Security

- All database connections are handled by the backend API
- Credentials are validated server-side only
- Use environment variables for sensitive configuration
- Service account files are handled as temporary uploads (not persisted)
- Implement rate limiting on API endpoints
- Use HTTPS in production

### Credential Handling

1. **Development**: Use environment variables (`.env` files excluded from git)
2. **Production**: Use secure secret management (AWS Secrets Manager, Azure Key Vault, etc.)
3. **Service Account Files**:
   - Accept as temporary uploads
   - Validate format and structure
   - Never persist to disk
   - Clean up after validation/use

### Firebase Admin Setup

When using Firebase Admin SDK:

- Service account JSON files are uploaded temporarily
- Credentials are loaded into memory only
- Never store service account files in the repository
- Use environment variables when possible

### Connection Testing

- Test connections server-side only
- Never expose connection strings or credentials in API responses
- Return generic success/failure messages
- Log connection attempts (without credentials) for debugging

## Security Checklist for Contributors

- [ ] No credentials in code
- [ ] No credentials in environment examples
- [ ] API endpoints validate input
- [ ] Rate limiting implemented
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (input sanitization)
- [ ] CORS properly configured
- [ ] Error messages don't leak sensitive information
- [ ] Dependencies are up-to-date (check for vulnerabilities)
- [ ] Tests cover security-critical paths

## Known Security Considerations

1. **Database Connections**: The tool requires database credentials to function. These are handled securely in the backend.

2. **Firebase Admin**: Requires service account JSON with elevated permissions. Handle with extreme care.

3. **Data in Transit**: Always use encrypted connections (SSL/TLS) for database connections.

4. **Data at Rest**: Be aware that migration logs may contain sensitive data. Implement appropriate retention and access controls.

## Dependency Security

We regularly update dependencies to address security vulnerabilities. To check for known vulnerabilities:

```bash
npm audit
```

To update dependencies:

```bash
npm update
```

For critical security updates, we will release patches promptly.
