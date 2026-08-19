# 228 — SEC-001 Stage 2 Production Security Remediation

**Title:** SEC-001 STAGE 2 PRODUCTION SECURITY REMEDIATION  
**Status:** **BLOCKED — SEC-001 PRODUCTION SECURITY REMEDIATION**  
**Date:** 2026-08-19  
**Authority:** Owner authorization — Production execution and certification of previously defined SEC-001 Stage 2 only.  
**Canonical Stage 1 (in-repo only):** [docs/226-SEC](../226-sec-001-pre-onboarding-security-remediation/index.md)  
**Preserved SignWell certifications (meaning unchanged):** [docs/226](../226-signwell-production-release-uat/index.md) · [docs/227](../227-signwell-production-webhook-certification/index.md)  
**Scope:** Apply the already-implemented SEC-001 security remediation to Production. No new feature. No SignWell expansion. No Stripe / M5 / July / pricing mutation.

Stage 1 remains historically true: SEC-001 was first implemented **in-repo only** (`450611fd` / `c0167224` on `cursor/sec-001-pre-onboarding-security-5acb`) and was **not** Production-applied in that package.

This record is the unique Stage 2 Production certification. **228** is the next unique number after SignWell **227**.

Stage 3 Auth-control recertification is [docs/229](../229-sec-001-final-auth-controls-production-recertification/index.md). **This Stage 2 verdict remains BLOCKED** and is not rewritten as PASS.

---

## Verdict

**BLOCKED — SEC-001 PRODUCTION SECURITY REMEDIATION**

Migration `20260818210000`, the SignWell-preserving application deploy, and Vercel WAF Rules 1–4 **are live**. The P0 SignWell NULL-org write hole is **closed and verified** on Production.

PASS is refused because authorized Stage 2 Production **Auth configuration cannot be applied or verified**:

| Authorized Stage 2 item | Result |
|-------------------------|--------|
| Production security migration | **Applied** — stamp `20260818210000` / `docs_226_sec_001_security_hardening` |
| Certified application deploy | **Applied** — SHA `589acd59` · `dpl_Ao7jbM9xbiokNWZQ7yLcjskF6YwX` |
| Vercel WAF Rules 1–4 | **Applied** — `firewallEnabled: true` · Rule 5 not created (no Owner IP) |
| Leaked-password protection | **Not applied / still disabled** — advisor `auth_leaked_password_protection` WARN |
| Supabase Auth minimum password length 12 | **Dashboard setting not applied / not readable** — application contract 12 is live |
| Operator MFA (single platform operator) | **Not enrolled** — `auth.mfa_factors` count **0** |

No `SUPABASE_ACCESS_TOKEN` / Management API credential is available in this environment. Public `GET /auth/v1/settings` does not expose leaked-password or min-length. Operator TOTP requires the Owner authenticator and must not be project-wide.

**Do not issue PASS while those Production Auth settings remain unverified.**

**STOP.** Do not begin M5. Do not unfreeze July. Do not change pricing. Do not onboard a real customer. Do not send a real customer SignWell document. Do not begin another feature.

---

## 1. Certification path

`docs/228-sec-001-stage2-production-certification/index.md`

Stage 1 in-repo history is unchanged in [docs/226-SEC](../226-sec-001-pre-onboarding-security-remediation/index.md).

## 2. Pre-deploy Production SHA

| Item | Value |
|------|--------|
| `origin/main` at inspect | `b30567e3854c713577afb658f130ddf92446ae99` (complimentary access; **does not** contain SEC-001 or SignWell Production fixes) |
| Live Production before this package | git `d48d4684` · deploy `dpl_BejvXQvJ6gnqCh5ZNyX9sk3aL2yt` (docs/226 retrieval + docs/227 webhook) |
| SEC-001 Stage 1 tip (not a safe Production release alone) | `c0167224` — `main` + 3 SEC-001 commits; **missing** certified SignWell |
| Migration before apply | tip `20260818091246` / `docs_221_fo_eff_slice6_routing` |
| `20260818210000` before apply | **absent** |
| Custom WAF before apply | empty |
| Operator MFA before apply | 0 factors |
| July freeze | **ON** |
| Tenant payment execution TRUE | **0** |
| M5 | unauthorized / not executed |

