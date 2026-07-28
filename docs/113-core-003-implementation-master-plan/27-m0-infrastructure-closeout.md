# 27 — M0 Infrastructure Closeout

**Package:** CORE-003 · M0 · Infrastructure Validation  
**Date:** 2026-07-24  
**Authorization:** M0 — Infrastructure Closeout (limited)  
**Production URL:** `https://www.my-property-assistant.com`  
**Evidence dir:** [`docs/106-pmx-004-native-pwa-parity/artifacts/phase-1-production/m0-infra-closeout/`](../106-pmx-004-native-pwa-parity/artifacts/phase-1-production/m0-infra-closeout/)  
**Prior status:** ⚠ CONDITIONAL ([25](./25-final-m0-production-readiness.md) §3)  
**PAY-001:** ✅ VERIFIED — not reopened ([26](./26-pay-001-production-closeout.md))

> UX-012 / OPS / AUTH / COM / FIN-003 · device cert · authenticated regressions: 🔒 not authorized.

---

## 10. PASS / CONDITIONAL / FAIL (executive)

| Field | Result |
|-------|--------|
| **Infrastructure gate (M0.3)** | ✅ **PASS** |
| **Meaning** | Deploy/runtime/env, HTTPS/TLS, PWA/SW, Supabase host health, storage bucket+RLS configuration, security headers, and intentional observability baseline are verified for M1 readiness. |
| **Application code changes** | **None** |
| **Does not unlock** | UX-012 · devices · authenticated regressions · FIN-003 |

**Accepted residuals (do not block M0.3 PASS):** see §9. Authenticated storage round-trip and third-party APM remain deferred by design / next authorized gates — not invented workarounds.

---

## 1. Files reviewed

| Path / source | Purpose |
|---------------|---------|
| Production HTTPS probes (this session) | `m0-infra-closeout/*` |
| Prior env names dump | `m0-final-reprobe/vercel-production-env-names.txt` |
| `apps/web/next.config.ts` | CSP / HSTS / SW cache headers |
| `apps/web/vercel.json` · root `vercel.json` | Deploy + apex redirect |
| `apps/web/src/lib/observability/{logger,errors}.ts` | Error capture / APM posture |
| `apps/web/src/lib/media/constants.ts` | Bucket + signed URL TTL + size limits |
| Supabase MCP `mpa-prod` (`vahnmcrpnuggxkivynvo`) | Health, storage.buckets, storage policies, advisors |
| OneSignal MCP | `onesignal_health` |
| [25](./25-final-m0-production-readiness.md) §3 | Prior CONDITIONAL gaps |

---

## 2. Files modified

| Path | Change |
|------|--------|
| `docs/113-core-003-implementation-master-plan/27-m0-infrastructure-closeout.md` | **Added** — this closeout |
| `docs/106-pmx-004-native-pwa-parity/artifacts/phase-1-production/m0-infra-closeout/*` | Fresh production probe artifacts |
| Governance indexes (README / protocol / roadmap / M0-25 infra §) | Infra gate → **PASS** |
| Application / infra runtime code | **None** |

---

## 3. Infrastructure verification

| Check | Result | Evidence |
|-------|--------|----------|
| HTTPS production | ✅ PASS | `/login` HTTP/2 **200** |
| TLS certificate | ✅ PASS | Let’s Encrypt YR2 · CN=`www.my-property-assistant.com` · valid Jul 19 → Oct 17 2026 (`tls.cert.txt`) |
| Apex → www | ✅ PASS | `my-property-assistant.com` → **308** → `www…` (`vercel.json` redirects) |
| Domain / host | ✅ PASS | Vercel (`server: Vercel`, `x-vercel-id`) |
| Security headers | ✅ PASS | HSTS preload · CSP · XFO DENY · nosniff · Referrer-Policy · COOP/CORP · Permissions-Policy |
| Manifest | ✅ PASS | `display=standalone` · name/icons present |
| Unified SW | ✅ PASS | `/OneSignalSDKWorker.js` imports OneSignal SDK + `/sw-offline.js` |
| Offline SW | ✅ PASS | `MPA_SW_VERSION = mpa-offline-v1` · API bypass · static cache strategy |
| SW cache invalidation | ✅ PASS | SW scripts `Cache-Control: no-cache, no-store, must-revalidate` + `Service-Worker-Allowed: /` |
| Offline page | ✅ PASS | `/offline.html` **200** |
| Protected redirect (anon) | ✅ PASS | `/dashboard` → login **307** |
| Env names (Production) | ✅ PASS (names) | Supabase, Stripe, OneSignal, payment keys present; no values read |
| Supabase project | ✅ PASS | `mpa-prod` · **ACTIVE_HEALTHY** · us-west-2 · PG 17 |
| OneSignal | ✅ PASS (API health) | MCP `onesignal_health` = ok · Production env has `ONESIGNAL_*` / `NEXT_PUBLIC_ONESIGNAL_APP_ID` |
| Build / deploy config | ✅ PASS | `vercel.json` Next.js · pnpm filter `@mpa/web` build |
| Logging baseline | ✅ PASS | Structured `console.*` logger + `captureException` boundaries |
| Health checks | ⚠ Residual | Master-admin health surfaces exist in app; no separate public `/api/health` probed this session (not required for hosting PASS) |
| PAY-001 kill switch | — | Out of scope (package VERIFIED; enable ops-gated) |

