# How to Get Your Credentials

This guide walks you through getting every external credential this boilerplate needs. If you're using an AI agent, it can read this file and guide you step by step.

---

## 1. MongoDB URI

You need a MongoDB database. Two options:

### Option A: MongoDB Atlas (Recommended — Free)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas/database)
2. Sign up for free
3. Create a new cluster (choose the free tier)
4. Go to **Database Access** → Add a new user
   - Username: `your-app-user`
   - Password: generate a strong one
   - Click **Add User**
5. Go to **Network Access** → Add IP Address
   - Click **Allow Access from Anywhere** (for development)
6. Go to **Database** → Click **Connect** on your cluster
7. Choose **Connect your application**
8. Copy the connection string
9. Replace `<password>` with your database user password

Your URI looks like:
```
mongodb+srv://your-app-user:your-password@cluster0.xxxxx.mongodb.net/your-db-name?retryWrites=true&w=majority
```

### Option B: Local MongoDB

1. Install MongoDB Community Edition from [mongodb.com/docs/manual/installation](https://www.mongodb.com/docs/manual/installation/)
2. Start the MongoDB service
3. Your URI is:
```
mongodb://localhost:27017/your-db-name
```

---

## 2. JWT Secrets

These are random strings used to sign your authentication tokens. Never use the same value for both.

### How to generate

Run this command **twice** (once for each secret):

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Or use an online generator like [randomkeygen.com](https://randomkeygen.com/) — choose "CodeIgniter Encryption Keys".

You need two different values:
- `JWT_SECRET` — for access tokens
- `JWT_REFRESH_SECRET` — for refresh tokens

---

## 3. SMTP Credentials (Email Service)

You need an email service to send verification and password reset emails.

### Option A: Gmail (Easiest for development)

1. Go to your Google Account → [myaccount.google.com](https://myaccount.google.com/)
2. Go to **Security** → **2-Step Verification** (enable it if not already)
3. Go to **Security** → **App passwords**
4. Generate a new app password for "Mail"
5. Copy the 16-character password

| Variable | Value |
|----------|-------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `your-email@gmail.com` |
| `SMTP_PASS` | `your-16-char-app-password` |
| `SMTP_FROM` | `Your App Name <your-email@gmail.com>` |

### Option B: Resend (Modern, generous free tier)

1. Go to [resend.com](https://resend.com/)
2. Sign up and add your domain (or use their test domain)
3. Go to **API Keys** → Create new key
4. Copy the key

| Variable | Value |
|----------|-------|
| `SMTP_HOST` | `smtp.resend.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `resend` |
| `SMTP_PASS` | `your-resend-api-key` |
| `SMTP_FROM` | `your@email.com` (must be from verified domain) |

### Option C: Mailtrap (Local testing — no real emails sent)

1. Go to [mailtrap.io](https://mailtrap.io/)
2. Sign up for free
3. Go to **Email Testing** → Get SMTP credentials

| Variable | Value |
|----------|-------|
| `SMTP_HOST` | `smtp.mailtrap.io` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `from mailtrap dashboard` |
| `SMTP_PASS` | `from mailtrap dashboard` |
| `SMTP_FROM` | `test@mailtrap.io` |

---

## 4. Vercel (Production Deployment)

### Backend

1. Go to [vercel.com](https://vercel.com/) and sign up with GitHub
2. Import your repository
3. Set the **root directory** to `backend`
4. In **Environment Variables**, add all your `backend/.env` values
5. Deploy

### Frontend

1. Add another project in Vercel
2. Import the same repository
3. Set the **root directory** to `frontend`
4. In **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL` = `https://your-backend.vercel.app/api`
5. Deploy

---

## Quick Reference

| Credential | Where to get it |
|------------|-----------------|
| MongoDB URI | [MongoDB Atlas](https://www.mongodb.com/atlas/database) (free) |
| JWT Secrets | Generated with Node.js command or [randomkeygen.com](https://randomkeygen.com/) |
| SMTP (Gmail) | Google Account → Security → App passwords |
| SMTP (Resend) | [resend.com](https://resend.com/) — free tier |
| SMTP (Mailtrap) | [mailtrap.io](https://mailtrap.io/) — local testing |
| Vercel | [vercel.com](https://vercel.com/) — deploy frontend + backend |
