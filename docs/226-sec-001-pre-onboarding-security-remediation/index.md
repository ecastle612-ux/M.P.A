# 226 — SEC-001 Pre-Onboarding Security Remediation

**Title:** SEC-001 SECURITY REMEDIATION IMPLEMENTED IN-REPO — STOP BEFORE PRODUCTION  
**Status:** **IMPLEMENTED IN-REPO — STOP BEFORE PRODUCTION**  
**Date:** 2026-08-18  
**Authority:** Owner authorization to close docs/225 P0/P1 findings required for safe real-user onboarding.  
**Scope:** Security remediation only. No product features. No money / PM / routing / public-request / SignWell legal semantic change.  
**Stage:** **Stage 1 only.** Stage 2 (Production migration, Vercel WAF apply, Supabase Auth settings, operator MFA, Production deploy) requires a separate Owner authorization.

Authoritative audit: [docs/225](../225-backend-security-firewall-hardening-audit/index.md) (audit branch / PR).

---

## Verdict

**SEC-001 SECURITY REMEDIATION IMPLEMENTED IN-REPO — STOP BEFORE PRODUCTION**

No P0 remains in-repo after this package. Production still has the live SignWell NULL-org write hole and the Owner-dashboard Auth/WAF gaps until Stage 2 is authorized and applied.

**Do not deploy. Do not apply the migration. Do not change Vercel Production WAF. Do not change Supabase Production Auth. Do not require MFA in Production from this package.**

---

## 1. Implementation SHA

Branch `cursor/sec-001-pre-onboarding-security-5acb`. Implementation commit `20775b3e`; Stage 1 verification fixup follows on this same branch. Use `git log -1 --format=%H` on the branch tip after merge review.

---

## 2. Certification path

`docs/226-sec-001-pre-onboarding-security-remediation/index.md`

---

## 3. Migrations

| Stamp | File | Apply now? |
|-------|------|------------|
| `20260818210000` | `supabase/migrations/20260818210000_docs_226_sec_001_security_hardening.sql` | **No.** In-repo only. Stamp is after Production tip `20260818091246` and after later FO-EFF stamps `20260818180000` / `20260818200000` so tightening runs after those tables exist. |

Reversible: policies can be dropped and prior policies restored; rate-limit table can be dropped; no customer rows are deleted.

---

## 4. SignWell RLS before / after

| | Before (Production / `20260806100000`) | After (this migration, when applied) |
|--|----------------------------------------|--------------------------------------|
| Policy | `signwell_webhook_events_manage` `FOR ALL` using `is_org_manager(organization_id) OR organization_id IS NULL` | Policy dropped |
| Client SELECT | Any manager **or** any NULL-org row | Operator SELECT only (`platform_operators` active) |
| Client INSERT/UPDATE/DELETE | Granted via `FOR ALL` + role grants | **Denied** |
| Historical rows | Preserved (0 rows on audit day) | Preserved — no `DELETE FROM` |

Identical NULL-org `FOR ALL` hole on Production-only `auth_support_escalations` (`auth_support_escalations_manage_manager`) is closed when that table exists: client writes revoked; SELECT only for non-null org managers or operators.

---

## 5. Webhook table grants before / after

| Table | Before | After |
|-------|--------|-------|
| `signwell_webhook_events` | anon + authenticated ALL | authenticated SELECT only; writes service-role |
| `saas_stripe_webhook_events` | leftover anon/authenticated ALL grants (operator SELECT policy already present) | INSERT/UPDATE/DELETE/TRUNCATE revoked from client roles |
| `saas_webhook_events` | RLS on, 0 policies, leftover grants | client DML grants revoked |
| `financial_stripe_webhook_events` | RLS deny-by-default | client DML grants revoked (idempotent) |
| `integrations_webhook_events` | screening-admin SELECT (not the write-all P0) | client INSERT/UPDATE/DELETE/TRUNCATE revoked |

Service-role webhook upsert after signature verification is unchanged.

---

## 6. SignWell document correlation fix

Canonical lookup is always `lease_agreements.signwell_document_id = document.id`.

