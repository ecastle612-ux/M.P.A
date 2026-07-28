# RC1 Final Production Readiness & Beta Authorization Report

**Type:** Release Candidate certification (operational)  
**Date:** 2026-07-28 (UTC)  
**Branch:** `release/rc1`  
**Final release commit SHA:** `8886790c284d50c510cdb2b84aaf359b7c5633a7`  
**Production deployment:** `dpl_42or57S16d5iKpJXkoFRduwMjV4K`  
**Canonical host:** https://www.my-property-assistant.com  
**Vercel project:** `m-p-a-web`  
**Database:** `mpa-prod` (`vahnmcrpnuggxkivynvo`)  
**Policy:** No new features; ops/deploy/cert only

---

## 1. Executive summary

RC1 source control and Production deployment succeeded. Public acquisition surfaces (landing, tour, pricing, Checkout intent) are live on the canonical host. Stripe SaaS Checkout **session creation** works against Production. Resend domain `my-property-assistant.com` is verified with historical delivered transactional mail. AUTH/COM/OPS/FAC migrations are attested on `mpa-prod`.

**Not closed for Limited Production:** full Stripe SaaS operator runbook (paid card → webhook → provision → credential email → Guided Setup → portal lifecycle), SignWell e-sign (provider still `noop`; zero `signature_requests` on prod), and Commercial Launch governance authorization.

**Recommendation: READY FOR LIMITED BETA**

---

## 2. Deployment status (RC1-1 / RC1-2)

| Gate | Result | Evidence |
|------|--------|----------|
| Push `release/rc1` | **PASS** | `origin/release/rc1` @ `8886790c284d50c510cdb2b84aaf359b7c5633a7` |
| Commit history | **PASS** | Ship tree `a1e21b4` + closeout SHA note `8886790` |
| Vercel Production deploy | **PASS** | `dpl_42or57S16d5iKpJXkoFRduwMjV4K` · Ready · aliased to `www.my-property-assistant.com` + `m-p-a-web.vercel.app` |
| Build | **PASS** | Remote Next.js build completed; routes include `/pricing`, `/acquire/*`, `/facility/*`, portals |
| Static assets | **PASS** | Fonts/preloads served; HTTP 200 on marketing shells |
| Server startup | **PASS** | Deployment Ready; no startup failure on inspect |
| Apex → www | **PASS** | `my-property-assistant.com` → 308 → www |
| Auth-gated routes | **PASS** | `/dashboard`, `/facility`, portals, CRUD → 307 (login redirect) |

---

## 3. Environment verification (RC1-3)

Compared Vercel Production env **names/presence** to RC1 matrix (values redacted).

| Area | Status | Notes |
|------|--------|-------|
| App URL / MPA meta | **PASS** | `NEXT_PUBLIC_APP_URL=https://www.my-property-assistant.com`; `NEXT_PUBLIC_MPA_ENV=production`; design-partner mode `true`; version still `1.0.0-beta` (acceptable for Limited Beta) |
| Supabase | **PASS** | URL points at `mpa-prod`; anon + service role present |
| SaaS Stripe | **PASS (presence)** | `SAAS_BILLING_PROVIDER`, secret, SaaS webhook secret, trial days, Founder/Pro/Business price IDs present |
| Rent Stripe | **PASS (presence)** | Payment rail vars present |
| Resend | **PASS (presence + domain)** | `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_ENVIRONMENT` present; domain verified |
| OneSignal | **PASS (presence)** | App ID + API key present; commercial push cert abandoned (known High) |
| SignWell | **FAIL** | `SIGNATURE_PROVIDER=noop`; `SIGNWELL_*` vars **missing**; legacy `DROPBOX_SIGN_*` still present |
| Dev bootstrap password | **PASS** | `DEV_MASTER_ADMIN_PASSWORD` unset |
| Deprecated / unused | **Observation** | Dropbox Sign env leftovers; SignWell not wired |

**Missing for RC1 e-sign:** `SIGNWELL_API_KEY`, `SIGNWELL_WEBHOOK_ID`, `SIGNWELL_MODE`, `SIGNWELL_ALLOW_SIMULATE`, and `SIGNATURE_PROVIDER=signwell`.

