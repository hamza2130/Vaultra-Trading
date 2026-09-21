# Vaultra Portal

Internal crypto operations portal.

- **Users** (KYC-approved) see live prices and candlestick charts for every USDT coin on Binance
  (view only — no trading), manage their profile and saved TRC20 withdrawal addresses, and submit
  **deposit** and **withdrawal** requests.
- **Admins** review KYC documents, work the deposit/withdrawal queue, manage the platform's deposit
  addresses, edit balances by hand (with a full ledger), see the whole activity history, and
  restrict users (which also blocks their IP addresses).

Built with Next.js 16 (App Router, TypeScript, Tailwind v4) and Supabase (Postgres, Auth, Storage).
Prices come from Binance's public market-data API (no key needed).

> Next.js 16 renamed `middleware.ts` to `proxy.ts` and has other breaking changes — see `AGENTS.md`
> before changing framework-level code.

## Roles and flows

| Who | What they can do |
| --- | --- |
| Visitor | Register (name, email, username, password, ID document). Rejected emails are blocked before reaching the queue. |
| Pending user | Sees a "pending review" screen until an admin approves. |
| Approved user | Markets, coin charts, account, deposits, withdrawals. |
| Restricted user | Locked out; their known public IPs are blocked. |
| Admin | Everything under `/admin`: Users, Requests, Wallets, Balance ledger, History. |

Money rules worth knowing:

- Balances are in USD; USDT and USDC deposits/withdrawals count 1:1.
- Approving a deposit credits the balance. Approving a withdrawal **requires a payout screenshot**
  (shown to the user) and debits the balance. Rejecting a withdrawal **requires a written reason**.
- Balance changes only happen inside locked database functions (`supabase/migrations/0002`,
  `0003`), so the balance, ledger and activity log always change together and a request can never
  be applied twice.

## Local development

Prerequisites: Node.js 20+, and **Docker Desktop** (Supabase runs locally in containers).

```bash
npm install
npx supabase start          # first run downloads several images; prints local URL + keys
cp .env.local.example .env.local   # then paste the printed URL / anon key / service_role key
npx supabase db reset       # applies every migration (schema, security rules, buckets)
npm run dev                 # http://localhost:3000
```

Create a first admin locally: register a user in the app, then in Supabase Studio
(`http://127.0.0.1:54323`) or with SQL:

```sql
update profiles set role = 'admin', kyc_status = 'approved' where email = 'you@example.com';
```

Tips:

- Stop Supabase with `npx supabase stop` before shutting the machine down. After an unclean shutdown
  Postgres re-checks its whole data directory on start, which can take 10+ minutes on a slow disk.
- Local email is captured by Mailpit at `http://127.0.0.1:54324` (the app sends no email today).
- `npm run build` runs a production build; `npx tsc --noEmit` and `npx eslint src` check types/lint.

## Project layout

- `src/app/(app)/` — user panel (Home, Markets, `coin/[symbol]`, Account)
- `src/app/admin/` — admin panel (users, requests, wallets, ledger, history)
- `src/app/{login,register,pending,restricted}/` — sign-in and the KYC gate
- `src/app/api/market/` — Binance price proxy (login required; only known coins are proxied)
- `src/proxy.ts` — per-request routing by sign-in / KYC / role state, plus the IP-block check
- `src/lib/` — Supabase clients, admin guard, upload validation, Binance client, IP helpers
- `supabase/migrations/` — the database (tables, row-level security, money functions, buckets)

## Deploying (Supabase + Vercel)

You need your own Supabase project and Vercel project; nothing here creates them for you.

### 1. Supabase

1. In the dashboard: **Project Settings → API** — note the project URL, the `anon` key, and the
   `service_role` key. The service-role key bypasses all security rules: keep it server-side only.
2. From this repo, link and push the database:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
   This creates the tables, security rules, money functions, and the two **private** storage
   buckets (`kyc-documents`, `payment-proofs`, images/PDF only, 5MB max).
3. **Turn off public sign-ups:** in the dashboard's Authentication settings, disable the
   "Allow new users to sign up" toggle (menu names shift between dashboard versions). Accounts are
   created only by the app's register flow (via the admin API); leaving the public endpoint open
   lets anyone bypass the KYC/blacklist checks. Also set the minimum password length to 8 in the
   same Authentication settings. Verify with:
   ```bash
   curl -X POST "https://<project-ref>.supabase.co/auth/v1/signup" \
     -H "apikey: <anon-key>" -H "Content-Type: application/json" \
     -d '{"email":"probe@example.com","password":"Password123!"}'
   ```
   It must answer `signup_disabled`.
4. Confirm both buckets show as **Private** under Storage.

### 2. Vercel

1. Import the GitHub repo. The Next.js preset needs no changes.
2. Set environment variables (see `.env.local.example`):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`
   (mark this one sensitive).
3. **Pick the Function Region deliberately** (Project Settings → Functions). Binance blocks some
   countries (notably the US) on some endpoints; the app uses `data-api.binance.vision`, which is
   meant for market data, but verify `/api/market/tickers` after the first deploy and switch to a
   region such as Frankfurt or Singapore if prices don't load. Prefer a region near your Supabase
   region to keep database calls fast.
4. Deploy, then run the checklist below.

Licensing note: Vercel's free Hobby plan is for personal, non-commercial use; a company-run tool
handling real deposits belongs on Vercel Pro. Supabase's free tier permits commercial use, but a
free project **pauses after 7 days of inactivity** and has no point-in-time recovery.

### 3. First-run checklist

1. Register your own account on the deployed site.
2. In the Supabase SQL editor, make yourself the first admin:
   ```sql
   update profiles set role = 'admin', kyc_status = 'approved' where email = 'you@company.com';
   ```
3. Sign in, open **Wallets**, and add the real TRC20 deposit address(es). Until you do, users see
   "deposits aren't available yet".
4. Register a second test user and walk the full path: KYC approval → deposit request → approve →
   withdrawal request → fulfill with a proof screenshot.
5. Open a coin page and confirm the chart loads (this exercises the Binance region check above).
6. Check the response headers on any page: `X-Frame-Options: DENY`, `X-Robots-Tag: noindex`.

## Things to know

- **IP blocking is a deterrent, not a guarantee.** It blocks the public IPs a user was seen from;
  a VPN or new network gets around it. Private/loopback addresses and any IP shared with an admin
  are never blocked, and admins can't be restricted.
- **Uploads:** images over ~1.5MB are shrunk in the browser; files are capped at 4MB because Vercel
  rejects request bodies over ~4.5MB. The server checks each file's real contents, not its label.
- **KYC documents and payment proofs are sensitive personal data.** Anyone with access to your
  Supabase dashboard can read them; decide who gets that access and how long to keep documents.
- **Not built:** password reset, email notifications, automated tests, a strict Content-Security-Policy.
  Everything has been verified by hand against a real local database, not by a test suite.
