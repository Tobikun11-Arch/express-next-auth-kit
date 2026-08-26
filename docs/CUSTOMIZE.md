# Customize This Boilerplate

Fill in each field below. An AI agent reading this file can use your answers to update all files automatically.

---

## 1. Project Identity

| What | Your Value | File to Update |
|------|------------|----------------|
| Project name | `________________` | `frontend/package.json`, `backend/package.json` |
| App title | `________________` | `frontend/app/layout.tsx` |
| Logo file | Place at `frontend/public/assets/logo.png` | — |

---

## 2. Backend Environment (`backend/.env`)

### Database

> **Don't have a MongoDB URI?** See [CREDENTIALS.md → MongoDB](./CREDENTIALS.md#1-mongodb-uri) for a step-by-step guide.

| Variable | Your Value |
|----------|------------|
| `MONGO_URI` | `________________` |

### Authentication

> **Don't have JWT secrets?** See [CREDENTIALS.md → JWT Secrets](./CREDENTIALS.md#2-jwt-secrets) to generate them.

| Variable | Your Value |
|----------|------------|
| `JWT_SECRET` | `________________` |
| `JWT_REFRESH_SECRET` | `________________` |

### Email (SMTP)

> **Don't have SMTP credentials?** See [CREDENTIALS.md → SMTP](./CREDENTIALS.md#3-smtp-credentials-email-service) for Gmail, Resend, and Mailtrap guides.

| Variable | Your Value |
|----------|------------|
| `SMTP_HOST` | `________________` |
| `SMTP_PORT` | `________________` |
| `SMTP_USER` | `________________` |
| `SMTP_PASS` | `________________` |
| `SMTP_FROM` | `________________` |

### Cookies

| Variable | Your Value | Options |
|----------|------------|---------|
| `COOKIE_SECURE` | `________________` | `true` (production) / `false` (local) |
| `COOKIE_SAMESITE` | `________________` | `strict` / `lax` / `none` |

### Server

| Variable | Your Value | Default |
|----------|------------|---------|
| `PORT` | `________________` | `5000` |
| `NODE_ENV` | `________________` | `development` |

---

## 3. Admin Account (seeded with `npm run seed:admin`)

| Variable | Your Value | Default |
|----------|------------|---------|
| `SEED_ADMIN_EMAIL` | `________________` | `admin@example.com` |
| `SEED_ADMIN_PASSWORD` | `________________` | `Admin123!` |
| `SEED_ADMIN_FIRST_NAME` | `________________` | `Admin` |
| `SEED_ADMIN_LAST_NAME` | `________________` | `User` |

---

## 4. Frontend Environment (`frontend/.env`)

| Variable | Your Value |
|----------|------------|
| `NEXT_PUBLIC_API_URL` | `________________` |

> Local: `http://localhost:5000/api`
> Production: `https://your-backend.vercel.app/api`

---

## 5. Branding

### Colors

| What | Your Color | Where |
|------|------------|-------|
| User sidebar background | `________________` | `frontend/app/(user)/dashboard/layout.tsx` — search `#2d4a35` |
| User sidebar active | `________________` | Same file — search `#4a7c59` |
| Admin sidebar background | `________________` | `frontend/app/(admin)/admin/dashboard/layout.tsx` — search `#1a1a2e` |
| Admin sidebar active | `________________` | Same file — search `#4a5eff` |

### Content

| What | Your Text | File |
|------|-----------|------|
| Landing page headline | `________________` | `frontend/app/(public)/page.tsx` |
| Landing page description | `________________` | Same file |

---

## 6. Email Templates

| What | Your Text | File |
|------|-----------|------|
| Verification email subject | `________________` | `backend/api/templates/verificationCodeEmail.ts` |
| Verification email body | `________________` | Same file |
| Reset password email subject | `________________` | `backend/api/templates/resetPasswordEmail.ts` |
| Reset password email body | `________________` | Same file |

---

## 7. CORS & Deployment

| What | Your Value | File |
|------|------------|------|
| Production frontend URL | `________________` | `backend/index.ts` — line 16 `origin` array |
| Backend deploy URL | `________________` | `frontend/.env` — `NEXT_PUBLIC_API_URL` |

---

## Agent Instructions

When a user asks for help customizing this boilerplate:

1. **Read this file** — it contains all configurable items
2. **For external credentials** (MongoDB, SMTP, JWT secrets), refer the user to [CREDENTIALS.md](./CREDENTIALS.md)
3. **Ask the user** for any blank `________________` fields
4. **Update the files** after getting the values
5. **After all updates**, tell the user to:
   - Restart both dev servers
   - Run `npm run seed:admin` in `/backend`
   - Test login at `http://localhost:3000`
