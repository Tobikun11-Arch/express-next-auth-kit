# Customize This Boilerplate

Fill in each field below with your own values. An AI agent reading this file can use your answers to update all files automatically.

> **Note:** After filling in all the fields with your own values, mention this file to your AI agent (e.g. "use the values in CUSTOMIZE.md to update the project") so it can apply the changes across the codebase.

---

## 1. Project Identity

Project name: ___________
  → updates: frontend/package.json "name", backend/package.json "name"

App title: ___________
  → updates: frontend/app/layout.tsx (used in <title> and metadata for SEO)

App description: ___________
  → updates: frontend/app/layout.tsx (used in metadata.description for SEO)

App URL (optional): ___________
  → updates: frontend/app/layout.tsx (used in metadata.openGraph.url and metadata.twitter)
  → only fill this when you have a deployed URL

Logo file (optional): place your file at frontend/public/assets/logo.png
  → only fill this when you have
---

## 2. Backend Environment (backend/.env)

### Database

MONGO_URI: ___________
  → see: docs/CREDENTIALS.md #1-mongodb-uri for help getting this

### Authentication

JWT_SECRET: ___________
  → generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  → see: docs/CREDENTIALS.md #2-jwt-secrets

JWT_REFRESH_SECRET: ___________
  → generate with the same command above (use a different value)

### Email (SMTP)

SMTP_HOST: ___________
SMTP_PORT: ___________
SMTP_USER: ___________
SMTP_PASS: ___________
SMTP_FROM: ___________
  → see: docs/CREDENTIALS.md #3-smtp-credentials-email-service for Gmail, Resend, or Mailtrap

### Cookies

COOKIE_SECURE (optional): false
  → options: true (production) / false (local)
  → default: false

COOKIE_SAMESITE (optional): strict
  → options: strict / lax / none
  → default: strict

### Server

PORT (optional): 5000
  → default: 5000

NODE_ENV (optional): development
  → options: development / production
  → default: development

---

## 3. Admin Account (seeded with npm run seed:admin)

SEED_ADMIN_EMAIL: ___________
  → e.g admin@example.com

SEED_ADMIN_PASSWORD: ___________
  → e.g admin123

SEED_ADMIN_FIRST_NAME (optional): Admin
  → default: Admin

SEED_ADMIN_LAST_NAME (optional): Test
  → default: Test

---

## 4. Frontend Environment (frontend/.env)

NEXT_PUBLIC_API_URL: http://localhost:5000/api
  → local default: http://localhost:5000/api
  → change to production URL when deploying

---

## 5. Branding (optional)

All colors below have working defaults. Only fill these in if you want to customize.


---

## 6. Email Templates (optional)

All email templates have working defaults. Only fill these in if you want to customize.

Verification email subject (optional): ___________
  → updates: backend/api/templates/verificationCodeEmail.ts

Verification email body (optional): ___________
  → updates: same file

Reset password email subject (optional): ___________
  → updates: backend/api/templates/resetPasswordEmail.ts

Reset password email body (optional): ___________
  → updates: same file

---

## 7. CORS & Deployment (optional)

Only fill these when you are ready to deploy.

Production frontend URL: ___________
  → updates: backend/index.ts line 16 (origin array)

Backend deploy URL: ___________
  → updates: frontend/.env NEXT_PUBLIC_API_URL

---

## Agent Instructions

When a user asks for help customizing this boilerplate:

1. Read this file — it contains all configurable items
2. For external credentials (MongoDB, SMTP, JWT secrets), refer the user to docs/CREDENTIALS.md
3. Ask the user for any blank ___________ fields (skip fields marked optional unless the user provides them)
4. Update the files after getting the values
5. If the user provided a project name and description, update the SEO metadata in frontend/app/layout.tsx (title, description, openGraph, twitter)
6. After all updates, tell the user to:
   - Restart both dev servers
   - Run npm run seed:admin in /backend
   - Test login at http://localhost:3000
