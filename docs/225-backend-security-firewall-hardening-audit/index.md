# 225 — Backend Security / Firewall / Hardening Audit

**Title:** M.P.A. BACKEND SECURITY / FIREWALL / HARDENING AUDIT  
**Status:** **SECURITY HARDENING CONDITIONAL — REMEDIATION REQUIRED**  
**Date:** 2026-08-18  
**Authority:** Owner authorization to audit Production security posture before broad real-user onboarding. **Not a feature package.**  
**Scope:** Current Production architecture (live app + `mpa-prod` schema + `origin/main` in-repo controls).  
**Constraint:** No Production configuration mutation. No Stripe / Connect / FIN-OPS / M5 / July freeze / SignWell lifecycle / public-request / routing / PM behavior change from this package.

---

## Verdict

**SECURITY HARDENING CONDITIONAL — REMEDIATION REQUIRED**

M.P.A. already has a real defense-in-depth core: Vercel is the application edge with platform DDoS and HSTS; session cookies are `HttpOnly` + `SameSite=Lax` + `Secure` in production; Master Admin is server-gated; public QR tokens are high-entropy and hashed; unsigned webhooks are rejected; unauthenticated sensitive APIs return 401/403. That is not enough to call the estate ready for Owner firewall configuration as a **pass**.

Two Production facts block a pass:

1. **`signwell_webhook_events` is world-writable for NULL-org rows.** RLS policy `is_org_manager(organization_id) OR organization_id IS NULL` is granted to `anon` and `authenticated` for ALL commands. Zero rows exist today; the policy is still exploitable.
2. **Custom Vercel WAF / rate-limit rules are not confirmed active.** Platform DDoS is automatic. Application rate limits are process-local `Map`s and do not cover login. Broad onboarding without an Owner-applied WAF ruleset leaves brute-force, credential stuffing, and public-intake floods to a single serverless instance.

Smallest package that removes the most risk before onboarding: **P0 SignWell RLS revoke + Owner Vercel WAF ruleset + Supabase leaked-password protection + Next 16.2.11 patch.** Do not treat this document as formal ASVS certification.

---

## Production safety snapshot (this audit)

| Action | Done? |
|--------|-------|
| Production Vercel env / Firewall / WAF mutated | **No** |
| Production Supabase Auth / MFA / leaked-password settings mutated | **No** |
| Production secrets rotated | **No** |
| Production SQL / RLS applied | **No** (read-only `execute_sql` + advisors) |
| Stripe / Connect / FIN-OPS / tenant money execution changed | **No** |
| SignWell lifecycle changed | **No** |
| Public request / routing / PM generation behavior changed | **No** |
| Destructive DDoS testing | **No** |

---

## Evidence baseline

| Item | Value |
|------|--------|
| Audit date (UTC) | 2026-08-18 |
| `origin/main` SHA | `b30567e3` (docs/187 complimentary release) |
| Live Production deployment | `dpl_HZL1bktWfaHE6E94Pe4n62J6Vy2q` |
| Live aliases | `www.my-property-assistant.com`, `my-property-assistant.com` |
| Live app vs `main` | **Production is ahead of `main`.** `/request/[token]`, `/api/public/request/*`, `/api/facility/preventive-maintenance/generate`, Connect dual-secret verification, AutoPay, assignment rules, and PM plans are live. Highest live schema stamp: `20260818091246` / `docs_221_fo_eff_slice6_routing`. Highest open docs number on GitHub: **224**. This record is **225**. |
| Supabase Production | `mpa-prod` / `vahnmcrpnuggxkivynvo` / us-west-2 / Postgres 17.6.1.141 / `ACTIVE_HEALTHY` |
| Supabase Preview | `mpa-preview` / `drcbipqrxfqpjilsfxip` (not mutated) |
| Vercel MCP | **Unauthenticated in this environment** — custom WAF rules cannot be listed from the dashboard API |
| Auth users (prod) | 40 (`auth.users`) |
| MFA factors enrolled | **0** (`auth.mfa_factors`) |
| Platform operators | 1 |

---

## 1. Current Production architecture

```
Browser / bot
    │
    ▼
Cloudflare DNS + email routing only
(NS: nile.ns.cloudflare.com / blakely.ns.cloudflare.com)
    │  A/AAAA → 76.76.21.21 (Vercel anycast)
    ▼
Vercel application edge  (server: Vercel; no cf-* headers)
  • Platform DDoS (automatic)
  • HSTS max-age=63072000 (platform)
  • App security headers from next.config.ts
  • Custom WAF / rate-limit rules: NOT CONFIRMED
    │
    ├── Next.js App Router (Turbopack chunks on live HTML)
    │     Auth cookies via @supabase/ssr
    │     requireAuthorizedAction (auth → org → role → SKU → scope → permission)
    │
    ├── Supabase Auth / Postgres / Storage (mpa-prod)
    ├── Stripe SaaS + Stripe FIN-OPS + Stripe Connect (separate webhook secrets in code)
    ├── Resend (outbound email; no inbound webhook route)
    └── SignWell (HMAC webhook)
```

Commercial flow is unchanged: Landing → Choose Product → Monthly/Annual → Stripe Checkout → Create Account → Guided Setup → Mission Control.

---

## 2. Application edge / firewall status

| Check | Result |
|-------|--------|
| Who terminates TLS / serves HTML | **Vercel** (`server: Vercel`, `x-vercel-id`) |
| Cloudflare proxied (orange-cloud) | **No.** DNS is Cloudflare-hosted; A record is Vercel `76.76.21.21`. No `cf-ray` / `cf-cache-status`. |
| Cloudflare WAF protects the app | **No.** Cloudflare is DNS + email routing only. |
| Application edge WAF strategy | **Vercel Firewall.** Do not add a second reverse proxy unless later approved. |