## 3. Final release SHA

`589acd591836fc240817c62c892ed17272f081bd`

Branch `cursor/sec-001-stage2-production-6821` built from SignWell-certified `9337b539` plus cherry-picked SEC-001 Stage 1 (`20775b3e`, `450611fd`, `c0167224`).

Proved to contain SEC-001 remediation **and** preserve docs/226 + docs/227 SignWell behavior. Historical `c0167224` was **not** deployed alone.

Live webhook correlation remains `apps/web/src/lib/signwell/correlation.ts` (certified). Failures return `{ ok: true, unmatched: true, reason }` including `lease_mismatch` / `organization_mismatch`.

## 4. Production deployment ID

| Item | Value |
|------|--------|
| Deployment | `dpl_Ao7jbM9xbiokNWZQ7yLcjskF6YwX` |
| Ready state | READY / production |
| Alias | `www.my-property-assistant.com` (`data-dpl-id` confirmed) |
| Inspector | `https://vercel.com/ecastle612-uxs-projects/m-p-a-web/Ao7jbM9xbiokNWZQ7yLcjskF6YwX` |

## 5. Migration result

**Applied completely** to `mpa-prod` / `vahnmcrpnuggxkivynvo` only.

| Item | Value |
|------|--------|
| Source | `supabase/migrations/20260818210000_docs_226_sec_001_security_hardening.sql` |
| Production stamp | `20260818210000` / `docs_226_sec_001_security_hardening` |
| Unrelated pending migrations | **not applied** |
| Customer / webhook history deleted | **No** — `signwell_webhook_events` remains **8** |

Rollback (not destructively tested): drop new policies / restore prior policies; drop `platform_rate_limit_buckets` + `consume_platform_rate_limit`; no customer-row deletes.

## 6. SignWell RLS result

**PASS (P0 hole closed).**

| Check | After |
|-------|--------|
| `signwell_webhook_events_manage` | **absent** |
| Client policy | `signwell_webhook_events_operator_select` SELECT only for active `platform_operators` |
| Anon INSERT | **401** `permission denied` (grant revoked) |
| Authenticated PM INSERT | **403** `permission denied` (grant revoked) |
| Probe row `evt_sec001_probe` | **0** |
| Historical events | **8** (docs/227 authentic deliveries preserved) |

## 7. Webhook grants result

**PASS for tables covered by the migration.**

| Table | Client grants after |
|-------|---------------------|
| `signwell_webhook_events` | authenticated **SELECT** only |
| `saas_stripe_webhook_events` | authenticated **SELECT** only |
| `saas_webhook_events` | authenticated **SELECT** only |
| `integrations_webhook_events` | authenticated **SELECT** only |
| `financial_stripe_webhook_events` | **no** anon/authenticated grants |
| `platform_rate_limit_buckets` | **no** client grants |

`auth_support_escalations`: `auth_support_escalations_manage_manager` **gone**. Writes are service-role. Leftover `auth_support_escalations_select_member` remains SELECT-only (including NULL-org SELECT). That is not the write hole.

## 8. PM-plan RLS result

**PASS (policy contract + live write deny).**

Dropped `facility_pm_plans_org_all` / `facility_pm_occurrences_org_all`.

Live policies:

- SELECT: `can_manage_facility_ops` **or** (technician + facility surface)
- WRITE: `can_manage_facility_ops` only

Live JWT-claim evaluation:

| Persona | `can_manage_facility_ops` | Notes |
|---------|---------------------------|--------|
| Property Demo PM manager | false | member; **no** facility surface |
| Property Demo technician | false | `is_maintenance_technician` true; no facility surface → no SELECT either |
| Property Demo tenant | false | member only |
| Clinic FO manager (Mike) | **true** | facility surface; other-org **false** |
| Clinic PM-only (Sarah) | false | org has facility surface; Complete still requires FO manager scope |

REST INSERT `facility_pm_plans` as anon and as Property Demo PM: **RLS deny**. No probe row left behind.

Default PostgREST DML grants on PM tables remain; **RLS is the write control**, matching the approved migration (grants were not revoked on those tables).

