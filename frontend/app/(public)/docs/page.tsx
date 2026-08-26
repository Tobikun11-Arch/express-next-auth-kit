import Link from 'next/link';

const SECTIONS = [
  {
    title: 'Quick Start',
    items: [
      'Clone the repo and cd into it',
      'cd backend && npm install && cp .env.example .env',
      'Fill in your .env (see below)',
      'npm run seed:admin — creates an admin account',
      'npm run dev — starts backend on port 5000',
      'In a new terminal: cd frontend && npm install && npm run dev',
      'Open http://localhost:3000'
    ]
  },
  {
    title: 'Environment Variables',
    items: [
      'MONGO_URI — your MongoDB connection string',
      'JWT_SECRET — random string for access tokens',
      'JWT_REFRESH_SECRET — random string for refresh tokens',
      'SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS — email service',
      'NEXT_PUBLIC_API_URL — backend URL (http://localhost:5000/api for local)'
    ]
  },
  {
    title: 'Routes',
    items: [
      '/ — landing page (this page)',
      '/sign-in — login page',
      '/sign-up — register page',
      '/forgot-password — request password reset code',
      '/verify-email — enter verification code',
      '/reset-password — set new password',
      '/dashboard — user dashboard (requires login)',
      '/admin/dashboard — admin dashboard (requires admin role)'
    ]
  },
  {
    title: 'Project Structure',
    items: [
      'frontend/app/(auth)/ — public auth pages',
      'frontend/app/(user)/ — user dashboard with parallel routes',
      'frontend/app/(admin)/ — admin dashboard with parallel routes',
      'frontend/lib/api/ — API client and error handling',
      'backend/api/services/ — business logic',
      'backend/api/repositories/ — database access',
      'backend/api/middleware/ — auth, validation, rate limiting',
      'backend/api/dtos/ — Zod validation schemas'
    ]
  },
  {
    title: 'Customization',
    items: [
      'Open docs/CUSTOMIZE.md in the repo',
      'Fill in your project name, colors, content, and credentials',
      'An AI agent can read that file and update everything for you',
      'See docs/CREDENTIALS.md for help getting MongoDB, SMTP, and JWT secrets'
    ]
  }
];

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Documentation</h1>
        <p className="mt-3 text-gray-500">
          How this boilerplate works and how to get started.
        </p>
      </div>

      <div className="space-y-12">
        {SECTIONS.map(section => (
          <div key={section.title}>
            <h2 className="text-xl font-semibold">{section.title}</h2>
            <ul className="mt-4 space-y-2">
              {section.items.map(item => (
                <li key={item} className="flex gap-3 text-sm text-gray-600">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-xl border border-gray-100 bg-gray-50 p-6">
        <h3 className="font-semibold">Full Guide</h3>
        <p className="mt-2 text-sm text-gray-500">
          For detailed instructions on credentials, deployment, and customization, see
          the files in the <code className="rounded bg-gray-200 px-1.5 py-0.5 font-mono text-xs">docs/</code> folder
          of the repository.
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            href="/"
            className="rounded-full border border-gray-300 px-4 py-2 text-xs font-medium text-black transition-colors hover:bg-gray-100"
          >
            Back to Home
          </Link>
          <a
            href="https://github.com/Tobikun11-Arch/express-next-auth-kit"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-black px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-gray-800"
          >
            View on GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
