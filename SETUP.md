# AI Business Compass™ — Production Export

Complete, self-contained source for the app: React 19 + TanStack Start (SSR) +
Tailwind CSS v4 + Supabase (Postgres/Auth) + an OpenAI-compatible AI diagnostic.

All platform-specific (Lovable) code has been removed, so this runs anywhere
Node 20+ runs: Vercel, Netlify, Cloudflare Workers, Fly, Railway, a VPS, or locally.

## 1. Install

```sh
npm install          # or: pnpm install / bun install
cp .env.example .env  # then fill in every [REPLACE_ME]
npm run dev           # http://localhost:8080
npm run build && npm start   # production build (output in .output/)
```

## 2. Environment variables

See `.env.example`. Values marked `[REPLACE_ME]` are required.

| Variable                                    | Where           | Purpose                                        |
| ------------------------------------------- | --------------- | ---------------------------------------------- |
| `VITE_SUPABASE_URL`                         | client + server | Supabase project URL                           |
| `VITE_SUPABASE_PUBLISHABLE_KEY`             | client          | anon/publishable key (safe to ship)            |
| `VITE_SUPABASE_PROJECT_ID`                  | client          | project ref                                    |
| `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` | server          | same values, read during SSR                   |
| `SUPABASE_SERVICE_ROLE_KEY`                 | server only     | privileged writes (never expose)               |
| `ANTHROPIC_API_KEY`                         | server only     | Claude API key from console.anthropic.com      |
| `ANTHROPIC_MODEL`                           | server          | default `claude-sonnet-5`                      |
| `VITE_WHOP_CHECKOUT_URL`                    | client          | static Whop checkout link, used as a fallback  |
| `WHOP_API_KEY`                              | server only     | Whop Dashboard → Developer → API Keys          |
| `WHOP_ACCOUNT_ID`                           | server only     | your Whop business id, `biz_...`               |
| `WHOP_PLAN_ID`                              | server only     | the $9.99 one-time plan id, `plan_...`         |
| `WHOP_WEBHOOK_SECRET`                       | server only     | signing secret for the webhook below, `ws_...` |

Without `ANTHROPIC_API_KEY` the app still works — `src/lib/ai.server.ts` falls back to a
deterministic, scoring-based diagnostic.

### Automated Whop checkout (no `ANTHROPIC_API_KEY` needed for this part)

The "Unlock for $9.99" button creates a per-report Whop checkout (via `checkoutConfigurations.create`,
tagging it with `metadata.assessment_id`) and redirects the buyer there. A webhook listens for
`payment.succeeded` and flips `reports.has_premium` for that report automatically — no manual
access-code step required. If `WHOP_API_KEY`/`WHOP_ACCOUNT_ID`/`WHOP_PLAN_ID` aren't set yet, the
button falls back to opening the static `VITE_WHOP_CHECKOUT_URL` link and the existing manual
access-code redemption box still works as a backup.

To wire it up in the Whop dashboard:

1. **API key**: Developer → API Keys → create one → `WHOP_API_KEY`.
2. **Account id**: your business id (`biz_...`) → `WHOP_ACCOUNT_ID`.
3. **Plan id**: Products → your $9.99 one-time product's plan (`plan_...`) → `WHOP_PLAN_ID`.
4. **Webhook**: Developer → Webhooks → Create webhook → URL `https://<your-domain>/api/webhooks/whop`,
   subscribe to `payment.succeeded` → copy the signing secret → `WHOP_WEBHOOK_SECRET`.

## 3. Database

Create a Supabase project (or any Postgres with Supabase Auth), then run:

```sh
psql "$DATABASE_URL" -f db/schema.sql
```

`db/schema.sql` is the full schema: `profiles`, `user_roles` (+ `has_role()`
security-definer function), `assessments`, `assessment_responses`, `reports`,
`access_codes` — including GRANTs, RLS enablement and all policies.

Auth setup in Supabase:

1. Enable Email provider (leave "confirm email" on for production).
2. Enable Google provider and add your OAuth client id/secret.
3. Add your site URL + `/*` to the allowed redirect URLs.

Make yourself admin:

```sql
insert into public.user_roles (user_id, role)
values ('[REPLACE_ME_YOUR_AUTH_USER_UUID]', 'admin');
```

Issue paid access codes (redeemed on the results page after Whop checkout):

```sql
insert into public.access_codes (code) values ('COMPASS-XXXX-XXXX');
```

## 4. Project map

```
src/
  routes/
    __root.tsx                     shell: html, fonts, theme, toaster, auth listener
    index.tsx                      marketing landing page
    auth.tsx                       sign in / sign up / Google OAuth / reset
    reset-password.tsx             password recovery
    _authenticated/route.tsx       auth gate (redirects to /auth)
    _authenticated/dashboard.tsx   score + revenue-leakage summary
    _authenticated/assessment.tsx  one-question-per-screen diagnostic
    _authenticated/results.$assessmentId.tsx  report + Whop paywall + PDF download
    _authenticated/admin.tsx, admin.$assessmentId.tsx  admin review + aggregate stats
  lib/
    questions.ts        the 30+ question bank (single source of truth)
    scoring.ts          deterministic scoring + revenue-leakage math
    ai.server.ts         Claude API diagnostic call + fallback (server only)
    whop.server.ts        Whop checkout creation + webhook handler (server only)
    pdf.ts                 client-side "Business Snapshot" PDF generator
    theme.functions.ts   server functions for the per-account theme preference
    assessment.functions.ts  server functions: load/save/complete/redeem/checkout
    admin.functions.ts  server functions for admin views
  server.ts              raw fetch entry — also routes POST /api/webhooks/whop
  components/
    layout/, brand/, assessment/, ui/   design system + shadcn primitives
  integrations/supabase/  browser client, server client, auth middleware, types
  styles.css            ALL CSS: design tokens, gold gradients, glassmorphism
db/schema.sql           full database schema + RLS
```

- **All CSS** lives in `src/styles.css` (Tailwind v4 `@theme` tokens — no
  `tailwind.config.js` needed). Colors are semantic tokens; dark is default and
  the toggle is in `src/components/theme-provider.tsx`.
- **All JS/TS functionality** is in `src/lib` (pure logic) and
  `src/**/*.functions.ts` (server RPC via `createServerFn`).

## 5. Deploying

TanStack Start builds a Nitro server. `npm run build` then:

- **Vercel / Netlify**: import the repo, framework preset "Vite", set env vars.
- **Cloudflare Workers**: default target already configured by Nitro.
- **Node host**: `node .output/server/index.mjs`.

Set every server-side env var in the host's dashboard — `.env` is not deployed.

## 6. Notes

- `src/lib/lovable-error-reporting.ts` is a harmless no-op outside the Lovable
  editor (it only calls optional `window` hooks). Delete it and its import in
  `__root.tsx` if you prefer.
- Regenerate Supabase types after schema changes:
  `npx supabase gen types typescript --project-id <ref> > src/integrations/supabase/types.ts`