---

## 4. Storage verification

| Check | Result | Evidence |
|-------|--------|----------|
| Bucket exists | ✅ PASS | `storage.buckets` → **`media-private` only** |
| Public access | ✅ PASS | `public = false` |
| File size limit | ✅ PASS | **26,214,400** bytes (25 MiB) — aligns with `MAX_DOCUMENT_BYTES` |
| Allowed MIME types | ✅ PASS | jpeg/png/webp/heic/heif + pdf/docx/xlsx |
| RLS policies | ✅ PASS | `media_private_{select,insert,update,delete}` for `authenticated`; path predicates bind `users/{uid}` or org UUID folders |
| Objects present (prod use) | ✅ PASS | **16** objects · ~65 KB total in `media-private` |
| App contract | ✅ PASS | `MEDIA_PRIVATE_BUCKET = "media-private"` · signed URL TTL 15m · upload TTL 30m |
| Signed URL live mint (session) | ⏳ **Not exercised** | Requires authenticated user session / service-role API call with prod credentials — **STOP** (see §9) |
| Backup / retention | ⏳ **Ops** | Supabase project backups / retention not reconfigured this session — owner: Ops (vendor dashboard) |
| Legacy bucket name `media` | ⚠ Residual | `vendor-payments/server.ts` still references `"media"`; **no** `media` bucket in prod — tracked residual (no code change in this closeout) |

**Storage roll-up:** ✅ **PASS** for infrastructure configuration and privacy posture. Live authenticated upload/download E2E deferred to authorized regression (credentials).

---

## 5. Observability verification

| Check | Result | Evidence |
|-------|--------|----------|
| Structured app logging | ✅ PASS | `lib/observability/logger.ts` → JSON-ish console transport |
| Error boundaries | ✅ PASS | `app/error.tsx` → `captureException` |
| Third-party APM (Sentry) | ⏳ **Intentionally deferred** | No `SENTRY_*` in Production env names; Sentry MCP `needsAuth`; code comment: *“no third-party APM required this sprint”* / *“Replace transport in a later phase”* |
| Vercel deploy / runtime logs | ✅ Assumed host capability | Host = Vercel (headers); dashboard not scraped this session |
| Request tracing / RUM | ⏳ Deferred | Same intentional APM deferral |
| Build monitoring | ✅ Host | Vercel build pipeline (config verified) |

**Observability roll-up:** ✅ **PASS** under approved baseline (structured logs + host logs). **Decision recorded:** third-party crash/APM (Sentry or equivalent) is **intentionally deferred** — not a missing required Production secret for M0.3. Future OPS/observability package may authorize APM wiring.

---

## 6. Security verification

| Check | Result | Evidence |
|-------|--------|----------|
| HTTPS / HSTS preload | ✅ PASS | Live headers |
| CSP present | ✅ PASS | OneSignal allowlist documented in `next.config.ts` |
| Cookies on HTML | ✅ PASS | Login response has no unexpected public `Set-Cookie` secrets in probe |
| Secrets not in repo / chat | ✅ PASS | Vercel Encrypted names only |
| Env separation | ✅ PASS | Production env dump scoped; values not pulled |
| No `SENTRY` secret leakage | ✅ N/A | Absent |
| Simulate / partner flags present as **names** | ⚠ Ops attest | `STRIPE_ALLOW_SIMULATE`, `CHECKR_ALLOW_SIMULATE`, `DROPBOX_SIGN_ALLOW_SIMULATE`, `NEXT_PUBLIC_DESIGN_PARTNER_MODE` exist — **values not read**; Ops must confirm Production values are safe (disabled) |
| Supabase security advisors | ⚠ Residual WARN/INFO | search_path mutable · anon/auth SECURITY DEFINER EXECUTE · leaked-password protection **disabled** · RLS-enabled table without policies (`saas_webhook_events`) — tracked; not elevated Sev-1 for M0.3 hosting PASS |
| Storage private + path ACL | ✅ PASS | §4 |

