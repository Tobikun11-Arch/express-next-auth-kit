# Frontend AGENTS.md

## Stack

Next.js 16 App Router, React 19, TypeScript 5, TailwindCSS v4, shadcn/ui, TanStack Query v5, Axios

## Commands

```bash
cd frontend
npm run dev          # Start dev server (port 3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # ESLint
```

## Architecture

```
app/(auth)/         # Public auth pages (sign-in, sign-up, forgot/reset password, verify email)
app/(user)/         # User dashboard — /dashboard (parallel routes: @profile, @settings)
app/(admin)/        # Admin dashboard — /admin/dashboard (parallel routes: @profile, @settings)
app/(public)/       # Public landing page
lib/api/            # Axios HTTP client, auth API calls, error handling
lib/hooks/          # React Query hooks (useMeQuery, useLogout)
lib/auth/           # Redirect utilities
lib/provider/       # ReactQueryProvider
```

## Code Style

- TypeScript strict mode — no `any` types in new code
- Frontend errors go through `getFriendlyErrorMessage()` — never show raw backend messages to users
- React Query hooks in `frontend/lib/hooks/` for all server state
- Use shadcn/ui components from `frontend/components/ui/` — never build form inputs or modals from scratch
- API calls live in `frontend/lib/api/authApi.ts` — keep them centralized

## Error Handling

All API errors are normalized through `frontend/lib/api/httpClient.ts` into this shape:

```ts
type NormalizedApiError = {
  status: number | null;
  code: string;
  message: string;
  details?: unknown;
};
```

The `getFriendlyErrorMessage()` function maps error codes to user-friendly messages. If a new error code is added on the backend, add a mapping here too.

## Route Groups

- `(auth)` — No auth required. Pages here are public.
- `(user)` — Requires authenticated user. Redirects to sign-in if not logged in.
- `(admin)` — Requires admin role. Redirects to user dashboard if not admin.
- `(public)` — No auth required. Landing/marketing pages.

## Dashboard Layouts

Both user and admin dashboards use **parallel routes** (`@profile`, `@settings`) with a sidebar + mobile bottom nav. Tab state is managed via `?tab=` search params.

To add a new tab:
1. Create `@tabname/page.tsx` in the dashboard folder
2. Add the tab to `TABS` array in the dashboard `layout.tsx`
3. Add the slot to `slotByTab` and `DashboardLayoutProps`

## Security Rules

- Never commit `.env` files — only `.env.example` is tracked
- Never log tokens, passwords, or secrets
- All API requests go through `httpClient.ts` (handles auth, refresh, error normalization)
- Do not store tokens in localStorage — cookies are managed by the backend