`metadata.lease_id` and `metadata.organization_id` are consistency checks only. They never select another lease.

Mismatch → `{ ok: true, ignored: true, reason: "metadata_mismatch" | "cross_org" }` (fail closed, no activation).  
Unknown document → `{ ok: true, unmatched: true }`.  
No real SignWell document was sent.

---

## 7. Replay behavior

Unchanged and still idempotent:

- `signwell_webhook_events` upsert on `(event_type, document_id, event_id)` with `ignoreDuplicates`
- `activateSignedLease` returns `alreadyActive` when the lease is already active

No replay timestamp window was added (would change webhook semantics). Invalid signatures still never reach service-role persistence.

---

## 8. PM-plan RLS

When `facility_pm_plans` / `facility_pm_occurrences` exist (Production / later FO-EFF):

- Drop `facility_pm_plans_org_all` / `facility_pm_occurrences_org_all` (any active membership `FOR ALL`)
- SELECT: `can_manage_facility_ops` **or** (technician + facility surface)
- WRITE: `can_manage_facility_ops` only

On current `origin/main` the tables are absent — migration no-ops. PM generation via service-role cron is unchanged (RLS bypass). Historical rows preserved.

---

## 9. Routing-rule RLS

When `facility_assignment_rules` / `facility_assignment_rule_evaluations` exist:

- Drop `facility_assignment_rules_org_all` / `facility_assignment_evals_org_all`
- Rules: SELECT+WRITE = `can_manage_facility_ops` only
- Evaluations: SELECT and INSERT = `can_manage_facility_ops` (public request / cron remain service-role)

No second authorization model. Uses the existing FAC-003 helper.

Direct database authorization is the policy contract above; API authorization remains `requireAuthorizedAction` / FO manager JWT. They now agree.

---

## 10. Client-report remediation

`POST /api/observability/client-report`:

1. Persistence eliminated for unauthenticated callers (`persistDurable: false`)
2. Accepted schema is message/name/stack/route only
3. Body cap 8 KB (Content-Length + raw text)
4. PUBLIC durable rate limit (12 / 15 min / IP)
5. Route sanitized; attacker `organizationId` / `userId` ignored
6. Session actor id used only when a real session exists; never from payload
7. No generic anonymous logging table write
8. Existing scrub + no secret logging (STAB-006)

Console / Sentry remain fail-open.

---

## 11. Durable rate-limit architecture

| Layer | Responsibility | Implemented in this package? |
|-------|----------------|------------------------------|
| Vercel edge WAF | Login, forgot/reset, `/request/*`, scanner paths, admin observe, emergency IP block | **Documented only** (Phase G). Do not apply. |
| Supabase Auth | Leaked-password, min length 12, Auth throttling | **Documented only** (Phase F). Do not apply. |
| Application server | Shared `consumeRateLimit` → `consume_platform_rate_limit` RPC + memory fallback | **Yes** |

One limiter implementation. Wrappers (claim-password, commerce session, complimentary claim, client-report, admin search, PM search) call it.

Table `platform_rate_limit_buckets`: RLS on, **no client policies**, grants revoked from anon/authenticated. RPC is SECURITY DEFINER, `search_path = public`, EXECUTE **service_role only**.

Memory fallback when `VITEST` or the table/RPC is not yet applied.

**Do not** put the service role in `middleware.ts`.  
**Do not** rate-limit provider webhooks or PM cron.

---

## 12. Auth rate-limit coverage

| Surface | App | Edge (proposed WAF) | Supabase Auth |
|---------|-----|---------------------|---------------|
| Login (`signInWithPassword`) | Cannot durably limit (client → Supabase) | Rule 1 | Auth throttling (Owner) |
| Forgot / reset pages | Reset enforces min 12 client-side; Auth enforces after dashboard | Rule 1 | Min length 12 (new/reset only) |
| Claim-password | AUTH 8 / 15 min durable | Rule 1 | — |
| Complimentary claim GET/POST | AUTH 8 / 15 min durable | Rule 1 | — |

---

## 13. Public QR rate-limit coverage

