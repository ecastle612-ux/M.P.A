# 178 — Full Customer Launch-Readiness Audit

**Status:** Audit complete — no implementation  
**Date:** 2026-08-17  
**Verdict:** **CONDITIONALLY READY — FIX BEFORE MARKETING**  
**Production SHA inspected:** `883437107f7067c6c8c8c78f417f7e3345ba1192`  
**Method:** Current repository, existing certification, automated tests, and read-only Production HTTP inspection. No invitations created. No finance writes. No Stripe, SKU, RLS, RBAC, July, or permission changes. No deploy.

Identifier note: **COM-002** in older commercial docs means Self-Service Commercial. **COM-002** in tenant-comms docs means Tenant Communication Center (ADR-024). This record uses the current product names.

---

## Verdict

**CONDITIONALLY READY — FIX BEFORE MARKETING**

A brand-new paying subscriber can discover the three products, see honest catalog prices, enter Stripe SaaS Checkout, and — if they complete the **email claim** path — reach Guided Setup and the correct product home. Property Operations, Facility Operations, Complete, tenant lifecycle, branded email, and PWA are live on this Production SHA.

Launch is **not blocked** by a confirmed data-exposure or money-mutation defect.

Launch is **not ready to market** until presentation and first-subscriber journey gaps are closed: residual tenant/staff pay CTAs while Stripe execution is off, Collections UI that still offers M5 actions, post-checkout claim that fails without the email bind token, missing staff offboarding UI, and missing public legal pages.

---

## 1. Executive summary

