# Express Next Auth Kit

A production-ready full-stack boilerplate combining **Next.js 16** and **Express.js**, with a complete authentication system built in — so you can skip the setup and start building.

---

## Features

- **Full Auth Flow** — Sign up, sign in, forgot password, email verification, and password reset
- **JWT-based Authentication** — Secure token handling with HTTP-only cookies and token rotation
- **Email Service** — Nodemailer-powered transactional emails with HTML templates
- **Role-based Models** — Separate `User` and `Admin` models with a shared base schema
- **Admin Seed Script** — One command to create an admin account
- **Rate Limiting & Security** — Helmet, CORS, express-rate-limit, body size limits, and input sanitization
- **Validation** — Zod schemas with DTO pattern on the backend
- **Structured Logging** — Pino logger integration
- **Testing** — Jest + Supertest setup ready to go
- **Modern Frontend** — Next.js App Router with shadcn/ui, TailwindCSS v4, and TanStack Query
- **Friendly Error Messages** — Raw backend errors are mapped to user-friendly messages on the frontend

---

## Project Structure

### Frontend (`/frontend`)

```
frontend/
├── app/
│   ├── (admin)/                # Admin-protected routes
│   │   ├── admin/dashboard/    # Admin dashboard with parallel routes
│   │   └── layout.tsx          # Auth guard (redirects non-admins)
│   ├── (auth)/                 # Auth pages
│   │   ├── sign-in/
│   │   ├── sign-up/
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   └── verify-email/
│   ├── (public)/               # Public landing page
│   └── (user)/                 # Authenticated user routes
│       └── dashboard/          # User dashboard with parallel routes (@profile, @settings)
├── components/ui/              # shadcn/ui components
└── lib/
    ├── api/                    # Axios HTTP client, auth API calls, error handling
    │   ├── httpClient.ts       # Axios instance with interceptors and token refresh
    │   ├── authApi.ts          # Auth API functions
    │   └── getFriendlyErrorMessage.ts  # Maps error codes to friendly messages
    ├── auth/                   # Redirect utilities
    ├── hooks/auth/             # useLogout, useMeQuery (TanStack Query)
    └── provider/               # ReactQueryProvider
```

### Backend (`/backend`)

```
backend/
├── api/
│   ├── config/                 # DB connection (Mongoose) and environment config
│   ├── controllers/            # Route handlers
│   ├── dtos/                   # Zod validation schemas
│   ├── middleware/             # Auth, error handler, rate limit, sanitize, validation
│   ├── models/                 # User & Admin models (shared BaseUser schema)
│   │   └── base/              # BaseUser schema with timestamps
│   ├── repositories/           # Data access layer
│   ├── routes/                 # Express router definitions
│   ├── services/               # Business logic (auth, email, blocklist)
│   ├── templates/              # HTML email templates
│   └── utils/                  # Error utilities
├── scripts/
│   └── seed-admin.ts           # Admin seed script
└── tests/                      # Jest + Supertest integration tests
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)
- SMTP credentials (e.g. Gmail, Resend, Mailtrap)

### 1. Clone the repo

```bash
git clone https://github.com/Tobikun11-Arch/express-next-auth-kit.git
cd express-next-auth-kit
```

### 2. Set up the Backend

```bash
cd backend
npm install
cp .env.example .env
```

Fill in your `.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# Auth - generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# Database
MONGO_URI=mongodb://localhost:27017/your-db

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your@email.com
SMTP_PASS=your_app_password
SMTP_FROM=Your App <no-reply@yourapp.com>

# Cookies
COOKIE_SECURE=false
COOKIE_SAMESITE=strict

# Seed Admin (used with `npm run seed:admin`)
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=Admin123!
SEED_ADMIN_FIRST_NAME=Admin
SEED_ADMIN_LAST_NAME=User
```

### 3. Seed the Admin Account

```bash
npm run seed:admin
```

This creates an admin user in your MongoDB `admins` collection. Default credentials are in your `.env` — **change the password after first login**.

You can re-run this command safely — it skips if the admin already exists.

### 4. Start the Backend

```bash
npm run dev
```

Backend runs at `http://localhost:5000`.

### 5. Set up the Frontend

Open a new terminal:

```bash
cd frontend
npm install
cp .env.example .env
```

The default `.env` is already configured for local development:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 6. Start the Frontend

```bash
npm run dev
```

Frontend runs at `http://localhost:3000`.

---

## Login

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@example.com` | `Admin123!` |
| User | Register via `/sign-up` | — |

Admin users are redirected to `/admin/dashboard`. Regular users go to `/dashboard`.

---

## Auth API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create a new user account |
| `POST` | `/api/auth/verify` | Verify email with OTP code |
| `POST` | `/api/auth/resend-verification` | Resend verification code |
| `POST` | `/api/auth/login` | Sign in (returns JWT in HTTP-only cookies) |
| `POST` | `/api/auth/refresh` | Refresh access token |
| `POST` | `/api/auth/logout` | Clear session and revoke refresh token |
| `GET` | `/api/auth/me` | Get current authenticated user |
| `POST` | `/api/auth/forgot-password` | Send password reset code |
| `POST` | `/api/auth/verify-reset-code` | Verify password reset code |
| `POST` | `/api/auth/resend-reset-code` | Resend password reset code |
| `POST` | `/api/auth/reset-password` | Reset password with code |

---

## Tech Stack

### Frontend

| Package | Purpose |
|---------|---------|
| Next.js 16 | App Router, SSR, routing |
| React 19 | UI framework |
| TailwindCSS v4 | Utility-first styling |
| shadcn/ui | Accessible component primitives |
| TanStack Query v5 | Server state management |
| Axios | HTTP client with interceptors |
| input-otp | OTP input for email verification |
| lucide-react | Icon library |

### Backend

| Package | Purpose |
|---------|---------|
| Express.js | HTTP server framework |
| Mongoose | MongoDB ODM |
| jsonwebtoken | JWT creation and verification |
| bcrypt | Password hashing |
| Zod | Schema validation |
| Nodemailer | Transactional email |
| Helmet | HTTP security headers |
| express-rate-limit | API rate limiting |
| Pino | Structured logging |
| Jest + Supertest | Testing |

---

## Available Scripts

### Backend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Start production server |
| `npm run seed:admin` | Seed an admin account |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests with Jest |

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Deployment

Both the frontend and backend include configuration for **Vercel** deployment (`vercel.json` in `/backend`). You can deploy them independently.

For the backend, make sure to set all environment variables in your Vercel project settings.

---

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

---

## License

MIT
