# Improvement Plan

This document outlines all issues found during a full audit of the authentication boilerplate, prioritized by severity. Items within each severity level are ordered from easiest/most isolated to most complex.

> **Note:** Removed from the original list — issues #2 (forgot-password routes are already registered), #19 (sign-in page is fully implemented), and #23 (all repository methods already use `.exec()`).

---

## 🔴 Critical

### 1. No request body size limiter

**File:** `backend/index.ts:23`

`express.json()` is called with no `limit` option, allowing oversized payloads to hit the server.

**Fix:** Add `limit: '10kb'` (or appropriate size) to `express.json()`.

---

### 2. Email enumeration via `resendVerification`

**File:** `backend/api/services/auth.service.ts:131-132`

Returns `USER_NOT_FOUND` when the email does not exist, allowing attackers to probe which emails are registered.

**Fix:** Return a generic success response regardless of whether the email exists (same approach as `forgotPassword`).

---

### 3. Logout does not invalidate tokens

**File:** `backend/api/controllers/auth.controller.ts:122-131`

Clears cookies but does not prevent the JWTs from being used if they are captured elsewhere. Tokens remain valid until expiry.

**Fix:** Maintain an in-memory or Redis blocklist (JTI-based) or implement token rotation that invalidates the previous refresh token.

---

### 4. Refresh tokens cannot be revoked

**File:** `backend/api/services/auth.service.ts:269-272`

Refresh tokens are pure JWTs with no server-side tracking. If stolen, they remain valid for 7 days with no way to invalidate them.

**Fix:** Implement refresh token rotation (issue a new refresh token on each use and invalidate the old one) and optionally maintain a server-side blocklist for forced logouts.

---

### 5. Shared `verificationCode` field conflates email verification and password reset

**Files:**

- `backend/api/models/base/BaseUser.schema.ts:10-11`
- `backend/api/services/auth.service.ts:188`

Both features use the same `verificationCode` / `verificationExpiry` fields on the user document. A password reset request overwrites any pending email verification code and vice versa.

**Fix:** Add dedicated fields (`resetCode`, `resetExpiry`) to the schema or create a separate tokens collection.

---

## 🟡 High

### 6. Cookie config bypasses Zod validation

**File:** `backend/api/controllers/auth.controller.ts:12-13`

Reads `COOKIE_SECURE` and `COOKIE_SAMESITE` directly from `process.env` instead of the validated `env` export.

**Fix:** Add `COOKIE_SECURE` and `COOKIE_SAMESITE` to the env schema and import from `env`.

---

### 7. Hardcoded CORS origin with trailing slash

**File:** `backend/index.ts:16`

CORS origin includes `'https://express-next-auth-kit.vercel.app/'` with a trailing slash, which will not match incoming requests (browsers send the origin without a trailing slash). Also, hardcoded origins should be configurable via environment variables.

**Fix:** Read allowed origins from environment variables. Remove trailing slashes from origin strings.

---

### 8. Weak password policy

**File:** `backend/api/dtos/auth.dto.ts:7`

Only requires minimum length of 8 characters. No uppercase, lowercase, digit, or special character rules. No breached-password check.

**Fix:** Add character class requirements to the Zod schema. Optionally integrate the Pwned Passwords API (haveibeenpwned.com).

---

### 9. Race condition in `resetPassword`

**File:** `backend/api/services/auth.service.ts:228-229`

Clears the verification code before updating the password hash. If the password update fails, the code is gone and the user cannot retry.

**Fix:** Reverse the order: update password first, then clear the code. Or use a transaction.

---

### 10. Type-unsafe `as any` in `resetPassword`

**File:** `backend/api/services/auth.service.ts:229`

Passes `{passwordHash} as any` to `updateProfile` whose type only accepts `firstName | lastName | username | email`.

**Fix:** Accept `passwordHash` in the `updateProfile` parameter type or create a dedicated password update method on the repository.

---

### 11. Dead code in `refreshAccessToken`

**File:** `backend/api/services/auth.service.ts:290-305`

Fallback branch queries both user and admin repositories when `tokenType` is missing from the JWT payload, but the token is always signed with a type (line 264/270). This adds unnecessary database queries.

**Fix:** Remove the fallback branch and assume `payload.type` is always present.

---

