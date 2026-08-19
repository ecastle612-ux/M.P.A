# 229 — SEC-001 Final Auth Controls Production Recertification

**Title:** SEC-001 FINAL AUTH CONTROLS — PRODUCTION RECERTIFICATION  
**Status:** **BLOCKED — SEC-001 FINAL AUTH CONTROLS**  
**Date:** 2026-08-19  
**Authority:** Owner authorization — complete and verify only the three remaining SEC-001 Auth controls, then recertify.  
**Stage 1 (in-repo only):** [docs/226-SEC](../226-sec-001-pre-onboarding-security-remediation/index.md)  
**Stage 2 (migration + deploy + WAF; Auth BLOCKED):** [docs/228](../228-sec-001-stage2-production-certification/index.md)  
**Preserved SignWell records:** [docs/226](../226-signwell-production-release-uat/index.md) · [docs/227](../227-signwell-production-webhook-certification/index.md)

Docs/228 remains **BLOCKED** and is not rewritten as PASS.

No new database migration. No application deploy.

---

## History (preserved)

| Stage | Record | Meaning |
|-------|--------|---------|
| 1 | docs/226-SEC | SEC-001 implemented **in-repo only** |
| 2 | docs/228 | Production migration + SHA `589acd59` + WAF Rules 1–4 applied; certification **BLOCKED** on three Auth controls |
| 3 | **this file** | Auth Management API reached. **Minimum password length is now 12.** Leaked-password **not** enabled (Free plan 402). Operator TOTP still **0** factors. |

---

## Verdict

**BLOCKED — SEC-001 FINAL AUTH CONTROLS**

| Control | Result |
|---------|--------|
| Supabase Auth minimum password length | **12** — verified by `GET /v1/projects/vahnmcrpnuggxkivynvo/config/auth` after `PATCH` |
| Application new-password contract | **12** — aligned; 11-char claim-password still `400 invalid_request` |
| Existing UAT PM sign-in | **200** after the min-12 change (password length 24; no MFA challenge) |
| Leaked-password protection | **Still OFF** — `PATCH password_hibp_enabled=true` returned **402** “available on Pro Plans and up.” Org plan is **free** |
| Security advisor | `auth_leaked_password_protection` still **WARN** |
| Operator TOTP | **0** factors in `auth.mfa_factors`. TOTP enroll/verify remain enabled; project-wide MFA was **not** turned on |

**Exact remaining Owner actions:**

1. Upgrade organization `sliklpnsnvpkeatmlriw` / project `mpa-prod` to **Pro or higher**, then resume so leaked-password can be enabled and the advisor re-checked.  
2. Enroll a **verified** Authenticator TOTP factor for the single platform operator only. Do not enable MFA for all users. Do not send seeds or recovery codes.

This agent will not change billing on its own.

**STOP.** No M5. No July unfreeze. No pricing. No real customer. No SignWell send or expansion.

---

## 1. Pre-mutation Auth config (authoritative GET)

| Field | Before this package’s PATCH |
|-------|-----------------------------|
| `password_hibp_enabled` | `false` |
| `password_min_length` | **6** |
| `password_required_characters` | null (unchanged) |
| `mfa_totp_enroll_enabled` | true |
| `mfa_totp_verify_enabled` | true |
| `mfa_phone_enroll_enabled` | false |
| Org plan | **free** |
| MFA factors | 0 |

First stored secret was a publishable key (rejected). Replacement PAT (`sbp_...`) authenticated `GET`/`PATCH` successfully. Token values are not recorded.

---

## 2. Mutations performed

| Call | Result |
|------|--------|
| `PATCH { password_hibp_enabled: true, password_min_length: 12 }` | **402** — HIBP requires Pro+; **no** fields applied from this combined body |
| `PATCH { password_min_length: 12 }` | **200** — min length applied |
| Authoritative `GET` after | `password_min_length=12`, `password_hibp_enabled=false` |
| MFA enroll | **none** by this agent |
| Migration / deploy / WAF / SignWell / Stripe | **none** |

---

## 3. Verification

| Check | Result |
|-------|--------|
| Auth min length | **12** |
| App contract | **12** |
| Claim-password 11-char | **400** `invalid_request` |
| UAT Property Demo PM grant | **200**, access token issued, no MFA challenge |
| Admin unauthenticated | **401** |
| Unsigned SignWell | **401** |
| Live deploy | `dpl_Ao7jbM9xbiokNWZQ7yLcjskF6YwX` / SHA `589acd59` (unchanged) |
| Stamp `20260818210000` | present |
| Advisor leaked-password | WARN |

---

## 4. Tenant / staff MFA

TOTP is **available** (`mfa_totp_enroll_enabled=true`) and **not** required for all users. UAT PM login has no MFA challenge. Phone/WebAuthn enroll remain disabled.

---

## 5. What was not mutated

- No second migration  
- No Production deploy  
- No SignWell destination / document  
- No Stripe / Checkout / Connect / FIN-OPS / AutoPay / SaaS pricing  
- No application `MIN_PASSWORD_LENGTH` change  
- No global password reset  
- No Pro plan upgrade  
- No project-wide MFA requirement  

---

## Next Owner gate

Resume this package only after Pro (or higher) is active and/or a verified operator TOTP factor exists. Update **this** record. Do not rewrite docs/228 as PASS.