`/api/public/request/*` is **not on `origin/main`**. Live Production has process-local 12 / 15 min.

This package exports `consumeRateLimit({ class: "PUBLIC", ... })` for that later surface and documents WAF Rule 2 for `/request/*` and `/api/public/request/*`.

Do not invent a second public-request product path on `main`.

---

## 14. Search rate-limit coverage

| Route | Class | Key |
|-------|-------|-----|
| `/api/admin/search` | ADMIN 60 / 15 min | operator user id |
| `/api/pm/properties/search` | APPLICATION 30 / 15 min | organization id |
| `/api/pm/residents/search` | APPLICATION 30 / 15 min | organization id |

Authorization still runs first.

---

## 15. Master Admin protection

Unchanged server gate: `getUser` + `isPlatformOperatorUser` before any admin search/mutation. Added ADMIN class rate limit on global search. WAF Rule 4 is observe/rate-limit only and does **not** replace server authorization.

---

## 16. Supabase leaked-password configuration status

**NOT CHANGED.** Production advisor was WARN / disabled (docs/225).

Owner Stage 2 steps (do not perform now):

1. Supabase Dashboard → project `mpa-prod` (`vahnmcrpnuggxkivynvo`)
2. Authentication → Attack Protection / Password security
3. Enable **Leaked password protection**
4. Save

---

## 17. Password minimum status

**Application contract is 12** (`MIN_PASSWORD_LENGTH` in `@mpa/shared`). Server validation is authoritative on claim-password and complimentary claim.

**Supabase dashboard minimum is NOT changed** (still the project default until Stage 2).

Changing Supabase minimum password length affects **future password creation and reset only**. Existing shorter passwords continue to sign in. Do not force-reset existing customers.

Owner Stage 2: Authentication → Providers → Email → Minimum password length → **12**. Confirm this is not retroactive before saving.

Sign-in screens do **not** reject existing short passwords.

---

## 18. MFA status

**NOT CHANGED.** Production: 0 MFA factors enrolled (docs/225). SEC-001 does **not** force MFA on tenants/staff.

Owner Stage 2 (platform operator only):

1. Sign in as the single `platform_operators` user
2. Enroll TOTP (Authenticator) in the user account
3. Do **not** enable project-wide MFA required for all users
4. After enrollment, document the operator factor id in the Stage 2 cert

---

## 19. Proposed Vercel WAF rules

Do **not** apply until Owner authorization. Project: `m-p-a-web`. Dashboard: Project → Firewall.

### RULE 1 — AUTH ABUSE

| Field | Value |
|-------|--------|
| Match | Path `/login`, `/forgot-password`, `/reset-password`, `/api/commerce/provision/claim-password`, `/api/complimentary/claim`, `/accept-invitation/*` |
| Action | Rate limit |
| Threshold / window | 20 requests / 1 minute / IP (log 24h, then enforce) |
| Reason | Credential stuffing / claim brute-force |
| False-positive risk | Low–medium (shared NAT). Start with log. |
| Rollback | Disable or raise threshold in Firewall tab |

### RULE 2 — PUBLIC REQUEST ABUSE

| Field | Value |
|-------|--------|
| Match | `/request/*`, `/api/public/request/*` |
| Action | Rate limit |
| Threshold / window | 30 requests / 1 minute / IP |
| Reason | QR / public intake flood |
| False-positive risk | Medium for a lobby iPad. Allowlist that IP if needed. |
| Rollback | Disable rule |

### RULE 3 — SCANNER / EXPLOIT TRAFFIC

| Field | Value |
|-------|--------|
| Match | Path contains `/.env`, `/wp-admin`, `/xmlrpc.php`, `/.git`, `/phpmyadmin`; or method `TRACE` |
| Action | Deny |
| Reason | Automated scanner noise |
| False-positive risk | Very low |
| Rollback | Disable rule |

### RULE 4 — ADMIN ABUSE

| Field | Value |
|-------|--------|
| Match | `/admin`, `/admin/*`, `/api/admin/*` |
| Action | Rate limit + log (do not challenge initially) |
| Threshold / window | 60 requests / 1 minute / IP |
| Reason | Observe operator-surface abuse |
| False-positive risk | Low if only one operator |
| Rollback | Disable rule. **Never** treat WAF as authorization. |