---

## 3. Vercel Firewall status

| Capability | Observed | Notes |
|------------|----------|-------|
| Platform-wide Firewall / DDoS | **Active (platform default)** | Vercel documents L3/L4/L7 mitigation for every plan with no config. Cannot be disabled by this app. |
| Vercel Firewall project tab / custom WAF | **Not confirmed** | Vercel MCP `needsAuth`. No `vercel.json` firewall config in repo. **Do not assume custom rules exist.** |
| WAF custom rules | **Unknown / treat as absent** | Owner must open Project → Firewall and screenshot the rule list. |
| Rate limiting (Vercel WAF) | **Unknown / treat as absent** | Priced on Pro+; Fixed Window available. App-level limits exist only on a few public commerce/request routes. |
| IP blocking | **Unknown / treat as absent** | Available on all plans; no in-repo procedure yet. |
| Bot / challenge | **Attack Mode available (Owner action)** | Not enabled from this audit. Do not enable Attack Mode as a standing control — it challenges legitimate users. |
| Traffic / security observability | **Partial** | Vercel logs + `x-vercel-id`. No confirmed Firewall analytics subscription. Sentry DSN may or may not be set (not read). |

---

## 4. DDoS status

Vercel automatically mitigates volumetric L3/L4/L7 floods at the platform edge for all deployments. That is **not** a substitute for:

- login brute-force limits
- public `/api/public/request/*` flood limits that survive multi-instance
- webhook-safe exceptions so Stripe/SignWell retries are not challenged

No destructive flood test was run.

---

## 5. Current WAF rules

**None confirmed.** In-repo: no Firewall-as-code. Live: no Cloudflare WAF in path. Treat current custom WAF ruleset as **empty** until Owner exports the Vercel Firewall tab.

---

## 6. Rate-limit status

| Surface | In-repo / live | Key | Window | Threshold | Shared across instances? |
|---------|----------------|-----|--------|-----------|--------------------------|
| Login / password / reset | **None in app** | — | — | Relies on Supabase Auth defaults | n/a |
| Complimentary claim | Generic invalid token; **no dedicated limiter** | token | — | — | — |
| Commerce checkout session / provision status | 30 / 15 min | `IP:sessionId` | 15 min | 30 | **No** (process `Map`) |
| Claim-password | 8 / 15 min | `IP:email:sessionId` | 15 min | 8 | **No** |
| Public request GET/POST | 12 / 15 min | `get|post:token:IP` | 15 min | 12 | **No** |
| Webhooks | Signature first; no app rate limit | — | — | — | Correct |
| Scheduler generate | Auth or `CRON_SECRET` | — | — | — | Correct |
| Master Admin | Operator JWT only; no volume limit | — | — | — | — |
| Global search | Authz only | — | — | — | — |

Rate-limit responses do not disclose whether an email/account exists on the paths reviewed (`invalid_or_expired_claim_token`, `This request link is no longer available.`).

**Gap:** process-local limits are bypassed by multi-instance Vercel. Owner WAF rate limits are the correct pre-onboarding control.

---

## 7. High-risk route inventory

Classification: **public** · **authenticated** · **operator-only** · **webhook** · **scheduler** · **tenant-only**

### AUTH

| Route | Class | Live unauth |
|-------|-------|-------------|
| `/login` | public | 200 |
| `/forgot-password` | public | 200 |
| `/reset-password` | public | 200 |
| `/accept-invitation/[token]` | public (token) | (page) |
| `/api/auth/session` | public read | 200 `{authenticated:false}` |
| `/api/auth/logout` | public + origin check | 403 without matching origin |

### PUBLIC

| Route | Class | Live unauth |
|-------|-------|-------------|
| `/`, `/pricing`, `/get-started`, `/enterprise`, `/modules`, `/terms`, `/privacy` | public | 200 |
| `/checkout/*`, `/commerce/continue` | public | 200 |
| `/complimentary/claim` | public (token) | 200 |
| `/api/complimentary/claim` | public (token) | 401 `invalid_or_expired_claim_token` |
| `/request/[token]` | public | 200 page (invalid token → unavailable UI) |
| `/api/public/request/[token]` GET/POST | public | 404 identical message for UUID, short, and unused high-entropy |
| `/api/public/request/[token]/media` | public (token) | (live matched; grant-scoped) |
| `/api/public/request/status/[statusToken]` | public | 404 `This tracking link is no longer available.` |
| `/api/commerce/catalog-prices`, `/quote`, `/checkout`, `/checkout/session`, `/provision/status`, `/provision/claim-password` | public | rate-limited where noted |
| `/api/observability/client-report` | public | no auth (telemetry write) |
| Marketing contact API | **absent** | — |

### WEBHOOKS

| Route | Class | Live unsigned |
|-------|-------|---------------|
| `POST /api/commerce/webhooks/stripe` | webhook (SaaS) | 400 `missing_signature` |
| `POST /api/finance/webhooks/stripe` | webhook (FIN-OPS + Connect dual-secret on live) | 400 `Missing signature` |
| `POST /api/leasing/webhooks/signwell` | webhook | 400 invalid payload; 401 bad hash |
| `POST /api/finance/webhooks/connect` | **absent** | 404 |
| Resend inbound webhook | **absent** | — |

### SCHEDULER

| Route | Class | Live unauth |
|-------|-------|-------------|
| `GET/POST /api/facility/preventive-maintenance/generate` | scheduler **or** authenticated FO manager | 401; fake `Authorization: Bearer fake` still 401 |
| `/api/cron/pm` | absent | 404 |

### SENSITIVE AUTHENTICATED

