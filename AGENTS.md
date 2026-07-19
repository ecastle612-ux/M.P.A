# AGENTS.md

## Cursor Cloud specific instructions

M.P.A. is a pnpm + Turborepo monorepo (Node 22, pnpm 11). Standard commands live in
the root `README.md` and `package.json` scripts: `pnpm lint`, `pnpm typecheck`,
`pnpm build`, `pnpm test`, `pnpm dev`, plus `pnpm check:boundaries`,
`pnpm check:circular`, and `pnpm deps:validate`. The startup update script already runs
`pnpm install`.

### Services

- `apps/web` (`@mpa/web`) — the real product: Next.js 16 (App Router, Turbopack) with
  Supabase-backed auth. Runs on http://localhost:3000 via `pnpm --filter @mpa/web dev`
  (or `pnpm dev`).
- `apps/mobile` — placeholder only; every script just echoes. Nothing to run.
- `packages/*` (`shared`, `ui`, `supabase`, `email`, `config`) — libraries used by the
  web app. `@mpa/shared` holds the only unit tests (vitest), run via `pnpm test`.
- `supabase/` — local backend (config, migrations, edge functions). Requires the
  Supabase CLI **and** Docker, neither of which is preinstalled. `supabase start`
  applies the migrations and brings up Postgres/GoTrue/Studio on ports 54321-54324.

### Non-obvious caveats

- `apps/web` needs an env file. `apps/web/.env.local` is gitignored, so create it before
  running dev/build/typecheck. The dummy values from `.github/workflows/ci.yml` are
  enough for lint/typecheck/build/test and to render every page in the dev server; only
  live auth calls need a real backend.
- Strict CSP: `apps/web/next.config.ts` sets `connect-src 'self' https: wss:`. The
  browser Supabase client therefore CANNOT reach a plain-`http://` Supabase (e.g.
  `http://127.0.0.1:54321` from `supabase start`) — the request fails with
  "Failed to fetch". Use a hosted `https://` Supabase, or put an HTTPS reverse proxy
  with a browser-trusted cert (e.g. mkcert + nginx) in front of the local stack and set
  `NEXT_PUBLIC_SUPABASE_URL` to the https URL. When the Next server itself must call a
  self-signed local Supabase, launch it with `NODE_EXTRA_CA_CERTS=<mkcert rootCA.pem>`.
- Known auth limitation (application code, not the environment): the browser client in
  `apps/web/src/lib/auth/client.ts` does not pass `cookieOptions.name`, so it persists
  the session under the default `sb-<ref>-auth-token` cookie, while the server client and
  `middleware.ts` read `mpa_session`. As a result, UI sign-in obtains a valid Supabase
  session in the browser, but the server/middleware do not recognize it and protected
  routes (`/dashboard`, `/portal`, `/profile`) redirect back to `/login`. Account
  sign-up works end-to-end. Do not "fix" this without going through the repo's
  Design → Document → Approve implementation gate.
