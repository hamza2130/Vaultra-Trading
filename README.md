# Vaultra Portal

Internal crypto operations portal — KYC-gated user panel (view-only prices/charts, deposit &
withdraw requests) and an admin panel (KYC review, request queue, wallets, manual balance
ledger). Built with Next.js (App Router, TypeScript, Tailwind) + Supabase (Postgres, Auth,
Storage).

## Prerequisites

- Node.js 20+ (already installed)
- **Docker Desktop** — required to run Supabase locally. Install it from
  [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/), then
  make sure it's running before the steps below.

## First-time setup

```bash
npm install
npx supabase start
```

`supabase start` prints an API URL, anon key, and service role key. Copy `.env.local.example` to
`.env.local` and fill those in:

```bash
cp .env.local.example .env.local
```

Then apply the schema (tables, RLS policies, storage buckets):

```bash
npx supabase db reset
```

Run the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Registering a user creates a `pending`
account — promote it to admin from Supabase Studio (printed by `supabase start`, usually
[http://127.0.0.1:54323](http://127.0.0.1:54323)) by setting that user's `profiles.role` to
`'admin'` and `kyc_status` to `'approved'` so you can reach `/admin`.

## Project layout

- `src/app/(app)/*` — user panel (Home, Markets, Account), gated by KYC approval
- `src/app/admin/*` — admin panel, gated by `profiles.role = 'admin'`
- `src/app/{login,register,pending,restricted}` — auth + KYC-gate flow
- `src/proxy.ts` — request-time auth/KYC/role routing and IP-block check (Next.js 16 renamed
  `middleware.ts` to `proxy.ts` — see `AGENTS.md`)
- `src/lib/supabase/` — browser/server/admin (service-role) Supabase clients
- `supabase/migrations/0001_init.sql` — full schema + RLS policies

## Deploying for real

When ready to go live, create a Supabase project (dashboard) and a Vercel project of your own —
this repo doesn't create third-party accounts for you. Push the migration with
`npx supabase db push` against the linked project, and set the same env vars from
`.env.local.example` in Vercel's project settings.