| Route | Class | Live unauth |
|-------|-------|-------------|
| `/admin/**`, `/api/admin/**` | operator-only | pages 307 `/login`; APIs 401 |
| `/api/admin/complimentary-access` | operator-only | 401 |
| `/api/admin/search` | operator-only | 401 |
| `/api/finance/*` (payments, charges, Connect, AutoPay) | authenticated / tenant-only | 401 or 405 |
| `/api/shared/media/*` | authenticated | 401/405 |
| `/api/shared/search`, `/api/pm/*/search` | authenticated | 401 |
| `/api/facility/assignment-rules` (live, not on `main`) | authenticated FO | 401 |

### TENANT

| Route | Class |
|-------|-------|
| `/portal/tenant/**` | tenant-only (layout + occupancy) |
| `/api/portal/tenant/**`, `/api/finance/resident/billing`, `POST /api/finance/checkout` | tenant-only |

---

## 8. Auth security

| Control | Docs/14 claim | Production / code |
|---------|---------------|-------------------|
| IdP | Supabase Auth | Yes |
| Session | `@supabase/ssr` HttpOnly cookies | Yes — `mpa_session` (or `SESSION_COOKIE_NAME` on server) |
| Refresh | middleware `getUser()` | Yes on matched routes |
| MFA | “available for PM org admins” | **Not implemented in app. 0 MFA factors enrolled.** Supabase MFA tables exist. |
| Password policy | 12 characters | **Not enforced in app.** Claim/complimentary min 8. Login HTML `required` only. |
| Leaked-password protection | — | **Disabled** (Supabase advisor `auth_leaked_password_protection`) |
| CAPTCHA / bot on Auth | — | **None** |
| Signup limits | — | Supabase dashboard only — not inspected (no Auth Admin mutation) |
| Login throttling | — | **Not in app.** Unknown Supabase project rate limits. |
| Session lifetime / refresh reuse | — | Supabase defaults; not customized in repo |

**Recommendation (Owner authorize, do not force broad MFA):** enable leaked-password protection; set min password length 12 in Supabase Auth; enable MFA **for Master Admin and org admins only** after a short enrollment runbook. Do not force MFA for all customers from this audit.

---

## 9. Master Admin security

| Check | Result |
|-------|--------|
| Server authorization | `isPlatformOperatorUser`: JWT `app_metadata.platform_operator` **or** `platform_operators.status='active'` |
| Client-only checks | **No** — middleware + `(admin)/layout` + every `/api/admin/*` |
| Customer role → operator | **No insert path** in application code. RLS `platform_operators_manage_admin` requires existing operator. |
| Public signup into operator | **No** |
| Complimentary grants | `requireOperator()` on GET/POST/PATCH; live unauth POST → 401 |
| Impersonation | Operator JWT; middleware blocks customer POST/PUT/PATCH/DELETE during View As |
| Operator action audit | `platform_support_audit_events`, impersonation events |
| IP-only auth | **Not used** (correct) |

**Recommended stronger controls (Owner authorize):** MFA on the single operator account; restrict operator email; shorter idle session for `/admin`; step-up confirm for complimentary send, impersonation start, grace enforce. Do not implement IP allowlists as the sole gate.

---

## 10. RLS table audit

**Every `public` table on Production has RLS enabled** (0 tables with `relrowsecurity=false`). No `USING (true)` policies found in the sampled high-risk set.

### Production-confirmed P0

| Table | Policies | Grants | Risk |
|-------|----------|--------|------|
| `signwell_webhook_events` | `FOR ALL` using `is_org_manager(org) OR org IS NULL` | **anon + authenticated ALL** | Any visitor can SELECT/INSERT/UPDATE/DELETE rows with `organization_id IS NULL`. 0 rows today. |

### Production-confirmed P1 (over-broad member write)

| Table | Policy | Risk |
|-------|--------|------|
| `facility_pm_plans` | `FOR ALL` any active `organization_memberships` row | Tenant-only members can mutate PM plans |
| `facility_assignment_rules` | same | Tenant-only members can mutate routing rules |

### RLS enabled, zero policies (deny-by-default for anon/authenticated)

`commercial_activation_requests`, `commercial_implementation_partners`, `commercial_opportunities`, `contact_email_verifications`, `credential_deliveries`, `facility_request_media_grants`, `facility_request_number_counters`, `finance_lineage_map`, `finance_ops_cutover_state`, `financial_stripe_webhook_events`, `ops_event_consumer_receipts`, `ops_scheduler_leader`, `organization_provision_requests`, `saas_webhook_events`.

These are safe **if** only service role writes. `facility_request_media_grants` still has `authenticated` GRANTs — RLS denies without a policy, but grants should be revoked for hygiene.

### FIN-OPS (Production live vs `main` migrations)

Live `financial_charges` policies are capability-based (`member_has_finance_capability`, resident select). The legacy S1 `FOR ALL is_org_manager` policies that still exist in older `main` SQL **are not present on Production** for `financial_charges`. Do not re-apply stale S1 manage policies.

### Tenant / catalog leakage (P1/P2)

| Table | Issue |
|-------|-------|
| `property_properties`, `property_units`, `vendor_vendors` | Any org member SELECT (tenant sees full catalog) |
| `lease_applications` | Any member SELECT |
| `media_attachments` (non-conversation) | Any member SELECT of metadata |
| `audit_events` / `event_domain_events` | NULL-org rows visible to any member (if such rows exist) |
| `permission_capabilities`, `role_permission_grants`, `product_skus` | Global authenticated SELECT (low sensitivity) |
| `workspace_*` | Staff roles; **no SKU / ADR-033 member scope** |

### Storage