## 9. Routing-rule RLS result

**PASS.**

Dropped `facility_assignment_rules_org_all` / `facility_assignment_evals_org_all`.

- Rules: SELECT+WRITE = `can_manage_facility_ops`
- Evaluations: SELECT + INSERT = `can_manage_facility_ops`
- Service-role cron / public intake unchanged (RLS bypass)

Technician and tenant predicates cannot satisfy `can_manage_facility_ops`. Cross-org Mike → Property Demo is false.

## 10. Durable rate-limit RPC result

**PASS.**

`consume_platform_rate_limit`:

- `SECURITY DEFINER`
- `search_path=public`
- EXECUTE: `service_role` + `postgres` **true**; `anon` / `authenticated` / `authenticator` **false**
- Anon REST: `permission denied for function`
- Probe `SEC001:stage2-rpc-probe` limit 1: first **true**, second **false**

Live application writes to `platform_rate_limit_buckets` observed (`PUBLIC:client-report:<ip>`). Keys shard by Vercel `x-forwarded-for` (function egress), so a single-client 429 flood was **not** observed in this run. RPC deny is proven.

## 11. Client-report result

**PASS (application contract live).**

| Check | Result |
|-------|--------|
| Body > 8 KB | **413** `payload_too_large` |
| Anon POST with attacker `organizationId` / `userId` | **200** `{ ok: true }` — `persistDurable: Boolean(actorId)` only; payload IDs ignored |
| Durable table `platform_error_events` | **does not exist** — even authenticated persist fail-opens; no anonymous DB row possible |
| PUBLIC limiter | durable buckets written |

## 12. Auth rate-limit result

**PARTIAL.**

| Surface | Result |
|---------|--------|
| Claim-password 11-character with `sessionId` + `email` | **400** `invalid_request` (`meetsMinPasswordLength` before bind) |
| Complimentary 11-character without valid token | **400** `invalid_or_expired_claim_token` (token checked first; min-12 covered by in-repo tests) |
| AUTH durable 8 / 15 min | implemented; live 429 not forced (IP sharding) |
| Login stuffing | WAF Rule 1 **log-only** 20/1m/IP — not an application 429 |

## 13. Search rate-limit result

**PASS (authorization first; limiter wired).**

| Route | Live |
|-------|------|
| `/api/admin/search` unauthenticated | **401** `Unauthenticated` |
| `/api/admin/search` as Property Demo PM | **403** `Forbidden` (operator JWT gate; WAF did not replace it) |
| `/api/pm/properties/search` with org cookie | **200** (Demo Apartments) |
| `/api/pm/residents/search` with org cookie | **200** (UAT Tenant) |
| Clinic org cookie on Property Demo session | **403** |
| ADMIN 60 / 15m and APPLICATION 30 / 15m | code live; 429 not forced |

## 14. Vercel WAF rules applied

`firewallEnabled: true`. Updated `2026-08-19T16:39:51.548Z`. Version 5.

| Rule | ID | Mode |
|------|----|------|
| SEC-001 RULE 1 AUTH ABUSE | `rule_sec_001_rule_1_auth_abuse_TZwWSI` | **log** 20 / 1 min / IP |
| SEC-001 RULE 2 PUBLIC REQUEST ABUSE | `rule_sec_001_rule_2_public_request_abuse_bqGp1j` | **rate_limit** 30 / 1 min / IP |
| SEC-001 RULE 3 SCANNER / EXPLOIT TRAFFIC | `rule_sec_001_rule_3_scanner_exploit_traffic_3tkPQF` | **deny** |
| SEC-001 RULE 4 ADMIN ABUSE | `rule_sec_001_rule_4_admin_abuse_G6mMH8` | **rate_limit** 60 / 1 min / IP, no challenge |

Rule 5 emergency IP block **not created** (Owner supplied no IP).

Live: `GET /wp-admin` and `GET /xmlrpc.php` → **403**. `GET /.env`, `/.git`, `/phpmyadmin` → **404** (deny condition is present; those paths did not return 403 in this probe).

## 15. Webhook / cron WAF exclusions

**PASS — rules do not match provider webhooks or PM cron.**

