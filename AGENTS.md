# AGENTS.md

## Project Overview

Full-stack auth boilerplate — Next.js 16 frontend + Express.js backend with JWT authentication, role-based access (User/Admin), email verification, and password reset.

## Stack

**Frontend:** Next.js 16 App Router, React 19, TypeScript 5, TailwindCSS v4, shadcn/ui, TanStack Query v5, Axios
**Backend:** Express.js, Mongoose (MongoDB), jsonwebtoken, bcrypt, Zod, Nodemailer, Pino
**Testing:** Jest + Supertest (setup exists, tests currently commented out)
**Runtime:** Node.js 18+

## Commands

```bash
# Backend
cd backend && npm install
npm run dev          # Start dev server (port 5000)
npm run build        # Compile TypeScript
npm run start        # Start production server
npm run seed:admin   # Seed admin account
npm run lint         # ESLint
npm test             # Jest tests (currently commented out)

# Frontend
cd frontend && npm install
npm run dev          # Start Next.js dev server (port 3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # ESLint
```

## Code Style

- TypeScript strict mode — no `any` types in new code (existing tech debt in auth.service.ts)
- Use `ApiError` class for all backend errors: `throw new ApiError(400, 'ERROR_CODE', 'Message')`
- Frontend errors go through `getFriendlyErrorMessage()` — never show raw backend messages
- Zod DTOs in `backend/api/dtos/` validate all request bodies
- Repository pattern: services call repositories, never Mongoose directly
- Use `env` import from `backend/api/config/env.ts` — avoid `process.env` directly (note: COOKIE_SECURE, COOKIE_SAMESITE still use process.env — tech debt to fix)
- React Query hooks in `frontend/lib/hooks/` for server state

## Architecture

```
frontend/app/(auth)/         # Public auth pages (sign-in, sign-up, forgot/reset password, verify email)
frontend/app/(user)/         # User dashboard — /dashboard (parallel routes: @profile, @settings)
frontend/app/(admin)/        # Admin dashboard — /admin/dashboard (parallel routes: @profile, @settings)
frontend/app/(public)/       # Public landing page
frontend/lib/api/            # Axios HTTP client, auth API calls, error handling
frontend/lib/hooks/          # React Query hooks (useMeQuery, useLogout)
frontend/lib/auth/           # Redirect utilities
frontend/lib/provider/       # ReactQueryProvider

backend/api/config/          # DB connection (db.ts) and env validation (env.ts)
backend/api/controllers/     # Route handlers (thin — delegate to services)
backend/api/services/        # Business logic (auth, email, blocklist)
backend/api/repositories/    # Data access layer (user, admin)
backend/api/middleware/       # Auth, validation, rate limiting, sanitize (NoSQL injection prevention), error handler
backend/api/models/          # Mongoose models (Admin.model.ts, User.model.ts) extending BaseUser schema
backend/api/routes/          # Express router definitions
backend/api/templates/       # HTML email templates
backend/api/utils/           # ApiError class
backend/api/logging/         # Pino logger configuration
backend/scripts/             # Seed scripts (seed-admin.ts)
```

## Security Rules

- Never commit `.env` files — only `.env.example` is tracked
- Never log secrets, tokens, or passwords
- Cookies use HTTP-only, Secure, SameSite — configured via env vars
- Refresh tokens are revoked on use (in-memory blocklist — resets on server restart)
- Passwords must be bcrypt-hashed before storage
- All input passes through Zod validation before reaching services
- Sanitize middleware strips `$`-prefixed keys to prevent NoSQL injection

## Testing

- Backend tests in `backend/tests/` using Jest + Supertest
- **Note:** Tests are currently commented out — uncomment and fix before relying on them
- API error shape must be: `{ success, code, message, details }`

## Commits

Use conventional commits: `fix:`, `feat:`, `refactor:`, `chore:`, `docs:`