| Bucket | Public | Object RLS |
|--------|--------|------------|
| `media` | false; 100 MB; image/video MIME list | **No `storage.objects` policies** — service-role signed URLs only |
| `media-private` | false; 25 MB; image + office MIME | Authenticated policies scoped to `users/{uid}` **or** `{orgUuid}` + `media:read/write/delete` |

---

## 11. Service-role audit

Factory: `apps/web/src/lib/supabase/service-role.ts`. Key is server-only (`SUPABASE_SERVICE_ROLE_KEY`). Not in `NEXT_PUBLIC_*`. Not imported from client components.

| Path | Who validates first? | Trusts browser `organization_id`? | Verdict |
|------|----------------------|-----------------------------------|---------|
| Public request resolve/submit | High-entropy token → hash lookup → org from intake row | Client org/property/asset **rejected unless they match locked context** | OK |
| Stripe SaaS webhook | `STRIPE_SAAS_WEBHOOK_SECRET` | Org from Stripe/job state | OK |
| Stripe FIN-OPS / Connect | `STRIPE_WEBHOOK_SECRET` then `STRIPE_CONNECT_WEBHOOK_SECRET` | Pending payment row cross-check | OK |
| SignWell webhook | HMAC `SIGNWELL_WEBHOOK_ID` | Activation uses DB lease; metadata org is log-only | See P1 document-id bind |
| Complimentary claim | Grant token | Org created/bound from grant | OK |
| Claim-password | Bind token + Stripe session | Org from job | OK |
| Invitation accept | JWT + token; **body ignored** | Org from invitation | OK |
| Finance checkout | JWT + lease self / finance capability | Org from lease row | OK |
| Media signed URLs | JWT + entity access | Path prefixed with authz org | OK |
| Admin loaders / impersonation | Operator JWT (layout or route) | Operator-intended | OK |
| PM generate (cron) | `Authorization: Bearer CRON_SECRET` | Optional `organizationId` **only after secret** | OK if secret stays server-only |
| `POST /api/observability/client-report` | **None** | Optional body `organizationId` persisted | **P1** — unauthenticated service-role insert |

No path found where the browser supplies `organization_id` and service role trusts it for money or tenancy writes.

---

## 12. IDOR results

Authenticated cross-org IDOR against live customer orgs was **not** executed (no Owner UAT pair; would be invasive). Results are **static + unauthenticated live + contract tests**.

| Object | Unauth GET/POST | Server ownership |
|--------|-----------------|------------------|
| Property / unit / resident / lease / WO / asset | 401 on APIs; pages → `/login` | `requireAuthorizedAction` + RLS org/scope |
| Request form / intake | Staff authz + FO surface; public only via token hash | Token ≠ UUID; org from intake |
| Template / PM plan / routing rule | Auth required | **RLS too broad** (any member ALL) — IDOR *within* org / tenant escalation |
| Vendor / media / payment / receipt | Authz helpers + FIN capability / signed URL prefix | Cross-org blocked at membership |
| SignWell document | Webhook HMAC; lease by `signwell_document_id` **or** metadata `lease_id` | Metadata-only lookup is a **P1** bind gap on the SignWell route |

UI hiding is not treated as authorization.

---

## 13. API authorization

Customer APIs use `requireAuthorizedAction`:

Authentication → cookie/server org (membership proven) → roles → SKU entitlement → `effective` member operating scope → permission.

**Not accepted as authority:** browser role, browser Stripe account, browser asset ownership, browser signer ownership.

**Cookie org** (`mpa_active_organization_id`) is repaired in middleware if stale/forged; API still requires an active membership row.

Operators skip customer entitlement middleware but still need `isPlatformOperatorUser` on `/api/admin/*`.

---

## 14. Webhook security

| Endpoint | Secret name | Verify | Domain | Idempotency | Replay | Cross-domain |
|----------|-------------|--------|--------|-------------|--------|--------------|
| SaaS | `STRIPE_SAAS_WEBHOOK_SECRET` | `constructEvent` | Checkout requires `mpa_money_domain=saas_billing` | In-memory on older `main`; live may persist `saas_stripe_webhook_events` (0 rows) | Stripe ~300s default | Lifecycle events lack metadata gate — **operational isolation required** |
| FIN-OPS | `STRIPE_WEBHOOK_SECRET` | `constructEvent` | Pending `financial_payments` row must match org/lease | DB `financial_stripe_webhook_events` (33 rows); check-then-insert race | Stripe default | Does not invent payments |
| Connect | `STRIPE_CONNECT_WEBHOOK_SECRET` | Second `constructEvent` on same `/api/finance/webhooks/stripe` (live) | Tenant-money | Same FIN table | Stripe default | Must not point Connect events at SaaS URL |
| SignWell | `SIGNWELL_WEBHOOK_ID` | HMAC SHA-256 `type@time`, `timingSafeEqual` | Lease activation | Upsert; already-active is no-op | **No timestamp window** | Unknown document → `{unmatched:true}` |

Malformed bodies rejected. Unsigned POSTs tested live. **Do not WAF-challenge these paths.**

---

## 15. Scheduler security

| Check | Result |
|-------|--------|
| Endpoint | `GET/POST /api/facility/preventive-maintenance/generate` (live; not on `main`) |
| `CRON_SECRET` | Server `process.env` only; **not** in client bundle scan; **not** on `main` |
| Unauthorized | Live 401 |
| Header bypass | `Bearer fake` → 401 (secret unset or mismatch; cron branch fail-closed when unset) |
| Query-string secret | **Not used** |
| Idempotency | `facility_pm_occurrences` unique `(plan_id, occurrence_due_on)` |
| Public exposure | Authenticated manager **or** cron secret — not anonymous |

