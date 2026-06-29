# Improvement Plan

This document outlines all issues found during a full audit of the authentication boilerplate, prioritized by severity.

---

## 🔴 Critical

### 1. Refresh tokens cannot be revoked
**File:** `backend/api/services/auth.service.ts:265-311`

Refresh tokens are pure JWTs with no server-side tracking. If stolen, they remain valid for 7 days with no way to invalidate them.

**Fix:** Implement refresh token rotation (issue a new refresh token on each use and invalidate the old one) and optionally maintain a server-side blocklist for forced logouts.

---

### 2. Forgot-password endpoints are not registered
**File:** `backend/api/routes/auth.routes.ts`

DTOs (`forgotPasswordDto`, `resetPasswordDto`) and service methods (`forgotPassword`, `resetPassword`) exist but are never wired to routes.

**Fix:** Register `POST /auth/forgot-password` and `POST /auth/reset-password` routes.

---

### 3. Shared `verificationCode` field conflates email verification and password reset
**Files:**
- `backend/api/models/base/BaseUser.schema.ts:10-11`
- `backend/api/services/auth.service.ts:189`

Both features use the same `verificationCode` / `verificationExpiry` fields on the user document. A password reset request overwrites any pending email verification code and vice versa.

**Fix:** Add dedicated fields (`resetCode`, `resetExpiry`) to the schema or create a separate tokens collection.

---

### 4. Email enumeration via `resendVerification`
**File:** `backend/api/services/auth.service.ts:131-132`

Returns `USER_NOT_FOUND` when the email does not exist, allowing attackers to probe which emails are registered.

**Fix:** Return a generic success response regardless of whether the email exists (same approach as `forgotPassword`).

---

### 5. Logout does not invalidate tokens
**File:** `backend/api/controllers/auth.controller.ts:122-131`

Clears cookies but does not prevent the JWTs from being used if they are captured elsewhere. Tokens remain valid until expiry.

**Fix:** Maintain an in-memory or Redis blocklist (JTI-based) or implement token rotation that invalidates the previous refresh token.

---

### 6. No request body size limiter
**File:** `backend/index.ts:23`

`express.json()` is called with no `limit` option, allowing oversized payloads.

**Fix:** Add `limit: '10kb'` (or appropriate size) to `express.json()`.

---

## 🟡 High

### 7. Weak password policy
**File:** `backend/api/dtos/auth.dto.ts:7`

Only requires minimum length of 8 characters. No uppercase, lowercase, digit, or special character rules. No breached-password check.

**Fix:** Add character class requirements to the Zod schema. Optionally integrate the Pwned Passwords API (haveibeenpwned.com).

---

### 8. Cookie config bypasses Zod validation
**File:** `backend/api/controllers/auth.controller.ts:12-13`

Reads `COOKIE_SECURE` and `COOKIE_SAMESITE` directly from `process.env` instead of the validated `env` export.

**Fix:** Add `COOKIE_SECURE` and `COOKIE_SAMESITE` to the env schema and import from `env`.

---

### 9. Race condition in `resetPassword`
**File:** `backend/api/services/auth.service.ts:215-216`

Clears the verification code before updating the password hash. If the password update fails, the code is gone and the user cannot retry.

**Fix:** Use a transaction or reverse the order: update password first, then clear the code.

---

### 10. Dead code in `refreshAccessToken`
**File:** `backend/api/services/auth.service.ts:274-292`

Fallback branch queries both user and admin repositories when `tokenType` is missing from the JWT payload, but the token is always signed with a type. This adds unnecessary database queries.

**Fix:** Remove the fallback branch and assume `payload.type` is always present.

---

### 11. Type-unsafe `as any` in `resetPassword`
**File:** `backend/api/services/auth.service.ts:216`

Passes `passwordHash` to `updateProfile` whose type does not accept it.

**Fix:** Accept `passwordHash` in the `updateProfile` parameter type or create a dedicated password update method on the repository.

---

### 12. Hardcoded placeholder CORS origin
**File:** `backend/index.ts:16`

`'your-production-domain.com'` will either block legit requests or allow the wrong origin if forgotten.

**Fix:** Read allowed origins from environment variables with a sensible default for development.

---

### 13. MongoDB duplicate-key error parsing is brittle
**File:** `backend/api/services/auth.service.ts:76-104`

Parsing `err.message` and `err.keyPattern` strings is version-dependent and fragile across MongoDB driver versions.

**Fix:** Check for code `11000` exclusively and use `err.keyValue` instead of string matching.

---

## 🟠 Medium

### 14. SMTP transport created on every email send
**File:** `backend/api/services/email.service.ts:43-51`

Creates a new Nodemailer transporter for each email. Should reuse a singleton.

**Fix:** Create and cache the transporter once, or use a connection pool.

---

### 15. No CSRF protection
Cookie-based auth with `SameSite` is partially protected, but if `COOKIE_SAMESITE=none` is configured there is no CSRF defense.

**Fix:** Implement CSRF tokens for state-changing requests, or keep `SameSite=Strict`/`Lax`.

---

### 16. No request logging middleware
Pino is configured but never used to log incoming HTTP requests (method, URL, status code, duration).

**Fix:** Add a middleware that logs each request using the configured Pino logger.

---

### 17. Inconsistent error code casing
**Files:** `backend/api/services/auth.service.ts` and `backend/api/controllers/auth.controller.ts`

Some codes use `SNAKE_CASE` (`EMAIL_EXISTS`), others use `UPPERCASE` (`UNAUTHORIZED`).

**Fix:** Define an enum or constant object for all error codes and use it consistently.

---

### 18. Duplicate magic strings for cookie names
**Files:**
- `backend/api/controllers/auth.controller.ts:6-7`
- `backend/api/middleware/auth.ts:6`

`dc_access_token` is defined in two places.

**Fix:** Extract to a shared constants file.

---

### 19. Frontend sign-in page is a stub
**File:** `frontend/app/(auth)/sign-in/page.tsx`

Returns a placeholder `<div>SignInPage</div>` with no form implementation.

**Fix:** Implement the login form, wire it to the `login` API function and `useMeQuery`.

---

### 20. Tests are fully commented out
**File:** `backend/tests/auth.test.ts`

No active tests exist.

**Fix:** Implement integration/unit tests covering register, login, refresh, verify, and authorization flows.

---

### 21. Frontend username field mismatch
**Files:**
- `frontend/app/(auth)/sign-up/page.tsx:109` — `required` attribute on username
- `backend/api/dtos/auth.dto.ts:8` — `username` is `optional()`

**Fix:** Align frontend and backend — either make username required in both or optional in both.

---

## 🟢 Low

| # | Issue | File | Fix |
|---|-------|------|-----|
| 22 | `BaseUserDocument` missing `createdAt`/`updatedAt` despite `timestamps: true` | `BaseUser.schema.ts:3-12` | Extend `mongoose.Document` timestamps type |
| 23 | Repository methods use `.exec()` inconsistently | `user.repository.ts` | Standardize all query methods to use `.exec()` |
| 24 | `getCookieOptions` reads `process.env` on every request | `auth.controller.ts:9-16` | Cache or inject configuration |
| 25 | No "change password" endpoint for authenticated users | `auth.service.ts` / `auth.routes.ts` | Add `PUT /auth/password` with current password verification |
| 26 | No HTTP-to-HTTPS redirection in production | `index.ts` | Add a redirect middleware for production |
| 27 | `.env.example` missing SMTP variables | `.env.example` | Add `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` |
| 28 | `any` types used in catch blocks throughout | `auth.service.ts` | Replace with `unknown` and proper type narrowing |