---

## 4. Stripe certification (RC1-4)

Operator runbook: [rc1-stripe-saas-operator-runbook.md](./rc1-stripe-saas-operator-runbook.md)

| Step | Result | Evidence |
|------|--------|----------|
| Preflight env presence | **PASS** | SaaS price IDs + webhook secret + secret key present |
| Sandbox simulate disabled in Production | **PASS** | `POST /api/acquire/checkout/simulate` → 403 outside sandbox/noop |
| Create Trial/Pro Checkout Session | **PASS** | `POST /api/acquire/checkout` → **201** with `checkout.stripe.com` session URL |
| Pricing UI | **PASS** | https://www.my-property-assistant.com/pricing loads Trial/Pro/Business/Enterprise |
| Acquire start form | **PASS** | `/acquire/start` company + work email → Continue to Stripe Checkout |
| Complete paid/trial card Checkout | **FAIL / OPS PENDING** | Requires human card + Stripe Dashboard; Stripe MCP auth timed out twice |
| Webhook processed once | **PARTIAL** | DB has `saas_webhook_events` (**24** rows); **0** `commercial_activation_requests` — public self-serve activation ledger unused/unproven for a completed buyer |
| Duplicate webhook ignore | **NOT APPLICABLE** | Not re-run live in this cert window |
| Org + admin credential email | **NOT APPLICABLE** | Depends on completed Checkout |
| Guided Setup → Active → Dashboard | **NOT APPLICABLE** | Depends on completed Checkout |
| Upgrade / Downgrade / Cancel / Reactivate | **NOT APPLICABLE** | Requires live Customer Portal walk after paid sub |

**Stripe engineering verdict:** Checkout create path **PASS**.  
**Stripe commercial operator verdict:** **INCOMPLETE** until runbook steps 1–7 signed with live/test card.

---

## 5. SignWell certification (RC1-6)

| Check | Result | Evidence |
|-------|--------|----------|
| API connectivity | **FAIL** | Provider configured as `noop` |
| Document send | **FAIL** | No live SignWell credentials in Production env |
| Recipient email | **FAIL** | Blocked by provider |
| Signature completion | **FAIL** | — |
| Webhook processing | **FAIL** | No SignWell webhook id configured |
| Completed PDF / Vault / audit / notifications | **FAIL** | `signature_requests` count on prod = **0** |

**SignWell:** **NOT READY** for beta workflows that require e-sign. Ops must set SignWell env and re-cert before marketing lease signing as live.

---

## 6. Email verification (RC1-5)

| Check | Result | Evidence |
|-------|--------|----------|
| Domain | **PASS** | Resend domain `my-property-assistant.com` · **verified** · sending enabled |
| Welcome / invitation / notification templates | **PASS (historical)** | Resend list shows delivered EML-001 / EML-001b welcome, invitation, work-order, statements (2026-07-20) |
| Password reset | **PASS (historical)** | Delivered “Reset your password” (2026-07-20) |
| Contact verify | **PASS (historical)** | Delivered “Confirm your email address” (2026-07-22) |
| RC1 live credential email after Checkout | **NOT APPLICABLE** | No completed public Checkout in this cert |
| Signature request email | **NOT APPLICABLE** | SignWell not enabled |

---

## 7. Business simulation results (RC1-7)

### Method

Production HTTP smoke + live Checkout session create + DB inventory. Authenticated multi-role deep walks were **not** completed without operator credentials (no new feature work; no seed password injection).

### Org Admin (subscribe → org → setup → activate → invite)

| Step | Result |
|------|--------|
| Subscription / pricing / Checkout intent | **PASS** (UI + session create) |
| Org provision after payment | **FAIL / PENDING** (no completed Checkout → 0 activation rows) |
| Guided Setup / Activation / Invite | **NOT APPLICABLE** this window |

### Property Manager (property → lease → signature → activation → reporting)