Owner must confirm `CRON_SECRET` is set in Vercel **only**, not logged, and Vercel Cron (if any) sends `Authorization: Bearer $CRON_SECRET`.

---

## 16. Public QR / link security (docs/204–206 live)

| Control | Result |
|---------|--------|
| Token | `randomBytes(24).toString("base64url")` |
| At rest | SHA-256 `public_token_hash` / `status_token_hash` |
| UUID-shaped rejection | `looksLikeHighEntropyToken` — live UUID GET/POST → identical 404 |
| Inactive / missing | Same 404 message (no existence oracle) |
| Rate limit | 12 / 15 min / token+IP (process-local) |
| Required fields | `validateFacilityRequestSubmission` server-side |
| Hidden-field / forged context | Client `organization_id` / property / asset passed into submit and checked against locked intake context |
| MIME / size | Shared media allow-list (images/video caps) |
| Media isolation | `facility_request_media_grants` + signed URLs |
| Idempotency | Required `idempotencyKey` per org |
| Org IDs in GET JSON | **Not returned** (form name, org **name**, fields, locked context labels) |
| Enumeration | High-entropy space; UUID rejected; no distinct errors |

`/request/<script>alert(1)</script>` renders the generic foundation 404 — token rejected, payload not treated as a form.

---

## 17. Media / file security

| Control | Result |
|---------|--------|
| Private buckets | Yes (`media`, `media-private`) |
| Signed URLs | 15-minute TTL (`MEDIA_SIGNED_URL_TTL_SECONDS`) |
| MIME | Allow-list; extension not authoritative for type |
| Size | Image 20 MB / video 100 MB (`media`); 25 MB (`media-private`) |
| Path | `{organizationId}/{entityType}/{entityId}/{mediaId}/original.{ext}` |
| Prefix check | Download refuses paths not starting with authz org |
| Public requester | Grant limited to that request |
| SVG/HTML | Not in allow-list |
| Magic-byte confirm | **Not done** (P2) |
| `media` bucket object RLS | Missing — OK only while clients never call Storage API directly |

---

## 18. Security headers (live Production)

| Header | Live value | Assessment |
|--------|------------|------------|
| Content-Security-Policy | `default-src 'self'; … script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https: wss:; img-src … https:` | Present; **weak XSS value** |
| Strict-Transport-Security | `max-age=63072000` | Pass (Vercel platform) |
| X-Content-Type-Options | `nosniff` | Pass |
| Referrer-Policy | `strict-origin-when-cross-origin` | Pass |
| X-Frame-Options / frame-ancestors | `DENY` / `none` | Pass |
| Permissions-Policy | camera/mic/geo/usb/payment disabled | Pass |
| COOP / CORP | `same-origin` / `same-site` | Pass |
| powered-by | Off | Pass |

Do **not** blindly tighten CSP to break Stripe.js / SignWell iframes. A tested follow-up CSP should allow `https://js.stripe.com` `https://hooks.stripe.com` `https://www.signwell.com` (and actual live origins) **without** `'unsafe-eval'` if Next/Turbopack permits.

---

## 19. Cookies / session

| Cookie | Flags |
|--------|-------|
| `mpa_session` (Supabase SSR) | `httpOnly`, `sameSite=lax`, `secure` when `NODE_ENV=production`, `path=/` |
| Active org cookie | Middleware-validated; forged values dropped |
| Impersonation / demo | Cleared on logout |

| Threat | Result |
|--------|--------|
| Session fixation | New Supabase session on login; logout `signOut()` + cookie clear |
| Logout | Origin-checked POST; live evil origin → 403 |
| Org / surface switch | Membership + entitlement re-evaluated per request |
| Stale permissions / removed membership | Next API call 403 (JWT still valid until expiry — **P2** prompt revocation) |
| Complimentary expiry | Middleware redirects expired complimentary customers |

Privilege loss is **prompt on the next server request**, not instant on every open tab.

---

## 20. CSRF

| Protection | Where |
|------------|-------|
| SameSite=Lax cookies | All session cookies |
| Origin check | **`/api/auth/logout` only** (live 403) |
| Explicit CSRF tokens | **None** |
| JSON POST | Not inherently safe; Lax cookies cover typical cross-site POST from other sites |

Master Admin, payments, Connect, complimentary, routing, PM, leasing, profile mutations rely on SameSite + authz. Add Origin/Referer allow-list on those POST/PATCH/DELETE routes as P2 hardening. Do not assume JSON POST is CSRF-safe.

---

## 21. XSS / injection

| Check | Result |
|-------|--------|
| `dangerouslySetInnerHTML` | Marketing JSON-LD only (static) |
| Markdown/HTML renderers | Not found in `apps/web` |
| SQL | Supabase parameterized client; migrations use `format('%I')` for identifiers |
| Public request text | Stored as field values / work-order text; React-escaped |
| Search | Parameterized filters |

Stored public-request content must remain text. Do not add rich-text HTML for requester descriptions without a sanitizer package (new gate).

---

## 22. Database / function security

| Check | Result |
|-------|--------|
| SECURITY DEFINER | Many RLS helpers; most set `search_path = public` in later migrations |
| Mutable `search_path` | Supabase advisors: **WARN** on `set_updated_at`, `generate_building_qr_token`, many `finance_m2_*` / `finance_m3_*` backfill helpers |
| Authenticated EXECUTE on DEFINER | Advisors WARN on `has_org_capability`, `is_platform_operator`, `apply_facility_stock_movement`, etc. Helpers are boolean/scope checks; `apply_facility_stock_movement` is the highest-risk callable RPC |
| anon EXECUTE | Hardened on PLAT-005 privileged RPCs |
| Soft-delete | Not a substitute for RLS |
| Migration privileges | Owner/service role only |

---

## 23. Secret-management audit

