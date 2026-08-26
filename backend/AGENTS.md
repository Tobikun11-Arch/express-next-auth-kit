# Backend AGENTS.md

## Stack

Express.js, Mongoose (MongoDB), jsonwebtoken, bcrypt, Zod, Nodemailer, Pino

## Commands

```bash
cd backend
npm run dev          # Start dev server (port 5000)
npm run build        # Compile TypeScript
npm run start        # Start production server
npm run seed:admin   # Seed admin account
npm run lint         # ESLint
npm test             # Jest tests (currently commented out)
```

## Architecture

```
api/config/          # DB connection (db.ts) and env validation (env.ts)
api/controllers/     # Route handlers (thin — delegate to services)
api/services/        # Business logic (auth, email, blocklist)
api/repositories/    # Data access layer (user, admin)
api/middleware/       # Auth, validation, rate limiting, sanitize (NoSQL injection prevention), error handler
api/models/          # Mongoose models (Admin.model.ts, User.model.ts) extending BaseUser schema
api/routes/          # Express router definitions
api/templates/       # HTML email templates
api/dtos/            # Zod validation schemas
api/utils/           # ApiError class
api/logging/         # Pino logger configuration
scripts/             # Seed scripts (seed-admin.ts)
```

## Code Style

- TypeScript strict mode — no `any` types in new code (existing tech debt in auth.service.ts)
- Use `ApiError` class for all errors: `throw new ApiError(400, 'ERROR_CODE', 'Message')`
- Use `env` import from `api/config/env.ts` — avoid `process.env` directly (note: COOKIE_SECURE, COOKIE_SAMESITE still use process.env — tech debt to fix)
- Zod DTOs in `api/dtos/` validate all request bodies
- Repository pattern: services call repositories, never Mongoose directly
- Controllers are thin — validate input, call service, send response

## Error Shape

All API errors must follow this shape (enforced in `api/middleware/errorHandler.ts`):

```ts
{
  success: false;
  code: string;      // e.g. "INVALID_CREDENTIALS"
  message: string;   // Human-readable message
  details?: unknown; // Optional additional info
}
```

## Security Rules

- Never commit `.env` files — only `.env.example` is tracked
- Never log secrets, tokens, or passwords
- Cookies use HTTP-only, Secure, SameSite — configured via env vars
- Refresh tokens are revoked on use (in-memory blocklist — resets on server restart)
- Passwords must be bcrypt-hashed before storage
- All input passes through Zod validation before reaching services
- Sanitize middleware strips `$`-prefixed keys to prevent NoSQL injection
- Body size limited to 10kb (`express.json({ limit: '10kb' })`)

## Testing

- Tests in `backend/tests/` using Jest + Supertest
- **Note:** Tests are currently commented out — uncomment and fix before relying on them
- Test API error responses against the error shape above