| Step | Result |
|------|--------|
| Auth gate to Ops | **PASS** (307 to login) |
| Existing portfolio data on prod | **PASS** (8 properties, 18 leases) |
| Electronic signature | **FAIL** (SignWell noop) |
| Reporting surfaces | **NOT APPLICABLE** (auth required; not entered) |

### Tenant / Owner / Facility Technician

| Journey | Result |
|---------|--------|
| Portal routes exist & gated | **PASS** (307) |
| Work orders exist in DB | **PASS** (17 WOs) |
| Invitation path | **PARTIAL** (4 invitations in DB; live send not re-run) |
| Full portal UX walk | **NOT APPLICABLE** without credentials |

### Billing lifecycle

| Step | Result |
|------|--------|
| Public Checkout session | **PASS** |
| Entitlement / renewal / cancel via Portal | **NOT APPLICABLE** without paid sub |

### Production data snapshot (`mpa-prod`)

| Entity | Count |
|--------|------:|
| Organizations | 13 |
| Memberships | 22 |
| Properties | 8 |
| Leases | 18 |
| Work orders | 17 |
| Invitations | 4 |
| SaaS webhook events | 24 |
| Commercial activation requests | 0 |
| Signature requests | 0 |

---

## 8. Remaining launch blockers (RC1-8)

| Severity | ID | Item | Blocks |
|----------|----|------|--------|
| **Critical** | C3 | Full Stripe SaaS operator runbook (card → webhook → provision → email → setup) unsigned | Self-serve paying / Limited Production |
| **Critical** | SW1 | SignWell not enabled (`SIGNATURE_PROVIDER=noop`, missing `SIGNWELL_*`) | Any beta promising live e-sign |
| **High** | H1 | Commercial Launch not authorized (governance) | Limited Production / GA |
| **High** | H2 | Push commercial cert abandoned | Marketing push reliability |
| **High** | H3 | Owner payout transfers kill-switched | Owner money-out |
| **Medium** | M1 | `NEXT_PUBLIC_MPA_VERSION` still `1.0.0-beta` | Labeling only |
| **Medium** | M2 | Legacy Dropbox Sign env present | Confusion / hygiene |
| **Medium** | M3 | Authenticated E2E role simulation not run this window | Confidence gap |
| **Low** | L1 | Manager Portal FutureRelease | Sales language |

Cosmetic UI issues: **none elevated**.

---

## 9. Production risks

1. **Self-serve Checkout without completed operator walk** — session create works; end-to-end provision unproven (`commercial_activation_requests` = 0).  
2. **E-sign marketed while noop** — trust failure if lease signing promised.  
3. **Stripe MCP unavailable during cert** — slows webhook/event reconciliation from agent tooling.  
4. **Design-partner mode still on** — appropriate for Limited Beta; remove only after Commercial Launch authorize.

---

## 10. Recommended release decision

# READY FOR LIMITED BETA

**Justification**

- RC1 branch pushed and Production deployment Ready on the canonical domain.  
- Acquisition marketing + Checkout session creation verified live.  
- Email domain verified; historical transactional delivery proven.  
- Core schema for AUTH/COM/OPS/FAC attested on Production.  
- Remaining Critical items are **ops configuration / live payment completion / SignWell enablement**, not missing RC1 application code.

**Not** READY FOR LIMITED PRODUCTION — Critical C3 Stripe runbook incomplete; SignWell Critical for e-sign buyers; Commercial Launch unauthorized.  
**Not** READY FOR GENERAL AVAILABILITY.

### Required before Limited Production

1. Complete and sign [Stripe SaaS operator runbook](./rc1-stripe-saas-operator-runbook.md) on Production (or designated prod-beta).  
2. Configure SignWell (`SIGNATURE_PROVIDER=signwell` + keys/webhook) and re-run RC1-6.  
3. Authenticated role-path smoke (Org Admin → PM → Tenant → Owner → Tech).  
4. Issue Commercial Launch authorize (H1).

### Allowed now (Limited Beta)

Ops-supervised design-partner orgs; avoid promising live e-sign or unattended self-serve billing until C3/SW1 close.

---

**Stop:** No further Version 1.0 feature work (including SIGN-002 Slice B) until Product authorizes next scope after this certification.