**Names only. Values were not printed or requested.**

### Required Production secret names

| Name | Domain |
|------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | DB admin |
| `NEXT_PUBLIC_SUPABASE_URL` | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (RLS-bound) |
| `STRIPE_SECRET_KEY` | Stripe API (shared SaaS + FIN by design) |
| `STRIPE_WEBHOOK_SECRET` | FIN-OPS webhook |
| `STRIPE_CONNECT_WEBHOOK_SECRET` | Connect webhook (same route, second secret) |
| `STRIPE_SAAS_WEBHOOK_SECRET` | SaaS webhook |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Public |
| `RESEND_API_KEY` | Email |
| `RESEND_FROM_EMAIL` | Email from |
| `SIGNWELL_API_KEY` | SignWell API |
| `SIGNWELL_WEBHOOK_ID` | SignWell HMAC |
| `CRON_SECRET` | PM scheduler (live) |
| `SESSION_COOKIE_NAME` | Cookie name (not a credential) |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Optional |

### Verification

| Check | Result |
|-------|--------|
| Committed live secrets | **None found** (`sk_live_*` only in scrub unit tests) |
| Client bundle service role | Not referenced |
| Log scrubber | `apps/web/src/lib/observability/scrub.ts` redacts key-shaped strings |
| Preview vs Production | Separate Supabase projects (`mpa-preview` / `mpa-prod`) |
| Rotation | Possible via Vercel + Supabase + Stripe dashboards — **no tested runbook in this audit** |

---

## 24. Dependency vulnerabilities

`pnpm audit --prod` on the lockfile (2026-08-18): **0 critical · 10 high · 8 moderate · 0 low**.

| Severity | Package | Issue | In-scope for this audit |
|----------|---------|-------|-------------------------|
| High | `next@16.2.10` | GHSA-6gpp-xcg3-4w24 middleware bypass (Turbopack + single i18n locale); DoS; SSRF variants | **Patch to 16.2.11.** Live HTML includes `turbopack-*.js`. **No `i18n.locales` in `next.config.ts`** — exploit condition likely **not met**, still patch. |
| High | `sharp` (via next) | libvips CVEs | Transitive; wait for Next bump |
| High | `postcss` (via next) | source map file read | Build-time; low runtime |
| High | `brace-expansion`, `nanoid` | DoS in generators | Transitive; narrow pin if needed |

Do **not** major-bump Next 16 → 17 from this audit.

---

## 25. Security logging (should be observable)

| Event | Current | Target |
|-------|---------|--------|
| Failed operator access | 401/403 in Vercel logs | Structured `security.operator_denied` |
| Login abuse | Supabase Auth logs only | WAF + Auth rate events |
| Rate-limit | 429 on a few routes | WAF + app log (no email existence) |
| Webhook verify fail | 400/401 | Count + alert |
| Public intake abuse | 429 / 404 | Token prefix only (6 chars), never raw token |
| Cross-org 403 | Generic Forbidden | `security.idor` with org/actor ids |
| Suspicious upload | 400 MIME/size | Keep |
| Operator mutations | support audit tables | Keep |
| Payment security | FIN webhook refuse codes | Keep |

**Never log:** passwords, PAN/bank, auth tokens, signing URLs, webhook secrets, API keys. Scrubber exists; do not log `CRON_SECRET` or bind tokens.

---

## 26. Alerting

| Signal | Notified today? |
|--------|-----------------|
| Spike in 401/403 | **No automated page** — Vercel/Supabase dashboards only |
| Webhook verification failures | Stripe/SignWell dashboards; no M.P.A. pager |
| Public endpoint abuse | No |
| Repeated Master Admin 401 | No |
| Abnormal 5xx | Vercel deploy/runtime UI |
| DB/storage errors | Supabase UI |
| Payment webhook failures | Stripe UI |

**Practical first alerts (existing providers, no new SOC):**

1. Vercel: failed Production deploy + 5xx spike  
2. Stripe: webhook error rate on SaaS, FIN, Connect endpoints  
3. Supabase: Auth error spike + disk/IO  
4. Resend: bounce/complaint spike  
5. Optional: Sentry issue spike **if** DSN already configured  

Do not add a SIEM from this audit.

---

## 27. Backup / recovery

| Item | Status |
|------|--------|
| Supabase backups | **Not independently verified** (no billing/plan API in this audit) |
| PITR | Unknown — `docs/26` backup checklist still unchecked |
| Restore drill | **Not performed** |
| Storage file recovery | Separate from Postgres PITR — object versioning not confirmed |
| Migration recovery | Apply via certified stamps only; do not replay twins |

**Backup ≠ disaster recovery** until a restore into a throwaway project is documented and dated.

---

## 28. Cloudflare boundary

| Role | Actual |
|------|--------|
| DNS | Cloudflare NS |
| Email routing | Cloudflare → Resend / Owner mailbox (prior certs) |
| HTTP proxy / WAF | **Not in path** |
| App edge | **Vercel** |

Keep WAF strategy on Vercel. A Cloudflare orange-cloud proxy would be a new architecture and needs a separate Owner approve.

---

## 29. Proposed Vercel WAF rules (Owner apply — do not enable from this agent)

Bypass (do **not** challenge/deny):

- `POST /api/commerce/webhooks/stripe`
- `POST /api/finance/webhooks/stripe`
- `POST /api/leasing/webhooks/signwell`

