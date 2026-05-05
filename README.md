# express-next-auth-kit

A production-ready full-stack boilerplate combining **Next.js 16** and **Express.js**, with a complete authentication system built in — so you can skip the setup and start building.

---

## Features

-  **Full Auth Flow** — Sign up, sign in, forgot password, email verification, and password reset
-  **JWT-based Authentication** — Secure token handling with HTTP-only cookies
-  **Email Service** — Nodemailer-powered transactional emails with HTML templates
-  **Role-based Models** — Separate `User` and `Admin` models with a shared base schema
-  **Rate Limiting & Security** — Helmet, CORS, express-rate-limit, and input sanitization
-  **Validation** — Zod schemas with DTO pattern on the backend
-  **Structured Logging** — Pino logger integration
-  **Testing** — Jest + Supertest setup ready to go
-  **Modern Frontend** — Next.js App Router with shadcn/ui, TailwindCSS v4, and TanStack Query

---

## Project Structure

### Frontend (`/frontend`)

```
frontend/
├── app/
│   ├── (admin)/          # Admin-protected routes
│   ├── (auth)/           # Auth pages (sign-in, sign-up, forgot/reset password, verify email)
│   ├── (public)/         # Public landing page
│   └── (user)/           # Authenticated user routes (dashboard with parallel routes)
├── components/ui/        # shadcn/ui components
└── lib/
    ├── api/              # Axios HTTP client, auth API calls, error handling
    ├── auth/             # Redirect utilities
    ├── hooks/auth/       # useLogout, useMeQuery (TanStack Query)
    └── provider/         # ReactQueryProvider
```

### Backend (`/backend`)

```
backend/
├── api/
│   ├── config/           # DB connection (Mongoose) and environment config
│   ├── controllers/      # Route handlers
│   ├── dtos/             # Zod validation schemas
│   ├── middleware/       # Auth, error handler, rate limit, sanitize, validation
│   ├── models/           # User & Admin models (shared BaseUser schema)
│   ├── repositories/     # Data access layer
│   ├── routes/           # Express router definitions
│   ├── services/         # Business logic (auth, email)
│   ├── templates/        # HTML email templates
│   └── utils/            # Error utilities
└── tests/                # Jest + Supertest integration tests
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)
- SMTP credentials (e.g. Gmail, Resend, Mailtrap)

### 1. Clone the repo

If you just want to use this as a starting point, clone it directly:

```bash
git clone https://github.com/Tobikun11-Arch/express-next-auth-kit.git
cd express-next-auth-kit
```

If you'd like to contribute, **fork the repo first** via the GitHub UI, then clone your fork:
 
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
PORT=5000
MONGODB_URI=mongodb://localhost:27017/your-db
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_password
EMAIL_FROM=no-reply@yourapp.com
```

```bash
npm run dev
```

### 3. Set up the Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Fill in your `.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Auth Flow

| Route | Description |
|---|---|
| `POST /api/auth/register` | Create a new user account |
| `POST /api/auth/login` | Sign in and receive JWT cookie |
| `POST /api/auth/logout` | Clear session |
| `GET  /api/auth/me` | Get current authenticated user |
| `POST /api/auth/forgot-password` | Send password reset email |
| `POST /api/auth/reset-password` | Reset password with token |
| `POST /api/auth/verify-email` | Verify email with OTP code |

---

## Tech Stack

### Frontend

| Package | Purpose |
|---|---|
| Next.js 16 | App Router, SSR, routing |
| React 19 | UI framework |
| TailwindCSS v4 | Utility-first styling |
| shadcn/ui | Accessible component primitives |
| TanStack Query v5 | Server state management |
| Axios | HTTP client |
| input-otp | OTP input for email verification |
| @phosphor-icons/react | Icon library |

### Backend

| Package | Purpose |
|---|---|
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

## Running Tests

```bash
cd backend
npm test
```

---

## Deployment

Both the frontend and backend include configuration for **Vercel** deployment (`vercel.json` in `/backend`). You can deploy them independently or together as a monorepo.

For the backend, make sure to set all environment variables in your Vercel project settings.

---

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

---

## 📄 License

MIT