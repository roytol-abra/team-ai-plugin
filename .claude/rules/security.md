# Security Rules

These rules are enforced on every change. Security issues are always blockers.

## Secrets
- NEVER commit secrets, API keys, tokens, passwords, or connection strings to code
- Use environment variables or a secrets manager
- If a secret is accidentally committed, rotate it immediately — git history preserves it forever
- `.env` files must be in `.gitignore` — commit `.env.example` with placeholder values instead

## Input Validation
- Validate ALL external input at the system boundary: user input, API payloads, URL params, headers, file uploads
- Whitelist/allowlist over blacklist/denylist — define what's valid, reject everything else
- Validate type, length, range, and format
- Sanitize before storage, encode before output

## Injection Prevention
- SQL: use parameterized queries or ORM — never concatenate user input into queries
- XSS: encode output for the context (HTML, JS, URL, CSS) — never use innerHTML with user data
- Command injection: avoid shell execution with user input — if unavoidable, use allowlists
- Path traversal: validate and normalize file paths — reject `..` sequences

## Authentication & Authorization
- Check authorization on EVERY protected endpoint — not just the frontend
- Use established libraries for auth — don't roll your own crypto or session management
- Hash passwords with bcrypt, scrypt, or argon2 — never MD5 or SHA for passwords
- Tokens must be random, sufficiently long, and have expiration
- Implement rate limiting on authentication endpoints

## Data Protection
- Encrypt sensitive data at rest and in transit (TLS)
- Don't log PII, tokens, passwords, or financial data
- API responses should return only the data the client needs — no over-fetching
- File uploads: validate type, size, and content — don't trust the extension

## Dependencies
- Keep dependencies updated — run security audits regularly
- Review new dependencies before adding — check maintainer reputation, known vulnerabilities
- Commit lock files to ensure reproducible builds
- Prefer well-maintained packages with active security response