### RULE 5 — EMERGENCY IP BLOCK

| Field | Value |
|-------|--------|
| Match | Exact IP or CIDR (Owner supplies) |
| Action | Deny |
| Procedure | Firewall → IP Blocking → Add → note incident id → screenshot |
| Rollback | Remove the IP block |

---

## 20. Webhook WAF bypass behavior

**Never** attach Rules 1–4 to:

- `POST /api/commerce/webhooks/stripe`
- `POST /api/finance/webhooks/stripe` (FIN-OPS + Connect dual-secret on live)
- `POST /api/leasing/webhooks/signwell`

If a catch-all rate limit is added later, add an allow/bypass for those three paths first. Do not WAF-challenge Stripe or SignWell retries.

PM cron (`Authorization: Bearer CRON_SECRET`) is also exempt from this app limiter.

---

## 21. Next.js version

`16.2.10` → **`16.2.11`** (`next` and `eslint-config-next`). Same supported line. No unrelated dependency upgrades.

GHSA-6gpp-xcg3-4w24 (Turbopack + `i18n.locales`): live HTML uses Turbopack chunks; `next.config.ts` has **no** `i18n`. Patch still applied.

---

## 22. SECURITY DEFINER findings / remediation

| Function | Review | Action |
|----------|--------|--------|
| `apply_facility_stock_movement` | `search_path = public`; `auth.uid()` required; org taken from stock item; writes require `can_manage_facility_ops` or assigned facility WO for usage; anon EXECUTE already revoked; authenticated EXECUTE required (app JWT RPC) | **No rewrite.** Remaining: P2 (intentional RPC) |
| `consume_platform_rate_limit` (new) | `search_path = public`; EXECUTE service_role only | Added |
| Other `finance_m2_*` / helpers | Out of SEC-001 rewrite scope | Classify remaining P2 |

No unrelated database functions were rewritten.

---

## 23. Service-role boundary

- SignWell / Stripe webhooks: service role **after** signature verification only
- Client-report: service-role persist **off** unless a real session exists
- Rate-limit RPC: service role only
- Complimentary / claim-password admin user APIs: unchanged service-role use after validation
- No service role in middleware or browser bundles

---

## 24–31. Tests (adversarial, non-destructive)

| # | Area | Evidence |
|---|------|----------|
| 24 | IDOR / policy | Migration contract: webhook writes and PM/routing writes are not membership-wide |
| 25 | Cross-org | SignWell metadata org mismatch ignored; RLS still org-scoped via existing helpers |
| 26 | Tenant | Tenant membership no longer matches PM/routing write policies |
| 27 | Technician | Technician SELECT on plans/occurrences only; no rule writes |
| 28 | Complete scope | `can_manage_facility_ops` still requires facility surface + manager — Complete without FO surface cannot write |
| 29 | Webhook spoof | Existing + new SignWell tests: invalid hash, missing config, malformed body, metadata mismatch, unknown doc, replay |
| 30 | Public-token | Live `/api/public/request/*` not on `main`; docs/225 identical 404 remains the live contract |
| 31 | Upload | Existing MEDIA-001 MIME/size tests reasserted |

No destructive Production pentest or DDoS was run. Authenticated two-persona live IDOR against customer orgs was **not** run.

---

## 32. Dependency audit

`pnpm audit --prod` after the Next 16.2.11 pin:

- **0 critical**
- **6 high / 3 moderate remaining** (next-bundled postcss, exceljs/uuid, and other transitive advisories)
- Next `16.2.10` GHSA line is closed by the 16.2.11 pin

Unrelated upgrades were not performed.

---

## 33. Typecheck

**PASS** — `pnpm --filter @mpa/shared typecheck` and `pnpm --filter @mpa/web typecheck`.

## 34. Lint

**PASS for SEC-001 files.** `pnpm --filter @mpa/shared lint` is clean. Full `pnpm --filter @mpa/web lint` still reports **pre-existing** complimentary-access hook/`any`/`prefer-const` issues that this package did not introduce.

