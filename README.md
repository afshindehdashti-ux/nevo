# NEVO Industrial

TanStack Start + React + TypeScript application for NEVO Industrial's public site, admin backoffice, CRM, and ERP-style operating workflows.

## Stack

- React 19, TypeScript, TanStack Start / TanStack Router
- Vite through `@lovable.dev/vite-tanstack-config`
- Tailwind CSS and Radix UI components
- Supabase Auth, Postgres, RLS-backed APIs, and server-side admin operations
- Lovable AI Gateway, Lovable email webhooks, and queued transactional email
- Vitest, Playwright, ESLint, Prettier

## Local Preview / Live Stream

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Then open the local URL printed by Vite, usually `http://localhost:5173`.

## Verification

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Some scripts require connected Supabase/Lovable services and may need deployed or seeded environments.

## Required Environment Variables

See `.env.example` for the current list. Important server-only values include:

- `SUPABASE_SERVICE_ROLE_KEY`: server-only, never exposed to browser code.
- `LOVABLE_API_KEY`: used for Lovable AI Gateway and webhook verification.
- `NEVO_BOOTSTRAP_TOKEN`: one-time token required by the first Super Admin bootstrap endpoint.
- `API_ALLOWED_ORIGINS`: comma-separated origins allowed to call public browser-facing APIs.

## Backend Security Notes

- Public endpoints should use shared helpers from `src/lib/api-security.ts` for origin checks, JSON errors, and rate limiting.
- Service-role Supabase access must stay in server-only modules or dynamic imports inside server handlers.
- User-scoped admin APIs should prefer a per-request Supabase client with the caller's bearer token so RLS remains the authorization boundary.
- Webhooks must verify signatures before trusting payloads.
- The first-admin bootstrap endpoint is intentionally public but requires `NEVO_BOOTSTRAP_TOKEN` and self-disables once a `super_admin` role exists.
