import Link from 'next/link';

const FEATURES = [
  {
    title: 'Auth System',
    description: 'Sign up, sign in, email verification, forgot & reset password — all built in.'
  },
  {
    title: 'JWT + Cookies',
    description: 'HTTP-only cookies with token rotation and refresh token revocation.'
  },
  {
    title: 'Role-based Access',
    description: 'Separate User and Admin dashboards with protected routes and auth guards.'
  },
  {
    title: 'Email Service',
    description: 'Nodemailer-powered transactional emails with customizable HTML templates.'
  },
  {
    title: 'Input Validation',
    description: 'Zod schemas on every endpoint. No bad data reaches your database.'
  },
  {
    title: 'Security Basics',
    description: 'Helmet, CORS, rate limiting, body size limits, and NoSQL injection prevention.'
  }
];

const STACK = [
  { name: 'Next.js 16', role: 'Frontend' },
  { name: 'React 19', role: 'UI' },
  { name: 'TypeScript', role: 'Language' },
  { name: 'TailwindCSS v4', role: 'Styling' },
  { name: 'shadcn/ui', role: 'Components' },
  { name: 'TanStack Query', role: 'State' },
  { name: 'Express.js', role: 'Backend' },
  { name: 'Mongoose', role: 'Database' },
  { name: 'Zod', role: 'Validation' },
  { name: 'JWT', role: 'Auth' },
  { name: 'bcrypt', role: 'Passwords' },
  { name: 'Nodemailer', role: 'Email' }
];

const STRUCTURE = [
  { path: 'frontend/app/(auth)/', desc: 'Sign in, sign up, forgot password, verify email' },
  { path: 'frontend/app/(user)/', desc: 'User dashboard with profile and settings' },
  { path: 'frontend/app/(admin)/', desc: 'Admin dashboard with overview and settings' },
  { path: 'frontend/lib/api/', desc: 'Centralized API client with interceptors' },
  { path: 'backend/api/services/', desc: 'Business logic layer' },
  { path: 'backend/api/repositories/', desc: 'Data access layer (Mongoose)' },
  { path: 'backend/api/middleware/', desc: 'Auth, validation, rate limiting, error handling' },
  { path: 'backend/api/dtos/', desc: 'Zod validation schemas' }
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 pt-32 pb-20 text-center">
        <div className="mb-6 inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-xs text-gray-600">
          Open source boilerplate
        </div>
        <h1 className="max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
          Next.js + Express
          <br />
          <span className="text-gray-400">Auth Kit</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-gray-500">
          A full-stack authentication boilerplate with JWT, role-based access, email
          verification, and a clean project structure. Skip the setup, start building.
        </p>
        <div className="mt-10 flex gap-4">
          <Link
            href="/sign-up"
            className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
          >
            Get Started
          </Link>
          <a
            href="https://github.com/Tobikun11-Arch/express-next-auth-kit"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-gray-300 px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-gray-50"
          >
            GitHub
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-gray-100 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Everything you need
          </h2>
          <p className="mt-3 text-center text-gray-500">
            A complete auth system so you can focus on your product.
          </p>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(f => (
              <div key={f.title} className="rounded-xl border border-gray-100 p-6">
                <h3 className="text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="border-t border-gray-100 bg-gray-50 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold tracking-tight">Tech Stack</h2>
          <p className="mt-3 text-center text-gray-500">
            Modern tools, battle-tested libraries.
          </p>
          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {STACK.map(s => (
              <div
                key={s.name}
                className="rounded-lg border border-gray-200 bg-white px-4 py-3"
              >
                <span className="text-sm font-medium">{s.name}</span>
                <span className="ml-2 text-xs text-gray-400">{s.role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Structure */}
      <section className="border-t border-gray-100 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Clean Structure
          </h2>
          <p className="mt-3 text-center text-gray-500">
            Organized by concern. Easy to scale.
          </p>
          <div className="mt-16 space-y-3">
            {STRUCTURE.map(s => (
              <div
                key={s.path}
                className="flex flex-col gap-1 rounded-lg border border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:gap-4"
              >
                <code className="shrink-0 font-mono text-sm text-black">{s.path}</code>
                <span className="text-sm text-gray-500">{s.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CI/CD */}
      <section className="border-t border-gray-100 bg-gray-50 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            CI/CD Ready
          </h2>
          <p className="mt-3 text-center text-gray-500">
            GitHub Actions workflows included. Push and deploy.
          </p>
          <div className="mt-16 grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="text-base font-semibold">Frontend</h3>
              <p className="mt-2 text-sm text-gray-500">
                Lint, type-check, and build on every push. Auto-deploy to Vercel on
                merge to production.
              </p>
              <code className="mt-4 inline-block rounded-md bg-gray-100 px-3 py-1.5 font-mono text-xs text-gray-600">
                .github/workflows/frontend.yml
              </code>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="text-base font-semibold">Backend</h3>
              <p className="mt-2 text-sm text-gray-500">
                Lint, type-check, build, and run tests on every push. Auto-deploy to
                Vercel on merge to production.
              </p>
              <code className="mt-4 inline-block rounded-md bg-gray-100 px-3 py-1.5 font-mono text-xs text-gray-600">
                .github/workflows/backend.yml
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-100 px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Ready to start?</h2>
          <p className="mt-4 text-gray-500">
            Clone the repo, fill in your env variables, seed an admin, and you&apos;re
            running in under 5 minutes.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/sign-in"
              className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="rounded-full border border-gray-300 px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-gray-50"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-gray-400">
            Express Next Auth Kit — MIT License
          </p>
          <div className="flex gap-6">
            <a
              href="https://github.com/Tobikun11-Arch/express-next-auth-kit"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-black"
            >
              GitHub
            </a>
            <Link href="/sign-in" className="text-sm text-gray-400 hover:text-black">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