## 35. Tests

**PASS**

- `@mpa/shared`: 55 files / 355 tests
- `@mpa/web`: 119 files / 578 tests
- Focused: SignWell spoof/correlation/replay, claim-password min-12 + rate limit, complimentary password_too_short, client-report size/org-ignore/rate-limit, durable limiter, docs-226 RLS contract, security regression contracts

## 36. Production build

**PASS** — `pnpm --filter @mpa/web build`

```
▲ Next.js 16.2.11 (Turbopack)
✓ Compiled successfully
```

Turbopack is the production compiler on this line. `next.config.ts` has no `i18n` block.

---

## 37. P0 remaining

**In-repo: none.**

**Production (until Stage 2 apply):** live SignWell NULL-org write hole and leftover webhook grants remain until this migration is applied. Custom WAF still absent.

---

## 38. P1 remaining (after Stage 1 code)

| ID | Item | Owner? |
|----|------|--------|
| P1-1 | Leaked-password protection disabled | Stage 2 dashboard |
| P1-2 | Master Admin MFA not enrolled | Stage 2 operator only |
| P1-5 residual | WAF not applied; public-request limiter not on `main` | Stage 2 + later FO branch wire-up |
| P1-9 | Tenant SELECT of catalogs | Deferred — not SEC-001 write-hole |
| P1-10 | `origin/main` behind Production | Process |
| P1-11 | No webhook-fail / admin-401 alerting | Deferred |
| P1-12 | SaaS webhook `mpa_money_domain` gate | Deferred — money behavior |

---

## 39. P2 deferred

- Tenant/catalog SELECT broadening
- SignWell replay timestamp window
- Remaining `pnpm audit` advisories outside Next 16.2.11
- `apply_facility_stock_movement` remaining as authenticated RPC (intentional)
- NULL-org SELECT-only on `audit_events` / ops scheduler tables
- Automated WAF-as-code

---

## 40. Production changes still requiring Owner authorization

1. Apply migration `20260818210000_docs_226_sec_001_security_hardening.sql` to `mpa-prod`
2. Apply Vercel Firewall Rules 1–5 (with webhook bypass)
3. Enable leaked-password protection on `mpa-prod`
4. Set Auth minimum password length to 12 (confirm non-retroactive)
5. Enroll MFA for the single platform operator (not tenants/staff)
6. Production application deploy of this SHA

Preview (`mpa-preview`) must not be mutated as a substitute for Production apply.

---

## 41. Production safety snapshot

| Action | Done? |
|--------|-------|
| Production Vercel env / Firewall / WAF mutated | **No** |
| Production Supabase Auth / MFA / leaked-password mutated | **No** |
| Production SQL / RLS applied | **No** |
| Stripe prices / Checkout / Connect / tenant pay / AutoPay / FIN-OPS / July freeze / M5 | **No** |
| PM / routing / public-request **semantics** | **No** (RLS only when tables exist) |
| SignWell legal-document semantics | **No** (correlation bind only) |
| Real customer document / payment / manufactured customer | **No** |

---

## 42. Exact Production release procedure (Stage 2 — not authorized)

1. Owner authorizes Stage 2 in a new docs record.
2. Backup / note current `signwell_webhook_events` policy and grants.
3. Apply `20260818210000` to `mpa-prod` only after dry-run on a clone or review.
4. Re-run the grant/policy inspection SQL from docs/225.
5. Deploy this application SHA to Vercel Production.
6. Apply WAF rules with webhook bypass; 24h log-only on Rules 1–2 if preferred.
7. Enable leaked-password protection; set min length 12; enroll operator MFA.
8. Smoke: unsigned SignWell 401; valid replay unmatched/idempotent; login with an existing password still works; claim-password rejects 11-char; client-report 413/429; admin 401.
9. Do not start another feature from that authorize.

---

## 43. Final verdict

**SEC-001 SECURITY REMEDIATION IMPLEMENTED IN-REPO — STOP BEFORE PRODUCTION**
