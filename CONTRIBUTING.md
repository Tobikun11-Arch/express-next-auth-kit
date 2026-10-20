# Contributing to Express Next Auth Kit

Thank you for your interest in contributing! This document explains how to get involved.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Branching & Commits](#branching--commits)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Security Issues](#security-issues)

## Code of Conduct

This project follows a standard code of conduct. Be respectful, constructive, and inclusive in all interactions. Harassment, discrimination, or abusive behavior will not be tolerated.

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:

   ```bash
   git clone https://github.com/<your-username>/express-next-auth-kit.git
   cd express-next-auth-kit
   ```

3. Create a feature branch (see [Branching & Commits](#branching--commits)).

## How to Contribute

- **Bug reports** — open an issue with reproduction steps.
- **Feature requests** — open an issue describing the use case and proposed solution.
- **Code changes** — open a pull request. For major changes, open an issue first to discuss.
- **Documentation** — typo fixes and doc improvements are always welcome.

## Development Setup

See the [README](./README.md) for full setup instructions. Quick summary:

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in your values
npm run seed:admin     # optional
npm run dev            # http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev            # http://localhost:3000
```

Prerequisites: Node.js 18+, MongoDB, SMTP credentials.

## Branching & Commits

- Branch from `production`.
- Use descriptive branch names, e.g. `feat/add-mfa`, `fix/token-rotation`.
- Follow the [Conventional Commits](https://www.conventionalcommits.org/) spec — see [`.github/COMMIT_CONVENTION.md`](./.github/COMMIT_CONVENTION.md).
- Keep commits focused and atomic.

## Coding Standards

### General

- TypeScript strict mode — avoid `any` in new code.
- Never commit `.env` files — only `.env.example` is tracked.
- Never log secrets, tokens, or passwords.

### Backend (`backend/`)

- Use the `ApiError` class for all errors: `throw new ApiError(400, 'ERROR_CODE', 'Message')`.
- Use `env` from `api/config/env.ts` — avoid `process.env` directly.
- Validate all request bodies with Zod DTOs in `api/dtos/`.
- Follow the repository pattern: services call repositories, never Mongoose directly.
- Controllers stay thin — validate input, call service, send response.
- All API errors follow the shape `{ success, code, message, details? }`.

### Frontend (`frontend/`)

- Route API calls through `lib/api/authApi.ts` and `httpClient.ts`.
- Normalize errors via `getFriendlyErrorMessage()` — never show raw backend messages.
- Use shadcn/ui components from `components/ui/`.
- React Query hooks live in `lib/hooks/`.

## Testing

Backend tests live in `backend/tests/` (Jest + Supertest). Run them with:

```bash
cd backend
npm test
```

- Add tests for new auth/security logic.
- Assert against the documented error shape.
- Do not commit failing tests.

Frontend has no test suite yet — contributions adding tests are welcome.

## Pull Request Process

1. Ensure your branch is up to date with `production`.
2. Run lint and (backend) tests:

   ```bash
   cd backend && npm run lint && npm test
   cd frontend && npm run lint
   ```

3. Open a PR against `production` with a clear title and description.
4. Link related issues (e.g. `Closes #123`).
5. A maintainer will review; address feedback promptly.
6. Once approved, a maintainer will merge.

## Reporting Bugs

Open a GitHub issue including:

- Expected vs. actual behavior
- Steps to reproduce
- Environment (Node version, OS, browser)
- Relevant logs (redact secrets!)

## Security Issues

**Do not** open public issues for security vulnerabilities. See [SECURITY.md](./SECURITY.md) for responsible disclosure.

## Questions?

Open a discussion or issue — we're happy to help.