| Rule | Match | Action | Suggested |
|------|-------|--------|-----------|
| 1 Auth brute | `/login`, `/forgot-password`, `/reset-password`, `/api/commerce/provision/claim-password`, `/api/complimentary/claim` | Rate limit | 10 req / 10 min / IP; 429. Log 7 days then enforce. |
| 2 Public QR | `/request/*`, `/api/public/request/*` | Rate limit | 20 req / 10 min / IP (GET+POST). Do not distinct-error. |
| 3 Scanner junk | path contains `/wp-admin`, `/.env`, `/phpmyadmin`, `/.git` | Deny + log | Safe; no M.P.A. routes. |
| 4 Admin anomaly | `/admin/*`, `/api/admin/*` | Rate limit + log | 30 req / 10 min / IP. Never IP-allowlist as only auth. |
| 5 Emergency IP | Firewall → IP Blocking | Manual | Runbook: add IP, screenshot, 24h review, remove. |

Start rules in **Log** for 24 hours if Owner wants a dry run; then Rate Limit. Challenge is acceptable on Rule 1 if Stripe.js/SignWell are not on those paths (they are not).

---

## 30. ASVS gap table (pragmatic — not a certification)

| ASVS area | Result | Notes |
|-----------|--------|-------|
| Authentication | **PARTIAL** | Solid session stack; no MFA, no leaked-password, weak password policy |
| Session management | **PASS** | HttpOnly / Secure / Lax; logout origin check |
| Access control | **PARTIAL** | Strong API pipeline; SignWell NULL-org P0; PM/routing member ALL |
| Validation | **PARTIAL** | Zod on most APIs; public request validates fields |
| Stored cryptography | **PARTIAL** | Token hashes; no extra app-level crypto for PII (platform at-rest) |
| Error handling / logging | **PARTIAL** | Generic 404s; incomplete security telemetry / alerts |
| Data protection | **PARTIAL** | RLS everywhere; tenant catalog leak; storage `media` policy gap |
| Communication | **PASS** | HTTPS + HSTS |
| Malicious code / dependencies | **PARTIAL** | 10 high, 0 critical; Next patch owed |
| Business logic | **PARTIAL** | Money domains separated; SaaS lifecycle metadata gate incomplete |
| Files / resources | **PARTIAL** | Signed URLs + MIME; no magic-byte |
| API / web services | **PARTIAL** | Authz good; rate limits not durable; WAF empty |

---

## 31. Tests

| Test | Result | Evidence |
|------|--------|----------|
| Unauthenticated sensitive routes | **PASS** | 401/307 live |
| Privilege escalation to operator | **PASS** (static) | No insert path; RLS |
| Cross-org IDOR (authenticated) | **NOT RUN** | Needs Owner UAT pair |
| Complete scope / technician / former tenant | **PARTIAL** | ADR-033 helpers live; no two-persona live matrix here |
| Service-role boundary | **PASS** with P1 client-report | Code review |
| Webhook spoof | **PASS** | Live 400/401 |
| Webhook replay | **PARTIAL** | FIN DB idempotency; SignWell no time window; SaaS memory on `main` |
| Public token enumeration | **PASS** | Identical 404 |
| Request rate limits | **PARTIAL** | Code 12/15m; not multi-instance |
| Upload MIME/size | **PASS** (unit/schema) | Shared media schema |
| Signed-media isolation | **PASS** (code) | Org prefix |
| CSRF logout | **PASS** | Live 403 |
| XSS stored request | **PARTIAL** | React escape; no live stored payload injected |
| Unsafe redirect `?next=` | **PASS** (code + login 200, no Location to evil) |
| Session/logout | **PASS** (code + origin) |
| Secret leakage | **PASS** | Repo scan |
| Security headers | **PASS** with CSP weakness | Live curl |
| RLS contract tests | **PASS** | 40/40 targeted Vitest |
| Destructive DDoS | **NOT RUN** | Forbidden |

Targeted Vitest (dummy env): `plat-002-rls`, `fac-003-rls`, `docs-161-m4-rls`, SaaS webhook, SignWell webhook, observability scrub — **6 files, 40 passed**.

---

## 32. P0

| ID | Finding | Effort | Risk reduction |
|----|---------|--------|----------------|
| P0-1 | `signwell_webhook_events` NULL-org `FOR ALL` + anon/authenticated GRANTs | LOW | HIGH |
| P0-2 | Custom Vercel WAF / durable auth+QR rate limits **absent** (treat as P0 for onboarding, Owner-config) | LOW | HIGH |

---

## 33. P1

| ID | Finding | Effort | Risk reduction |
|----|---------|--------|----------------|
| P1-1 | Supabase leaked-password protection disabled | LOW | HIGH |
| P1-2 | MFA not enrolled / not required for Master Admin | MEDIUM | HIGH |
| P1-3 | `facility_pm_plans` + `facility_assignment_rules` any-member `FOR ALL` | MEDIUM | HIGH |
| P1-4 | Next `16.2.10` → `16.2.11` (Turbopack live; i18n condition likely unmet) | LOW | MEDIUM |
| P1-5 | App rate limits process-local only | MEDIUM | HIGH (with WAF) |
| P1-6 | Unauthenticated `client-report` service-role insert | LOW | MEDIUM |
| P1-7 | SignWell lease lookup by metadata `lease_id` without `signwell_document_id` bind; no replay window | LOW | MEDIUM |
| P1-8 | Password policy 8 vs documented 12 | LOW | MEDIUM |
| P1-9 | Tenant SELECT of property/unit/vendor/application catalogs | MEDIUM | MEDIUM |
| P1-10 | `origin/main` behind Production — security reviews of `main` miss live surface | MEDIUM | HIGH (process) |
| P1-11 | No automated alerting for webhook verify fail / admin 401 spike | LOW | MEDIUM |
| P1-12 | SaaS webhook lifecycle events lack `mpa_money_domain` gate | LOW | MEDIUM |

---

## 34. P2