Rule paths are only login/claim/reset/invitation, `/request/*`, scanner strings, and `/admin` + `/api/admin/*`.

**Not** attached to:

- `POST /api/commerce/webhooks/stripe`
- `POST /api/finance/webhooks/stripe` (FIN-OPS 8 events + Connect 74 events)
- `POST /api/leasing/webhooks/signwell`
- PM cron `GET/POST /api/facility/preventive-maintenance/generate`

Unsigned Stripe POSTs still return application `400` missing signature (not WAF 403).

## 16. Leaked-password setting

**NOT ENABLED.**

Supabase security advisor `auth_leaked_password_protection` remains **WARN / disabled**. Management API `PATCH /v1/projects/{ref}/config/auth` was not callable (no access token).

## 17. Password-minimum setting

| Layer | Setting |
|-------|---------|
| Application contract | **12** (`MIN_PASSWORD_LENGTH` in `@mpa/shared`) — live on claim-password |
| Supabase Auth dashboard minimum | **cannot verify** — public settings omit it; not mutated |

Existing UAT PM password still signs in (**200**). No application-side rejection of existing shorter passwords was added to sign-in.

## 18. Operator MFA result

**NOT ENROLLED.**

| Check | Result |
|-------|--------|
| Active `platform_operators` | 1 (`f68545ab-8ed0-46df-b7b0-6d72f97a6c55`) |
| `auth.mfa_factors` | **0** |
| Project-wide MFA required | **not enabled** (no Auth config mutation) |
| Tenant / staff MFA | **not forced** |

MFA does not replace `getUser` + `isPlatformOperatorUser`. Admin search as a tenant PM is already **403**.

Do not publish recovery secrets. Owner must enroll TOTP in the operator account only.

## 19. Tenant / staff authentication regression

**PASS for the probed UAT PM.**

`uat.pm.property.demo@my-property-assistant.com` password grant **200**; session cookie works for Property Demo PM search.

## 20. Master Admin authorization result

**PASS — WAF and application authorization remain separate.**

Unauthenticated admin search **401**. Authenticated non-operator **403**. Rule 4 is rate-limit only and does not grant access.

## 21. SignWell regression result

**PASS — no reopen / no new document.**

| Check | Result |
|-------|--------|
| Callback | exactly `https://www.my-property-assistant.com/api/leasing/webhooks/signwell` (1 hook) |
| Empty POST | **400** `Invalid SignWell payload` |
| Typed unsigned POST | **401** `Invalid webhook signature` |
| Event count | **8** unchanged |
| Docs/226 lease `51fb0ba8-…` | `active` / SignWell `Completed`; Documents `externalUrl` still mapped |
| Docs/227 lease `448d2dba-…` | `active` / SignWell `Completed`; `GET /api/shared/documents/lease:448d2dba-…` **200** |
| Lease-only | unchanged |
| Second file store | none |
| New SignWell document | **not created** |

## 22. Stripe / webhook regression result

**PASS — no financial mutation.**

| Check | Result |
|-------|--------|
| Stripe endpoints | 3 enabled, livemode: commerce SaaS + finance 8-event + finance 74-event Connect/FIN-OPS |
| URLs | unchanged |
| Unsigned POST | application signature reject, not WAF block |
| July freeze | `finance_july_freeze_enabled()` **true** |
| `stripe_payment_execution_enabled` TRUE | **0** / 6 settings rows |
| M5 | **not executed** |
| Prices / Checkout / AutoPay / Connect logic | **not modified** |

## 23. PM / routing RLS live verification

**PASS** — see §§8–9. Cross-org clinic cookie on Property Demo session **403**.

## 24. MEDIA-001 regression

**PASS (live + prior focused tests).**

| Check | Result |
|-------|--------|
| Unauthenticated upload-intent (`organization` + JPEG) | **401** `Unauthenticated` |
| Authenticated EXE MIME | **400** `Unsupported file type. Allowed: JPG, PNG, HEIC, WebP, MP4, MOV.` |
| In-repo MEDIA-001 suite | included in pre-deploy focused tests |

## 25. Dependency audit

`pnpm audit --prod` on the release SHA:

