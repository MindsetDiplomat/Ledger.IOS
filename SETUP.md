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

| Variable | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | client + server | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | client | anon/publishable key (safe to ship) |
| `VITE_SUPABASE_PROJECT_ID` | client | project ref |
| `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` | server | same values, read during SSR |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | privileged writes (never expose) |
| `AI_API_KEY` | server only | OpenAI-compatible API key |
| `AI_BASE_URL` | server | default `https://api.openai.com/v1` |
| `AI_MODEL` | server | default `gpt-4o-mini` |
| `VITE_WHOP_CHECKOUT_URL` | client | Whop checkout link for the $9.99 unlock |

Without `AI_API_KEY` the app still works — `src/lib/ai.server.ts` falls back to a
deterministic, scoring-based diagnostic.

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
    _authenticated/results.$assessmentId.tsx  report + Whop paywall + PDF
    _authenticated/admin.tsx, admin.$assessmentId.tsx  admin review
  lib/
    questions.ts        the 30+ question bank (single source of truth)
    scoring.ts          deterministic scoring + revenue-leakage math
    ai.server.ts        AI diagnostic call + fallback (server only)
    assessment.functions.ts  server functions: load/save/complete/redeem
    admin.functions.ts  server functions for admin views
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