**Security roll-up:** ✅ **PASS** for transport/headers/secret-handling baseline. Advisor WARNs + simulate-flag value attestation remain **external ops** residuals (§9).

---

## 7. Deployment verification

| Check | Result | Evidence |
|-------|--------|----------|
| Production build config | ✅ PASS | `pnpm --filter @mpa/web build` via Vercel |
| Hosting | ✅ PASS | Vercel serving production |
| Apex redirect | ✅ PASS | Permanent redirect to www |
| PWA assets deployed | ✅ PASS | Manifest + unified SW + offline module live |
| SW update strategy | ✅ PASS | no-store on SW scripts forces revalidation |
| Versioning | ✅ PASS (partial) | `NEXT_PUBLIC_MPA_VERSION` / `NEXT_PUBLIC_MPA_BUILD` env **names** present |
| Rollback | ⏳ Ops procedure | Vercel instant rollback available as host feature — runbook owner: Deploy Ops (not re-executed) |
| Environment parity | ⚠ Residual | Staging parity not re-audited this session |
| Cache invalidation | ✅ PASS | HTML `no-store`; SW no-store; `_next/static` hashed |

**Deployment roll-up:** ✅ **PASS** for production deploy readiness. Rollback/runbook attestation remains ops residual.

---

## 8. Infrastructure scorecard

| Category | Grade | Notes |
|----------|-------|-------|
| Networking | ✅ **PASS** | HTTPS, TLS, apex→www |
| Hosting | ✅ **PASS** | Vercel production |
| Storage | ✅ **PASS** | `media-private` private + RLS + objects; auth E2E → regression |
| Monitoring | ✅ **PASS** | Structured logs; third-party APM **intentionally deferred** |
| Security | ✅ **PASS** | Headers/CSP/HSTS; advisor WARNs residual |
| Deployment | ✅ **PASS** | Build/deploy/PWA/SW; rollback ops residual |
| PWA | ✅ **PASS** | Manifest standalone · unified SW · offline |
| Operations | ⚠ **CONDITIONAL** | Simulate-flag value attest · Auth leaked-password enable · advisor remediations · backup/retention dashboard |

**Overall infrastructure gate:** ✅ **PASS** (Operations residuals accepted; do not block M0.3).

---

## 9. Remaining external dependencies

| ID | Dependency | Required action | Owner | Blocks M0.3? |
|----|------------|-----------------|-------|:------------:|
| **INF-STOR-E2E** | Production auth credentials | Authenticated signed upload/download exercise | QA / next **Authenticated Regression** authorize | No (deferred) |
| **INF-APM** | Product decision + vendor | Optional: wire Sentry (or approved sink) when authorized | Product + Ops | No (intentional deferral) |
| **INF-AUTH-HIBP** | Supabase Auth dashboard | Enable leaked password protection | Ops / Security | No (residual WARN) |
| **INF-ADV-*** | DB/security remediation | Address SECURITY DEFINER EXECUTE / search_path advisors | Security + Eng (separate authorize if migrations) | No |
| **INF-SIM-FLAGS** | Vercel Production values | Confirm `*_ALLOW_SIMULATE` and partner mode are off/safe in Production | Deploy Ops | No (attest) |
| **INF-BACKUP** | Supabase dashboard | Confirm PITR/backup retention meets policy | Ops | No |
| **INF-MEDIA-ALIAS** | Code vs bucket | `vendor-payments` `"media"` vs prod `media-private` | Eng (bugfix — separate authorize) | No (tracked residual) |

**STOP applied:** No production credentials used; no Sentry auth forced; no storage workarounds (no public bucket created); no advisor “quick fixes” migrations without authorize.

---

## Next gate

**STOP.**

- Do **not** begin Device Certification.  
- Do **not** begin Authenticated Regression Testing.  
- Do **not** authorize UX-012 / OPS / AUTH / COM / FIN-003.

Await explicit Product Owner authorization for the next M0 closeout task.