### 12. MongoDB duplicate-key error parsing is brittle

**File:** `backend/api/services/auth.service.ts:76-98`

Parsing `err.message` and `err.keyPattern` strings is version-dependent and fragile across MongoDB driver versions.

**Fix:** Check for code `11000` exclusively and use `err.keyValue` instead of string matching.

---

## 🟠 Medium

### 13. Duplicate magic strings for cookie names

**Files:**

- `backend/api/controllers/auth.controller.ts:6-7`
- `backend/api/middleware/auth.ts:6`

`dc_access_token` is defined in two places.

**Fix:** Extract to a shared constants file (e.g., `backend/api/constants/cookies.ts`).

---

### 14. Inconsistent error code casing

**Files:** `backend/api/services/auth.service.ts` and `backend/api/controllers/auth.controller.ts`

Some codes use `SNAKE_CASE` (`EMAIL_EXISTS`), others use `UPPERCASE` (`UNAUTHORIZED`). All are technically uppercase but the naming convention is inconsistent.

**Fix:** Define an enum or constant object for all error codes and use it consistently.

---

### 15. SMTP transport created on every email send

**File:** `backend/api/services/email.service.ts:43-51`

Creates a new Nodemailer transporter for each email. Should reuse a singleton.

**Fix:** Create and cache the transporter once at module level, or use a connection pool.

---

### 16. Frontend username field mismatch

**Files:**

- `frontend/app/(auth)/sign-up/page.tsx:109` — `required` attribute on username input
- `backend/api/dtos/auth.dto.ts:8` — `username` is `optional()`

Frontend requires username but backend accepts it as optional, causing inconsistency.

**Fix:** Align frontend and backend — either make username required in both or optional in both.

---

### 17. No request logging middleware

**Files:** `backend/index.ts`

Pino is listed as a dependency but is never used to log incoming HTTP requests (method, URL, status code, duration).

**Fix:** Add a middleware that logs each request using a Pino logger instance.

---

### 18. No CSRF protection

Cookie-based auth with `SameSite` is partially protected, but if `COOKIE_SAMESITE=none` is configured there is no CSRF defense.

**Fix:** Implement CSRF tokens for state-changing requests, or enforce `SameSite=Strict`/`Lax` as the default.

---

### 19. Tests are fully commented out

**File:** `backend/tests/auth.test.ts`

Entire test file is commented out. No active tests exist.

**Fix:** Implement integration/unit tests covering register, login, refresh, verify, and authorization flows.

---

## 🟢 Low

### 20. `BaseUserDocument` missing `createdAt`/`updatedAt` despite `timestamps: true`

**File:** `backend/api/models/base/BaseUser.schema.ts:3-12`

Schema uses `{timestamps: true}` but the TypeScript interface does not declare `createdAt` or `updatedAt`.

**Fix:** Extend the interface to include `createdAt: Date` and `updatedAt: Date`.

---

### 21. `getCookieOptions` reads `process.env` on every request

**File:** `backend/api/controllers/auth.controller.ts:9-16`

Called per-request but the values never change. Reads `process.env` directly each time.

**Fix:** Cache the cookie options at module load time or inject via the validated `env` config.

---

### 22. No "change password" endpoint for authenticated users

**Files:** `backend/api/services/auth.service.ts` / `backend/api/routes/auth.routes.ts`

Only forgot/reset password flow exists. Authenticated users cannot change their password directly.

**Fix:** Add `PUT /auth/password` with current password verification.

---

### 23. No HTTP-to-HTTPS redirection in production

**File:** `backend/index.ts`

No redirect middleware for production deployments outside Vercel (which handles this at the platform level).

**Fix:** Add a redirect middleware when `NODE_ENV === 'production'`.

---

### 24. `.env.example` file is missing entirely

**File:** `.env.example`

The file does not exist. Developers have no reference for required environment variables.

**Fix:** Create `.env.example` with all variables: `MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `COOKIE_SECURE`, `COOKIE_SAMESITE`, `PORT`.

---

### 25. `any` types used in catch blocks throughout

**File:** `backend/api/services/auth.service.ts:70`, `:288`

`catch (err: any)` and `account: any` used instead of proper type narrowing.

**Fix:** Replace with `unknown` and proper type narrowing using `instanceof Error` or type guards.