M.P.A. is a real, operable three-product SaaS on Production SHA `88343710`. Visual polish, branded Resend, Gmail dark-mode (Owner-verified), tenant lifecycle (schema + application, PR #276), FIN-OPS operational writes, and PWA-only install are live. Tenant Stripe payment execution and M5 collections automation remain correctly **off** at the API/DB layer.

The gap is **customer honesty and first-run completeness**, not “the product is fake.”

| Question | Answer |
|----------|--------|
| Can a stranger find PM / FO / Complete and the $59 / $59 / $109 prices? | Yes |
| Can they start SaaS Checkout (not tenant rent pay)? | Yes, quote → Confirm Plan → Stripe |
| Can they finish Create Account without opening email? | No — bind token is email-only (STAB-002) |
| Can they operate PM / FO / Complete after claim? | Yes, with SKU + operating-scope isolation |
| Can they run Add Tenant → portal → Move Out? | Yes in current Production app + schema (Owner UAT passed) |
| Will they think tenant card pay or collections automation is live? | Risk: yes — UI still offers Pay now / Collect rent / Assess late fees |
| Is there a confirmed P0 data leak? | No |

docs/175’s statement that Production application remains on `867c579b` is **stale**. Tenant-lifecycle application commit `1f9be880` and PR #276 are ancestors of `88343710`.

---

## 2. P0 launch blockers

**None identified** for actual data exposure, unauthorized money mutation, July thaw, dual-write, or enabling Stripe tenant execution / M5.

Resident finance APIs are excluded from SKU middleware by design; lease-self checks + RLS are the boundary (`packages/shared/src/commercial/api-entitlements.test.ts`). That is an architecture watch item, not a demonstrated leak.

---

## 3. P1 fix-before-marketing issues

### P1-01 — Tenant Billing still offers “Pay now” while execution is off

| Field | Detail |
|-------|--------|
| Surface | Tenant Portal `/portal/tenant/billing` — `ResidentBillingPortal` |
| Expected | While Stripe **tenant** payment execution is off, do not present online pay as an available action (Owner decision; nav already says Billing, not Pay rent) |
| Actual | Button **Pay now** remains. `onlinePaymentsEnabled` is `isStripeConfigured()` (`STRIPE_SECRET_KEY` present), **not** `stripe_payment_execution_enabled`. SaaS Checkout uses the same secret, so Production likely **enables** the button. Checkout then 403s `stripe_payment_execution_disabled`. `canPay` from occupancy is unused. |
| Severity | P1 |
| Evidence | `apps/web/src/components/finance/resident-billing-portal.tsx`; `apps/web/src/app/api/finance/resident/billing/route.ts`; `apps/web/src/app/api/finance/checkout/route.ts`; `apps/web/src/lib/finance/checkout-authz.ts` |
| Smallest fix | Drive the button from `stripe_payment_execution_enabled === true` **and** occupying access. If false, hide Pay now (keep balances / history / receipts). Do not enable Stripe execution. |

### P1-02 — Staff FIN-OPS still says “Collect rent”

| Field | Detail |
|-------|--------|
| Surface | `/pm/financial-operations`, Finance Desk, Leasing command center |
| Expected | Operational finance: charges, manual payments, allocations, receipts. No live tenant card checkout. |
| Actual | Primary CTA **Collect rent**. Desk copy tells staff to send residents to “Billing → Pay now”. |
| Severity | P1 |
| Evidence | `apps/web/src/components/finance/financial-operations-command-center.tsx`; `apps/web/src/components/finance/finance-desk.tsx`; `apps/web/src/components/leasing/lease-command-center.tsx` |
| Smallest fix | Rename to Record payment / Open balances. Point to manual payment + history. Do not enable Stripe. |

### P1-03 — Collections desk presents M5 actions as live

| Field | Detail |
|-------|--------|
| Surface | FIN-OPS Collections desk |
| Expected | M5 disabled: no assess-late-fee / sync-delinquency / arrangement / reminder **mutations** as available actions. |
| Actual | Enabled buttons POST `sync_delinquency`, `assess_late_fees`, `policy`, reminders. API returns `403 finance_m5_not_authorized` after auth. Assistant copy still recommends assessing late fees. |
| Severity | P1 |
| Evidence | `apps/web/src/components/finance/collections-desk.tsx`; `apps/web/src/lib/finance/m5-hard-stop.ts`; `apps/web/src/app/api/finance/collections/route.ts` |
| Smallest fix | Read-only aging/overdue view. Hide or disable mutate buttons with honest “not available” copy. Do not implement M5. |

### P1-04 — Post-checkout claim requires email bind token; in-browser CTA omits it

| Field | Detail |
|-------|--------|
| Surface | `/checkout/success` → `/commerce/continue` → `/login?mode=sign_up` |
| Expected | Paying customer can finish Create Account on the designed path without a developer error. |
| Actual | Password set requires `bindToken` (STAB-002). Token plaintext is **only** in the Resend verification email. Success “Continue to claim workspace” has no `bind_token` and does not say “open the email.” Continue “Set password & claim workspace” without token → `401 bind_token_required`. Login maps that string through as raw API text. |
| Severity | P1 (P0 only if Resend is down; Production Resend is working) |
| Evidence | `apps/web/src/app/api/commerce/provision/claim-password/route.ts`; `apps/web/src/lib/saas-provisioning/run-provisioning.ts` `ensureClaimEmail`; `apps/web/src/components/marketing/checkout-success-page.tsx`; `apps/web/src/components/shell/login-form.tsx` |
| Smallest fix | Success/Continue copy: “Open the email we just sent to set your password.” Map `bind_token_required` to that sentence. Optional: resend-claim-email control. Do not drop the bind-token check. |

### P1-05 — Guided Setup manual org create always assigns Property Manager

| Field | Detail |
|-------|--------|
| Surface | `/setup` create-organization form; `POST /api/organizations` |
| Expected | A FO/Complete purchaser who reaches Setup without a provisioned org does not get an unpaid PM org. |
| Actual | Non-operator create always sets `mpa_property_manager`. Form copy says the purchased product is confirmed. Appears when `hasOrg` is false (failed/skipped claim). |
| Severity | P1 |
| Evidence | `apps/web/src/app/api/organizations/route.ts`; `apps/web/src/components/commercial/guided-setup-page.tsx` |
| Smallest fix | Hide manual create when a commerce session exists; or refuse create and send the user back to the claim email. Do not change SKU catalog. |

### P1-06 — No customer-facing staff offboarding

| Field | Detail |
|-------|--------|
| Surface | `/settings/team` |
| Expected | Admin can deactivate / remove a staff member after a bad invite or departure. |
| Actual | Invite + scope edit only. `PATCH` membership `inactive` exists on the API; Team UI does not expose it. |
| Severity | P1 |
| Evidence | `apps/web/src/components/team/team-invite-panel.tsx`; `apps/web/src/app/api/organizations/[organizationId]/memberships/route.ts` |
| Smallest fix | Add Deactivate on the existing membership row (API already supports `inactive`). |

### P1-07 — Subscribers cannot self-serve card update or plan/cycle change

| Field | Detail |
|-------|--------|
| Surface | `/billing` |
| Expected | After paying, customer can update card and understand they cannot self-swap SKU/cycle in-app. |
| Actual | `COM_002_FLAGS.sliceF_customerPortal = false`. `POST /api/commerce/subscription/change-plan` always 409. Cancel-at-period-end and reactivate exist. Cancel page claims “Duplicate subscriptions are prevented automatically” without an existing-subscriber Checkout guard. |
| Severity | P1 |
| Evidence | `packages/shared/src/commercial/commerce-flags.ts`; `apps/web/src/app/api/commerce/subscription/change-plan/route.ts`; `apps/web/src/components/marketing/checkout-cancel-page.tsx` |
| Smallest fix | Honest Billing copy (“contact support to change card / plan”). Soften duplicate-subscription claim. Customer Portal is a later approved slice — do not enable it from this audit. |

### P1-08 — No public Privacy Policy or Terms

| Field | Detail |
|-------|--------|
| Surface | Production `https://www.my-property-assistant.com/privacy`, `/terms`, `/legal` |
| Expected | Public legal pages before marketing paid signup. |
| Actual | HTTP **404**. Marketing chrome does not link them (no dead footer link). Stripe Checkout has Stripe’s terms only. |
| Severity | P1 (legal/marketing, not product safety) |
| Evidence | Read-only Production HEAD 2026-08-17; no `/privacy` or `/terms` routes under `apps/web/src/app` |
| Smallest fix | Publish Owner-approved Privacy + Terms pages and link them from marketing chrome + Checkout. Content is a Product Owner / counsel task. |

### P1-09 — FO/Complete Checkout readiness gate only checks PM + unit-block Price env

| Field | Detail |
|-------|--------|
| Surface | `POST /api/commerce/checkout` |
| Expected | FO/Complete fail closed with a clear “prices not configured” if their Price IDs are missing. |
| Actual | `unitVolumeCheckedReadyEnvKeys()` lists PM base + unit blocks only. FO/Complete can pass the gate and fail later with a PM-keyed message. docs/69 recorded all eight Prices present in an earlier Production release — reconfirm on this SHA before ads. |
| Severity | P1 |
| Evidence | `packages/shared/src/commercial/unit-volume-stripe.ts`; `apps/web/src/app/api/commerce/checkout/route.ts`; `docs/69-final-commercial-production-release/index.md` |
| Smallest fix | Include FO + Complete monthly/annual keys in the readiness list. Do not change Price IDs. |

### P1-10 — Work-order in-app inbox may still be missing in Production

| Field | Detail |
|-------|--------|
| Surface | In-app maintenance notifications |
| Expected | EMAIL + IN-APP for critical work-order keys. |
| Actual | docs/176 (2026-08-17): Production `maintenance_notifications` relation **absent**. Email still attempted for critical keys; in-app WO rows skipped. Not re-queried in this audit (no Production SQL). |
| Severity | P1 |
| Evidence | `docs/176-notification-delivery-audit-fix/index.md`; `apps/web/src/lib/maintenance/lifecycle-notify.ts` |
| Smallest fix | Operator read-only check. If still absent, apply the already-designed notification table — that is a separate approved package, not this audit. |

---

## 4. P2 post-launch improvements

| ID | Surface | Issue | Smallest later fix |
|----|---------|-------|-------------------|
| P2-01 | `/pricing` | PM card headline stays `$59/month` when Annual is selected; FO/Complete switch | Bind PM card to the same cycle toggle |
| P2-02 | Marketing funnel | Step counts differ (pricing 6 vs questionnaire 4) | One shared step list |
| P2-03 | FIN-OPS command center | “Implementation progress” shows S4–S6 blocked | Hide internal slice status from customers |
| P2-04 | Residents | Dual **Add Tenant** and legacy **Add resident** | Prefer Add Tenant; hide legacy after Owner confirm |
| P2-05 | Tenant home | Glance still says “Rent status” | Say Balance / Billing |
| P2-06 | Auth SMTP | Password-reset HTML is not the branded Resend shell | Separate Auth SMTP package (do not mix with Resend) |
| P2-07 | Complete technicians | Land on `/launcher` (extra hop) | Optional role home — needs design approval |
| P2-08 | Moved-out maintenance page | Historical WOs visible; new request fails at API without page copy | One sentence: historical only |
| P2-09 | Env | Set Production `RESEND_FROM_EMAIL` = `EMAIL_FROM` (docs/176 optional) | Vercel env only; app already falls back |
| P2-10 | docs/37 | Stale Pro/Business / “trial N/A” | Doc refresh only |
| P2-11 | Checkout test | `checkout.route.test.ts` expects 503 when Prices absent; fails if env has Prices | Test isolation |
| P2-12 | FO naming | Sites are properties reused as buildings | Copy only |

---

## 5. PM readiness

**Ready to operate** after a successful claim + Guided Setup.

Live: Mission Control, properties/units, leasing, residents, Add Tenant, invitations, maintenance, vendors, documents, communications, FIN-OPS operational desks, reports. Nav is entitlement-filtered. Empty states exist (`ownerEmptyStateCopy`). Capital Projects are not in customer nav.

Gaps: P1-02, P1-03, P1-06, P2-03, P2-04. Do not market “collect rent online.”

---

## 6. FO readiness

**Ready to operate** as work-order facility operations, not a full CMMS.

Live: FO Mission Control, operations, category queues (preventive, inspections, safety, compliance, parts, systems), assets, inventory/stock, FO vendors, reports, media attachments, shared documents/comms (staff plane).

FO-only SKU **does not** receive PM leasing, residents, tenant portal staff, or FIN-OPS money. Tests: `packages/shared/src/commercial/commercial.test.ts`, `packages/shared/src/auth/operating-scope.test.ts`, `apps/web/src/lib/finance/checkout-authz.test.ts`, `apps/web/src/lib/communications/conversation-authz.test.ts`, `apps/web/src/lib/facility/fo-no-shells.test.ts`.

docs/27 original FO NO-GO is historical. Marketing truth tests forbid overclaiming CMMS depth.

---

## 7. Complete readiness

**Ready** as one organization / one subscription with `/launcher` home.

Property Operations and Facility Operations groups coexist. Operating scope `property_operations` | `facility_operations` | `both` narrows nav and APIs (docs/127, ADR-033). Complete FO-scoped staff denied PM finance. Invitation requires operational responsibility.

Gaps: P1-05 if claim fails; P2-07 launcher hop for technicians.

---

## 8. Tenant lifecycle readiness

**Ready** on current Production SHA (application + schema). Owner UAT: Add Tenant / invitation / acceptance / Move Out passed. This audit did **not** create invitations.

Conceptual path is implemented: Add Tenant → Resend invite → accept/bind → Tenant Portal → optional PWA (active occupancy only) → maintenance / messages / documents / Billing → Move Out → historical portal. Occupancy isolation tested (`occupancy.test.ts`, checkout requires current occupancy).

Nav/home labels say **Billing**, not Pay rent (`tenant-portal-billing-copy.test.ts`). Residual **Pay now** is P1-01.

docs/175 “app still `867c579b`” is obsolete relative to `88343710`.

---

## 9. Finance readiness

**Ready for operational finance only.**

| Control | State | Evidence |
|---------|-------|----------|
| Charges / manual payments / allocations / receipts / balances / reports | Implemented; staff via PLAT-006 | `billing-service`, finance routes, docs/159–162 |
| July | Frozen (`july_freeze_enabled`) | docs/175 pre-apply (not re-queried) |
| FIN-OPS writes | `finance_ops_writes_enabled() = true` | docs/168–175 |
| Dual-write | Forbidden | M3 guards + tests |
| Stripe **tenant** execution | OFF (`stripe_payment_execution_enabled` must be `true`) | `checkout-authz.ts` |
| M5 mutations | Hard-stopped 403 | `m5-hard-stop.ts` |
| SaaS Stripe Checkout | Separate webhook/secret domain | `saas-checkout.ts` |

Do not market online rent pay, late-fee automation, or collections automation. P1-01–P1-03 are honesty gaps, not missing ledgers.

---

## 10. Email / notification readiness

**Ready for the wired paths.** Gmail mobile dark mode: **Owner-verified PASS** — not reopened. Lockup `https://www.my-property-assistant.com/branding/logo-email-lockup.png` HTTP 200. Sender: `resolveResendSender()` — Production never uses `resend.dev` (`packages/shared/src/env/resend.ts`, docs/176, SHA `e509136d` and later).

### Channel map

| Event | Class | Notes |
|-------|-------|-------|
| Team / tenant / vendor invitation | **EMAIL + IN-APP** | Resend branded shell; accept in app; `sent` / `failed` / `skipped`; idempotency key |
| Tenant / vendor Auth portal create | **EMAIL ONLY** | Supabase Auth SMTP (not Resend HTML) |
| Password reset / confirm email | **EMAIL ONLY** | Auth SMTP |
| Work-order assigned / started / completed / closed / cancelled / emergency; vendor assigned | **EMAIL + IN-APP** | Email if critical + preference; in-app skipped if `maintenance_notifications` absent (P1-10) |
| Staff → tenant conversation | **EMAIL + IN-APP** | |
| Tenant → staff conversation | **IN-APP ONLY** | |
| Operational notice (`comms_messages`) | **EMAIL + IN-APP** | When channel is email/both |
| Finance charge created; payment succeeded/failed; staff payment reminder | **IN-APP ONLY** | |
| Finance catalog (due_soon, past_due, vendor_*, dispute) | **NOT IMPLEMENTED** | Catalog only |
| Leasing reminder catalog (9 types) | **NOT IMPLEMENTED** | Keys registered only |
| SaaS provisioning (verification / claim) | **EMAIL ONLY** | Bind-token carrier |
| SaaS subscription lifecycle | **EMAIL ONLY** | |
| Web Push / SMS | **NOT IMPLEMENTED** | Honest on landing |

`provider_accepted` is not inbox proof. Do not promise email for every in-app event.

---

## 11. PWA / mobile readiness

**Ready** as a PWA-only product.

| Requirement | Status |
|-------------|--------|
| Browser-first; install optional | Pass — card never gates portal |
| Apple | Share → Add to Home Screen → Add (`install-experience.ts`) |
| Android | `beforeinstallprompt` or browser-menu fallback |
| Standalone possible re-login | Expected; start_url `/dashboard` |
| Native iOS/Android | Not shipped |
| Web Push | Not shipped |
| Production manifest + `sw.js` | HTTP 200 |
| Mobile landing + demo tenant Billing | Smoke PASS on this SHA |

Landing FAQ correctly denies App Store / Play / phone push.

---

## 12. Security / isolation readiness

**Ready** for the certified model; no demonstrated P0 exposure.

| Boundary | Status |
|----------|--------|
| Organization isolation | Active-org cookie + membership; STAB-001 stale-cookie clear |
| SKU entitlement | Fail-closed middleware + `require-authorized-action` (docs/94–95) |
| PM vs FO surfaces | Path + API + work_surface + RLS |
| Complete operating scope | ADR-033; FO-scoped Complete denied PM finance |
| Tenant occupancy / former tenant | Portal modes; checkout requires current occupancy; historical billing read |
| Vendor | Role + assignment; FO WOs block tenant messaging |
| Finance capabilities | PLAT-006 eight keys |
| Anonymous | Protected routes → `/login` |
| Service role | After authz on checkout; SaaS webhook ≠ FIN-OPS webhook |
| Unauthorized module URL | `/unauthorized?reason=entitlement` or `/setup` |

---

## 13. Signup / subscription / Guided Setup readiness

**Conditionally ready** — happy path works; recovery and honesty gaps are P1.

Binding flow (ADR-019) is implemented:

```
Landing → /get-started → quote → /checkout (Confirm Plan) → Stripe Checkout
→ /checkout/success → /commerce/continue → claim (email bind token)
→ /setup → PM /pm/mission-control | FO /facility/mission-control | Complete /launcher
```

| Step | Status |
|------|--------|
| Landing / modules / pricing / enterprise | Live; Enterprise is sales-only |
| Monthly / annual + 20% annual on base | `unit-volume.ts`; 30-day trial when ≤500 units |
| SaaS Checkout | Quote-authoritative; no client Price IDs |
| Cancel Checkout | `/checkout/cancel`; SKU-preserving retry |
| Existing subscriber | Cancel / reactivate; no portal; no plan swap (P1-07) |
| Past-due | Middleware → `/billing?reason=subscription` |
| Guided Setup PM / FO / Complete | SKU homes + Complete operating model |
| Return login | Setup-complete → product home |
| Forgot password | `/forgot-password` HTTP 200; Auth SMTP |
| Expired / revoked / duplicate invite | 410 / 409 / idempotent accept |

Production marketing (2026-08-17): `/` `/pricing` `/get-started` `/modules` `/enterprise` `/login` `/forgot-password` `/demo` HTTP 200. Prices `$59` / `$59` / `$109` and annual `$566` / `$1,046` present. No “Pay rent” CTA on the public landing.

---

## 14. Visual / UX readiness

**Ready enough to operate** after docs/177 Production release. Owner Gmail dark-mode PASS. Hierarchy, empty states, toasts, and FIN-OPS table polish are live.

Do not treat remaining polish as launch blockers. Remaining customer-facing confusion is **terminology** (Pay now, Collect rent, Assess late fees, Rent status, internal FIN-OPS slice list) — those are P1/P2 above, not a redesign.

Auth SMTP emails remain unbranded (P2-06).

---

## 15. Production / configuration readiness

| Item | Status |
|------|--------|
| Production SHA | `883437107f7067c6c8c8c78f417f7e3345ba1192` (Vercel Production success 2026-08-17T02:41:23Z) |
| Email lockup | HTTP 200 `image/png` |
| Resend | Verified domain; `EMAIL_FROM` fallback live; optional `RESEND_FROM_EMAIL` |
| SaaS Stripe | Requires secret + `STRIPE_SAAS_WEBHOOK_SECRET` + eight unit-volume Price IDs (docs/69 historically verified) |
| Tenant Stripe execution | Must stay **false** |
| Supabase | Service role required for claim-password and portal provision |
| Demo | Fail-closed on Production unless `DEMO_ENABLED=true` (currently demo routes 200 — demo is enabled for marketing; honesty banners present) |
| Migrations | Do not replay `20260816120000`; tenant lifecycle stamp `20260816094933` |
| Observability | `mpa.email` logs; optional Sentry |
| TODO/mock hitting customers | SaaS email stub never in Production; demo is labeled synthetic |

---

## 16. Exact recommended next action

**Do not market “subscribe now” to strangers until P1-01, P1-02, P1-03, and P1-04 are fixed and Owner-approved.** Those are copy/presentation and claim-email UX. They do not require enabling Stripe tenant pay, M5, schema, or permission changes.

Then, before ads:

1. Owner-approved Privacy + Terms (P1-08).  
2. Team Deactivate control (P1-06) or a written Owner exception (“Master Admin only”).  
3. Confirm Production Stripe Price env for PM, FO, Complete, and unit blocks (P1-09) with a **read-only** Confirm Plan dry-run — no live charge required if quote/line-item tests already match.  
4. One controlled **new-subscriber** UAT on a test card: PM monthly, FO monthly, Complete monthly — email claim → Guided Setup → product home. Do not use real customer emails.

After those, a short Design → Document → Approve package can authorize the presentation fixes. This audit does not authorize implementation.

---

## What this audit did not do

- Did not implement or refactor  
- Did not create or apply migrations  
- Did not deploy or change Production  
- Did not change Stripe configuration, prices, SKUs, FIN-OPS money, July, RLS, RBAC, or permissions  
- Did not create real customer invitations or bindings  
- Did not open the Product Owner Gmail inbox (dark mode already Owner-verified)  
- Did not run a live paid Checkout (would create a real subscription)

---

## Evidence index

| Kind | Location |
|------|----------|
| Production SHA | GitHub Production deployment for `88343710`; `origin/main` |
| Tenant lifecycle in that SHA | `1f9be880`, PR #276 ancestors of `88343710` |
| Landing / pricing HTTP | `https://www.my-property-assistant.com/` and `/pricing` 200 |
| Lockup | `/branding/logo-email-lockup.png` 200 |
| Billing copy tests | `apps/web/src/lib/tenant-lifecycle/tenant-portal-billing-copy.test.ts` |
| PWA tests | `apps/web/src/lib/pwa/install-experience.test.ts` |
| Email shell | `packages/email/src/shell.ts` |
| Notification delivery | `docs/176-notification-delivery-audit-fix/index.md` |
| Visual release | `docs/177-ui-email-visual-polish/index.md` |
| Product constitution | `docs/00-governance/product-constitution.md` |
