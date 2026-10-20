# Security Policy

## Supported Versions

| Version / Branch | Supported |
| ---------------- | --------- |
| `production` (latest) | :white_check_mark: |
| older branches / tags | :x: |

Only the latest state of the `production` branch receives security fixes.

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please email the maintainer directly:

- **Email:** joenelsevellejo831@gmail.com
- **Subject:** `[SECURITY] express-next-auth-kit - <short description>`

Please include:

- A description of the vulnerability and its potential impact
- Steps to reproduce (proof of concept if possible)
- Affected component(s) (backend / frontend / specific file)
- Any suggested fix or mitigation

You can expect an initial response within **72 hours**. If the issue is confirmed, a fix will be released as soon as possible, and you will be credited in the release notes (unless you prefer to remain anonymous).

## Security Measures

This project already implements the following security controls.

### Backend

- Passwords are hashed with **bcrypt** before storage
- Authentication uses **JWT** access + refresh tokens delivered via **HTTP-only, Secure, SameSite cookies**
- Refresh tokens are **rotated** on use; reuse beyond a 60s grace window revokes the entire token family
- Sessions are tracked in MongoDB (`refresh_sessions`) with expiry (`expiresAt`)
- **Helmet** sets secure HTTP headers
- **CORS** is restricted to configured origins (`CORS_ORIGINS`); wildcard `*` is never used with credentials
- **express-rate-limit** protects auth endpoints (configurable via `RATE_LIMIT_ENABLED`)
- Request body size is limited to `10kb`
- **Sanitize middleware** strips `$`-prefixed keys to prevent NoSQL injection
- All request bodies are validated with **Zod** DTOs before reaching services
- Structured logging via **Pino** never logs secrets, tokens, or passwords
- Environment variables are validated at startup (`api/config/env.ts`)

### Frontend

- Tokens are never stored in `localStorage`; cookies are managed by the backend
- All API traffic goes through `httpClient.ts` (handles auth, refresh, error normalization)
- Raw backend errors are mapped to friendly messages via `getFriendlyErrorMessage()` (no internal details leaked to users)
- TypeScript strict mode

## Disclosure Policy

- Please give the maintainers reasonable time to fix the issue before public disclosure.
- Please do not exploit the vulnerability beyond what is necessary to demonstrate it.
- Please do not access, modify, or delete data that does not belong to you.

## Out of Scope

- Vulnerabilities in third-party dependencies (report those upstream; we track them via `npm audit`)
- Issues requiring physical access to a user's device
- Social engineering
- Denial of service against local development setups

Thank you for helping keep this project and its users safe.
