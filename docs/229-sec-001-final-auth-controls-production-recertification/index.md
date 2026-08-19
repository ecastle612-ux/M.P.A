# 229 — SEC-001 Final Auth Controls Production Recertification

**Title:** SEC-001 FINAL AUTH CONTROLS — PRODUCTION RECERTIFICATION  
**Status:** **BLOCKED — SEC-001 FINAL AUTH CONTROLS**  
**Date:** 2026-08-19  
**Authority:** Owner authorization — complete and verify only the three remaining SEC-001 Auth controls, then recertify.  
**Stage 1 (in-repo only):** [docs/226-SEC](../226-sec-001-pre-onboarding-security-remediation/index.md)  
**Stage 2 (migration + deploy + WAF; Auth BLOCKED):** [docs/228](../228-sec-001-stage2-production-certification/index.md)  
**Preserved SignWell records:** [docs/226](../226-signwell-production-release-uat/index.md) · [docs/227](../227-signwell-production-webhook-certification/index.md)

Docs/228 remains **BLOCKED** and is not rewritten as PASS.

This package applied **no** new migration and **no** application deploy.

---

## History (preserved)

| Stage | Record | Meaning |
|-------|--------|---------|
| 1 | docs/226-SEC | SEC-001 implemented **in-repo only** |
| 2 | docs/228 | Production migration + SHA `589acd59` + WAF Rules 1–4 applied; certification **BLOCKED** on three Auth controls |
| 3 | **this file** | Attempted those three Auth controls; still **BLOCKED** — Management API / Dashboard / operator TOTP were not available to this agent |

---

## Verdict

**BLOCKED — SEC-001 FINAL AUTH CONTROLS**

Stage 2 Production security surfaces remain intact. The three remaining Auth controls were **not** applied or verified.

| Control | This run |
|---------|----------|
| Leaked-password protection | **Still OFF** — advisor `auth_leaked_password_protection` WARN |
| Supabase Auth minimum password length 12 | **Dashboard value still unread / unchanged** |
| Operator TOTP MFA | **Still 0 factors** |

**Exact stop point:** this environment cannot mutate Production Auth config and cannot complete TOTP without the Owner.

1. Add a Supabase Management API personal access token as `SUPABASE_ACCESS_TOKEN` (do not paste it into chat). This agent can then `PATCH /v1/projects/vahnmcrpnuggxkivynvo/config/auth` with `password_hibp_enabled: true` and `password_min_length: 12` only.  
2. Enroll Authenticator TOTP for the **single** active platform operator. Do **not** enable project-wide MFA. Do not send seeds, QR secrets, or recovery codes.

No application source change is required. **Do not deploy** for this package.

**STOP.** No M5. No July unfreeze. No pricing. No real customer. No SignWell send or expansion.

---

## 1. Pre-mutation state (2026-08-19)

Matches docs/228. No material drift.

| Item | Value |
|------|--------|
| Project | `mpa-prod` / `vahnmcrpnuggxkivynvo` · `ACTIVE_HEALTHY` |
| Live deploy | `dpl_Ao7jbM9xbiokNWZQ7yLcjskF6YwX` · SHA `589acd591836fc240817c62c892ed17272f081bd` |
| Migration `20260818210000` | **applied** (`docs_226_sec_001_security_hardening`) |
| Leaked-password | OFF (advisor WARN) |
| Auth min length | unverified via public `/auth/v1/settings` |
| Application new-password contract | 12 |
| Active platform operators | **1** (`f68545ab-8ed0-46df-b7b0-6d72f97a6c55`) |
| MFA factors | **0** |
| July freeze | ON |
| Tenant execution TRUE | 0 |

Dashboard attempt: `https://supabase.com/dashboard/project/vahnmcrpnuggxkivynvo/auth/providers` redirected to the sign-in wall. No credentials were used.

Management API `GET /v1/projects/.../config/auth` without a PAT returns **401**. Service role cannot change Auth project settings. Supabase MCP has no Auth-config write tool.

---

## 2–4. Auth mutations

**None performed.**

No leaked-password enable. No min-length PATCH. No MFA factor created. No TOTP seed stored.

---

## 5. Short Stage 2 regression (non-destructive)

| Check | Result |
|-------|--------|
| Live `data-dpl-id` | `dpl_Ao7jbM9xbiokNWZQ7yLcjskF6YwX` |
| Stamp `20260818210000` | present |
| SignWell policies | only `signwell_webhook_events_operator_select` |
| Unsigned SignWell POST | **401** `Invalid webhook signature` |
| SignWell hook | exactly `/api/leasing/webhooks/signwell` (1 hook) |
| Admin unauthenticated | **401** |
| Admin as UAT PM cookie | **403** |
| Claim-password 11-char | **400** `invalid_request` |
| UAT PM password grant | **200** (no MFA challenge) |
| WAF Rules 1–4 | enabled; `firewallEnabled: true`; updated `2026-08-19T16:39:51.548Z` |
| July freeze | ON |
| M5 / tenant execution | not executed / 0 TRUE |

Webhook and PM cron paths remain outside WAF Rules 1–4. Stripe endpoints were not modified.

---

## 6. Tenant / staff MFA

UAT Property Demo PM signed in with a password grant and received an access token **without** an MFA challenge. Project-wide MFA required was **not** enabled.

---

## 7. What was not mutated

- No second migration  
- No Production deploy  
- No SignWell destination / document  
- No Stripe / Checkout / Connect / FIN-OPS / AutoPay / pricing  
- No application password-contract change  
- No global password reset  

---

## Next Owner gate

After the PAT is available and/or operator TOTP is verified, resume this package (do not start another feature). Then update **this** record — do not rewrite docs/228 as PASS.

Acceptable later verdicts for this file:

- `PASS — SEC-001 PRODUCTION SECURITY REMEDIATION CERTIFIED`  
- remain `BLOCKED — SEC-001 FINAL AUTH CONTROLS` if verification still fails