- **0 critical**
- **6 high / 3 moderate** remaining (next-bundled postcss, exceljs/uuid, other transitive)
- Unrelated P2 upgrades **not** expanded

## 26. Typecheck

**PASS** on `589acd59` — `pnpm --filter @mpa/shared typecheck` and `pnpm --filter @mpa/web typecheck`.

## 27. Lint

**PASS for shared / SEC-001 files.** `pnpm --filter @mpa/shared lint` clean. Full web lint still reports **pre-existing** complimentary-access issues this package did not introduce.

## 28. Tests

**PASS** on `589acd59` before deploy (focused SEC-001 + SignWell + MEDIA/auth): **81 + 23** passed. Includes webhook spoof/correlation, IDOR/cross-org/tenant/technician contracts, client-report, durable/auth/admin/application limiter tests, MEDIA-001.

## 29. Production build

**PASS** — Next **16.2.11**, **204** pages. Vercel Production compile for `dpl_Ao7jbM9xbiokNWZQ7yLcjskF6YwX` READY.

## 30. Production observation / log result

Direct verification is the primary evidence. Immediate observations:

- No new SignWell webhook rows (count stays 8)
- No Stripe endpoint drift
- Unsigned webhooks still fail at the application signature gate
- Admin 401/403 behave as designed (not a spike; probes only)
- Durable limiter is writing buckets
- Vercel runtime log CLI did not return a usable request-error sample in this environment; **absence of logs is not treated as proof**

No P0 RLS/webhook write regression was observed.

## 31. Exact Production mutations

1. Applied SQL `20260818210000_docs_226_sec_001_security_hardening` to `mpa-prod` (MCP stamp renamed to `20260818210000`)
2. Deployed application SHA `589acd59` as `dpl_Ao7jbM9xbiokNWZQ7yLcjskF6YwX` to Production
3. Created/activated Vercel WAF Rules 1–4 (Rule 5 not created)
4. Read-only Auth/MFA inspection — **no** leaked-password, min-length, or MFA mutation succeeded
5. Non-destructive probes only (no customer SignWell send, no Stripe charge, no July/M5 flip)

Preview (`mpa-preview`) was not used as a substitute.

## 32. P0 remaining

**None remaining in the applied RLS/application surfaces.**

The live SignWell NULL-org write hole from Stage 1 is **closed**.

PASS is still refused because authorized Auth configuration is unverified — that is recorded as P1, not a remaining P0 write hole.

## 33. P1 remaining

| ID | Item |
|----|------|
| P1-1 | Leaked-password protection still disabled |
| P1-2 | Platform-operator MFA still 0 factors |
| P1-Auth-min | Supabase dashboard min password length 12 not verified |
| P1-5 residual | Public-request limiter still not on `origin/main` product path; WAF Rule 2 is in place for when that route exists |
| P1-9 / P1-11 / P1-12 | Deferred as in Stage 1 (catalog SELECT, alerting, SaaS money-domain gate) |

## 34. P2 deferred

- Remaining `pnpm audit` advisories outside the Next 16.2.11 pin
- WAF `/.env` probe 404 vs deny
- Durable limiter key sharding on Vercel `x-forwarded-for`
- `auth_support_escalations_select_member` NULL-org SELECT
- Leftover `*_org_all` on work-template tables (not SEC-001 write-hole scope)
- `apply_facility_stock_movement` authenticated SECURITY DEFINER (intentional)
- Automated WAF-as-code

## 35. Final verdict

**BLOCKED — SEC-001 PRODUCTION SECURITY REMEDIATION**

---

## Next Owner release gate (do not start from this agent)

Complete the three remaining dashboard/operator steps, then authorize a short **docs/229** recertification (do not rewrite this record or docs/226/227 SignWell meaning):

1. Supabase Dashboard → `mpa-prod` → enable **Leaked password protection** → confirm advisor clear  
2. Authentication → Email → **Minimum password length = 12** (confirm existing sessions/sign-in are not invalidated)  
3. Enroll TOTP for the **single** active platform operator only — do **not** require MFA for tenants/staff  

Until then: treat Stage 2 as **partially applied**. The P0 database write hole is closed; Auth/MFA configuration is not certified.

**STOP.**