| ID | Finding | Effort | Risk reduction |
|----|---------|--------|----------------|
| P2-1 | CSP `'unsafe-inline'` / `'unsafe-eval'` | MEDIUM | MEDIUM |
| P2-2 | Origin checks only on logout | LOW | LOW |
| P2-3 | `media` bucket missing object RLS | LOW | MEDIUM |
| P2-4 | Magic-byte MIME confirm | MEDIUM | LOW |
| P2-5 | Mutable `search_path` on finance backfill functions | LOW | LOW |
| P2-6 | Backup/PITR/restore undocumented | MEDIUM | HIGH (DR, not exploit) |
| P2-7 | Session not revoked immediately on membership removal | MEDIUM | LOW |
| P2-8 | Client `SESSION_COOKIE_NAME` hardcoded vs server env | LOW | LOW |
| P2-9 | `apply_facility_stock_movement` authenticated DEFINER RPC | LOW | LOW |
| P2-10 | Grants on deny-by-default tables (`facility_request_media_grants`) | LOW | LOW |

---

## 35. P3

| ID | Finding |
|----|---------|
| P3-1 | Global capability catalog readable by any authenticated user |
| P3-2 | Attack Mode as standing control (do not) |
| P3-3 | Cloudflare orange-cloud (do not without architecture approve) |
| P3-4 | Formal SOC 2 / ASVS certification |
| P3-5 | Broad customer MFA |

---

## 36. Exact in-repo remediations

**This package implements none.** Audit-first. The following are the exact follow-up diffs once Owner authorizes a hardening slice (new Design → Document → Approve if they change approved RLS/product behavior).

1. **Migration (P0-1)** — revoke `anon`/`authenticated` on `signwell_webhook_events`; drop `signwell_webhook_events_manage`; add operator-SELECT-only (match `saas_stripe_webhook_events`). Service role continues webhook writes.  
2. **Migration (P1-3)** — replace member `FOR ALL` on `facility_pm_plans` / `facility_assignment_rules` with `can_manage_facility_ops(organization_id)` (already used on request forms).  
3. **Code (P1-6)** — require session **or** drop service-role persist on `client-report`; cap body size.  
4. **Code (P1-7)** — SignWell: always `signwell_document_id = documentId`; reject metadata-only lease id.  
5. **Deps (P1-4)** — `next` / `eslint-config-next` `16.2.10` → `16.2.11` after Preview build.  
6. **Code (P2-2)** — shared `assertSameOrigin(request)` on browser mutation routes (not webhooks).  

Do not ship these from this PR without a follow-on Owner authorize.

---

## 37. Production configuration changes still requiring Owner action

| # | Action | Where | Do not |
|---|--------|-------|--------|
| 1 | Screenshot + apply proposed WAF rules (§29) | Vercel → Project `m-p-a-web` → Firewall | Challenge webhook paths |
| 2 | Enable **Leaked password protection** | Supabase `mpa-prod` → Auth → Attack protection | Change JWT expiry ad hoc |
| 3 | Set minimum password length **12** | Supabase Auth | Force-reset all users without comms |
| 4 | Enroll MFA on the **one** operator account | Supabase Auth / operator user | Mandate MFA for all customers |
| 5 | Confirm `CRON_SECRET` set, not logged, Cron header correct | Vercel env + Cron | Put secret in `NEXT_PUBLIC_*` |
| 6 | Confirm webhook secrets still **three** distinct values | Vercel env | Reuse SaaS secret for Connect |
| 7 | Confirm backups / PITR + name a restore owner | Supabase settings | Claim DR without a restore drill |
| 8 | Optional Sentry alert rules if DSN already present | Sentry | New SOC platform |
| 9 | Merge `main` forward so docs/188–224 live code is reviewable on default branch | GitHub | Replay Production stamps |

---

## 38. Exact recommended pre-onboarding security package

**Name:** SEC-001 Pre-Onboarding Hardening (Owner authorize next)

1. Apply **P0-1** SignWell RLS revoke on Production (certified SQL, new docs record).  
2. Owner applies **Vercel WAF Rules 1–5** (log 24h optional, then enforce).  
3. Owner enables **leaked-password protection** + password min 12.  
4. Owner enrolls **operator MFA**.  
5. Patch **Next 16.2.11** on a Preview, then Production app deploy (separate authorize).  
6. Tighten **PM plan + assignment rule** RLS (P1-3) in the same or immediately following certified migration.  
7. Close **P1-6** client-report and **P1-7** SignWell bind in the same app deploy.  

Skip everything else for first onboarding. Do not orange-cloud Cloudflare. Do not force customer MFA. Do not change Stripe prices or money domains.

---

## 39. Production safety snapshot

Repeated from the header: **no Production security settings, secrets, WAF, Auth, Stripe, SignWell, public request, routing, or PM behavior were changed.** Read-only live curls, read-only Supabase SQL, and in-repo review only.

---

## 40. Final verdict

**SECURITY HARDENING CONDITIONAL — REMEDIATION REQUIRED**

Not **PASS — READY FOR OWNER FIREWALL CONFIGURATION** because P0-1 is an exploitable Production RLS grant, and the firewall step would paper over a database hole.

Not **BLOCKED — SECURITY HARDENING** because core money/auth/token/webhook signatures held under live probes, RLS is on every public table, Master Admin cannot be self-granted, and public QR tokens already follow the docs/204 contract.

**STOP.** Owner authorizes SEC-001 (or an equivalent slice) before treating this audit as a green firewall-only task.

---

## Related

- `docs/14-security-standards/index.md`
- `docs/00-governance/implementation-gate.md`
- `docs/187-complimentary-access-production-release-certification/index.md`
- Live docs/204–206, 188/193/194, 219/221 on Production (ahead of `origin/main`)
