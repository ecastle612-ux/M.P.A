# 201 — Final End-to-End Flow / Mismatch / Dead-End Audit

**Status:** **CONDITIONAL — ONE P1 ON COMPLETE SCOPED-STAFF CROSS-SURFACE HANDOFFS**  
**Date:** 2026-08-17  
**Authority:** Owner final end-to-end flow / mismatch / dead-end audit after [docs/199](../199-final-public-launch-audit-after-tenant-payments/index.md)  
**Mode:** Audit first. Production-safe reads. Existing synthetic/demo organizations. Existing certified evidence (docs/183–200). Mocked/local tests. **No** SaaS purchase. **No** tenant payment. **No** Connect create. **No** complimentary grant. **No** execution flip. **No** M5. **No** July reopen. **No** Stripe Price or Checkout change. **No** application-behavior fix from this record.

Predecessor: [docs/199](../199-final-public-launch-audit-after-tenant-payments/index.md) (launch-readiness) · [docs/200](../200-public-rent-collection-marketing/index.md) (in-repo marketing copy; not Production-deployed)

Successor: [docs/202 — Complete Scoped-Staff Handoff Remediation](../202-complete-scoped-staff-handoff-remediation/index.md) (P1-01 implemented in-repo; STOP before Production deploy).

This is **not** a feature audit. It traces full flows for dead ends, missing next actions, entitlement mismatches, stale state, broken handoffs, and impossible recovery.

---

## 1. Overall verdict

**Not** `FULL END-TO-END FLOW AUDIT PASS — NO LAUNCH-BLOCKING DEAD ENDS`.

**P0:** none.

**P1:** one — Complete members with a single operating scope are shown the other product surface as an available action; middleware correctly denies it (`/unauthorized`).

The first-subscriber org-admin path (purchaser claims, finishes Guided Setup, lands on the purchased SKU home, and uses that product) has **no** launch-blocking dead end. SKU cannot silently change from Landing → Checkout → claim → Guided Setup → home.

The P1 is a real customer path. Complete marketing and SKU copy tell the purchaser they can “assign Property Operations to one manager and Facility Operations to another.” Those scoped managers then see a button that predictably leads to Access denied.

Do **not** implement the remediations from this audit. Smallest package is recorded in §35. **STOP for Owner authorization.**

---

## 2. Personas audited

| Persona | How audited |
|---------|-------------|
| Public visitor | Marketing + get-started + quote/checkout code + docs/199 Production HTML |
| Paid Property Manager | Commercial spine + PM ops + finance entitlements + tests |
| Paid Facility Operations customer | FO entitlements + Mission Control + `excludedSkus` + no-shells tests |
| Paid Complete customer | Launcher + operating scope + both surfaces + isolation |
| Complimentary tester | Grant/claim/email/conversion code + existing Production FO tester grant (untouched) |
| Complimentary gift user | Same package; gift copy has no tester-feedback paragraph |
| Master Admin | `/admin` middleware + complimentary console + `isPlatformOperatorUser` |
| Property Admin / Manager | RBAC + nav + post-auth home |
| Facility Admin / Manager | Same + FO MC |
| Staff / Technician | Post-auth home + maintenance/operations surfaces |
| Current tenant | Occupancy gate + Pay Once / AutoPay + method enforcement (docs/193–198 + code) |
| Former tenant | History-only; Pay Once / AutoPay denied |

Unauthenticated access to app/admin/portals fails closed (redirect or 401). That is security success, not a defect.

---

## 3. Flow matrix

| Persona | Entry | Auth | Home | Primary workflows | Success | Next action | Recovery |
|---------|-------|------|------|-------------------|---------|-------------|----------|
| Public visitor | `/` `/modules` `/pricing` | none | marketing | Understand PM / FO / Complete → monthly/annual → Get Started | Confirm Plan | Stripe Checkout | Cancel → `/checkout/cancel` with quote |
| Paid PM | Checkout return | claim / login | `/pm/mission-control` | Property → unit → resident → lease → charges → FO desk / Online Payments; maintenance; vendors | Posted charge / closed WO | Collect or enable Online Payments | Finish Guided Setup CTA if incomplete |
| Paid FO | Checkout return | claim / login | `/facility/mission-control` | Building → work order → assign → evidence → complete | Closed facility WO | Operations queue | First-run add building |
| Paid Complete (both / admin) | Checkout return | claim / login | `/launcher` | Switch PO ↔ FO; same org entitlement | Work in chosen surface | Return via launcher / nav | Scope-safe sidebar |
| Paid Complete (one scope) | Invite / login | membership | FO MC or PM MC | Only the assigned surface | Work in assigned surface | **Mismatch:** other-surface CTA | `/unauthorized` → Go to your workspace |
| Complimentary tester | Email CTA | `/complimentary/claim` | SKU home after setup | Normal product + expiry | Use until expiry | Choose a Plan | Reply-To feedback@ |
| Complimentary gift | Email CTA | same claim | SKU home | Normal product; no tester feedback ask | Use per grant | Revoke/extend by Master Admin | Same claim recovery |
| Master Admin | `/admin` | platform operator | Admin home | Complimentary directory / grants | Grant sent | Claim email | Unauth → `/unauthorized?reason=admin` |
| Property / Facility admin | `/login` | membership | SKU / scope home | Role-permitted modules | Completes allowed work | Sidebar next | 403 hidden in sidebar |
| Staff / technician | `/login` | membership | Maintenance or FO MC | Assigned work | Complete WO | Queue | Role home |
| Current tenant | Portal invite / login | tenant role | `/portal/tenant` | Billing → Pay Once / AutoPay when enabled | Receipt / enrollment | History | Method 403; execution off hides CTA |
| Former tenant | Portal login | tenant + moved_out | Tenant portal | History / receipts | View past | None for new money | Pay / AutoPay denied |

---

## 4. Paid Property Manager lifecycle

```
Landing → /get-started → POST /api/commerce/quote → /checkout
  → POST /api/commerce/checkout { quoteId only }
  → Stripe (mpa_money_domain=saas_billing, mpa_product_sku, mpa_billing_cycle)
  → /api/commerce/webhooks/stripe → run-provisioning
  → claim email /commerce/continue → claim-password + claim
  → /setup → /pm/mission-control
```

Client cannot send SKU, Price ID, or amount. Provisioning SKU comes from the SaaS session. Post-setup home is Property Manager Mission Control. **No purchase performed.**

---

## 5. Paid Facility Operations lifecycle

Same spine with `mpa_facility_operations`. Home is `/facility/mission-control`. Financial domain `excludedSkus` includes FO. FO does not advertise or expose residential rent collection. **No purchase performed.**

---

## 6. Paid Complete lifecycle

Same spine with `mpa_complete_platform`. Org-admin / both-scope home is `/launcher`. Property Operations and Facility Operations remain one subscription. Switching surfaces does not change SKU. Residential Online Payments stay on the property surface only.

**P1-01** applies when a Complete member is scoped to one surface (see §12 and §32).

---

## 7. Monthly / annual billing

| Check | Result |
|-------|--------|
| Displayed prices | PM/FO **$59**/month · **$566.40**/year; Complete **$109**/month · **$1,046.40**/year |
| Annual copy | Save 20% |
| Quote | Server `POST /api/commerce/quote` |
| Checkout | Server `quoteId` only; client Price/SKU/amount rejected |
| Interval | `mpa_billing_cycle` on SaaS session metadata |
| Toggle stale state | New quote required; checkout does not accept a client Price after a product/term change |
| Provisioning | SKU + cycle from session / job |

Stripe Price objects last certified in docs/198. Stripe MCP was not used to list or write Prices this turn. In-repo `PUBLIC_PRICING_MODEL_COPY` is unchanged.

---

## 8. Claim / auth

`commerce-claim-copy.ts` maps API failures to useful sentences:

| State | Result |
|-------|--------|
| New purchaser + new email | Claim password → bind → Guided Setup |
| Existing auth user + new purchase | Logged-in claim / reuse path |
| Already-used claim | “This workspace may already be claimed. Sign in…” |
| Expired / invalid | “This claim link is no longer valid…” + Sign in |
| Logged-out | Email + password on continue |
| Logged-in | Auto-claim / continue |
| Wrong email | 409 mapped to “Use the same email address from your Stripe purchase receipt…” |
| Missing bind token | “Check your email…” |

No blank claim screen in the inspected path. Duplicate org / membership prevention and SKU lock remain as previously certified. Complimentary claim separately locks SKU (`complimentaryClaimLocksSku`).

---

## 9. Guided Setup

Traced for PM, FO, Complete, and complimentary of each SKU (same setup machine; SKU from grant or purchase).

| Check | Result |
|-------|--------|
| Required vs optional | Finish requires org, product, **billing checkbox**, home, next-step ack, and Complete operating model |
| “Optional review” billing (docs/199 P2-04) | Label says optional; `canFinish` requires the checkbox. Hint tells the user to check it. **Not a dead end.** Keep **P2** |
| Connect / KYC as setup gate | **No** |
| Homes after finish | PM → PM MC · FO → FO MC · Complete → launcher |
| Loop after completion | Middleware does not hard-gate `setupComplete`. Saving setup **without** `complete: true` clears `completed_at`. Mission Control then shows “Finish Guided Setup.” Recoverable. **P2** |
| Bypass required steps | `canFinish` blocks the finish button; server still records checklist |

Complimentary testers/gifts use the same setup and the grant SKU. They cannot pick a different product at claim.

---

## 10. Property Manager operations

Intended residential lifecycle is connected:

property / unit → resident → lease → `activateSignedLease()` → recurring schedule + posted charge → finance desk / tenant balance → payment history / receipt

Maintenance request → assign / status → completion shares the work-order record. Vendors attach to the same work records.

IDs stay inside organization (and residential) scope. Staff without finance entitlement do not get Financial Operations in the sidebar.

Empty first-run states answer what this is and what to do next (add first property).

---

## 11. Facility Operations operations

Facility Mission Control → buildings/assets → operations → assignment → vendor if used → media evidence → status → completion/history.

FO is not pushed into residential rent, lease, or Online Payments. `FINANCIAL_DOMAIN_REGISTRATION.excludedSkus` includes `mpa_facility_operations`. `/pm/financial-operations` is not entitled.

docs/199 P2-01 “S4 Autopay & Payment Plans Polish — blocked” lives on the **Property Manager Financial Operations command center**, not FO Mission Control. FO-only customers do not see it. **Keep P2.** Not a customer-facing FO mismatch.

FO customer nav has no “coming soon” shells (`fo-no-shells` contract). `/facility/capital-projects` is not in nav and redirects to Facility Mission Control.

---

## 12. Complete switching / isolation

| Check | Result |
|-------|--------|
| Org SKU while switching | Unchanged Complete entitlement |
| Sidebar | `navigationGroupsForSku` + `effectiveSurfaces` — scoped members only see their surface |
| `canAccess` | Uses `entitlementsForMember` with stored scope |
| Post-auth home | Complete + `facility_operations` → FO MC; + `property_operations` → PM MC; both → `/launcher` |
| Residential Online Payments | Property surface only |
| FO surface rent | Not exposed |
| Cross-module contamination | Work-surface filters remain |

**P1-01 — Complete scoped-staff cross-surface buttons**

Facility Mission Control:

```ts
const hasPmMaintenance = canAccess("pm.maintenance") || isComplete;
// …
...(isComplete ? [{ href: "/pm/mission-control", label: "Property Operations" }] : [])
```

Complete launcher handoffs (`buildCompleteWorkspaceHandoffs`) key only on SKU, not member scope. The unified launcher still says the user can “open either workspace” when one side’s API 403s. FO MC breadcrumbs always include Launcher, so a facility-scoped Complete manager can reach those handoffs.

Sidebar is correct. Server denial is correct. The **visible button** is the mismatch (Owner §19 / §26).

This is marketed, not hypothetical: Complete SKU copy tells purchasers they can assign each side to a manager.

`/unauthorized` entitlement copy says the workspace is “outside your organization's purchased subscription,” which is wrong for **member scope**. Recoverable via “Go to your workspace.” Copy is **P2**; the offered-then-denied button is **P1**.

---

## 13. Tenant lifecycle

Current occupant → tenant home / billing → posted rent/fees → balance.

Pay Once / AutoPay CTAs require `tenantOnlinePayAvailable`: execution **true** + Connect ready + `occupancyAccess === "active"`.

Production execution is **FALSE** everywhere, so tenants currently see balances / history / receipts and **no** live pay CTA. That matches database state. Certified enabled behavior (docs/193–198): ACH only / Cards only / Both — tenant never sees a disabled method; server 403s before Stripe.

---

## 14. Pay Once

Code + certified UAT (docs/193 / 198). **No money moved this turn.**

ACH stays processing until succeeded. Card decline / Checkout cancel / expire have recovery copy. Method not offered by the subscriber is refused before Stripe. Former tenant cannot start checkout (occupancy). Admin checkout of tenant money is not the tenant Pay Once path.

---

## 15. AutoPay

Tenant-only start. Admin with no occupancy is denied (route still fail-closes; see §30 test-contract note). Consent required. Enrollment covers posted recurring rent and AutoPay-eligible recurring fees. Deposit / damage / late_fee / one-time charges are not silently included.

Subscriber disables Online Payments → enrollment pauses. Re-enable follows certified resume rules. Subscriber disables the enrolled method type → pause; **no** silent ACH/card substitution.

Disable AutoPay is a tenant action. Production: **0** active enrollments (1 revoked historical row).

---

## 16. Former tenant

`occupancyIsCurrent` / `occupancyAccess === "historical"` → `canPay` false. No Pay Once, no AutoPay enroll, no new obligation from the tenant portal. History / receipts remain. Another occupant’s current information is org-scoped and occupancy-scoped.

---

## 17. Online Payments / Connect

PM / Complete residential admin:

Financial Operations → Online Payments → Not connected → Connect with Stripe → hosted onboarding → return → sync → Ready to enable → ACH / Cards / Both → Enable → active → Manage / Disable → re-enable.

Customer states implemented: `not_connected` · `setup_incomplete` · `ready_to_enable` · `active` · `action_required`.

Enable refuses if Connect is not ready. Both methods false while enabled → 409. Abandoned / expired Account Link and later not-ready Connect have actionable customer states (docs/194–198). Execution true + Connect not-ready is not a current Production state (execution true count = 0).

Property Demo remains `acct_1U5MdJ8DmtuNiZTl` · `ready` · execution **FALSE**. Other listed orgs are `not_started` / no `acct_`. **No Connect mutation this turn.**

---

## 18. Financial charge lifecycle

Admin-controlled amounts: rent, parking, pet, utilities, other recurring, deposit, damage, other one-time, manual late fee inside the current authorized boundary.

Posted charge → tenant sees the posted amount → eligible pay behavior → FIN-OPS allocation → receipt / ledger.

Changing defaults does not rewrite historical posted/paid charges (tenant-payments tests). **No M5.** **No automatic late-fee assessment.** Late-fee policies in Production: **0**.

---

## 19. Payment failure / recovery

| Event | Expected / actual |
|-------|-------------------|
| Card declined | Not paid |
| Checkout canceled | `/checkout/cancel` + quote recovery (SaaS); tenant cancel URL |
| Checkout expired | Re-quote / retry |
| ACH processing | Not treated as paid until succeeded |
| ACH failure / return | Failure state; no premature paid |
| Refund / dispute | FIN-OPS handlers; not SaaS billing |
| Duplicate / late webhook | Idempotent event tables (`financial_stripe_webhook_events` vs `saas_stripe_webhook_events`) |
| Connect vs platform vs SaaS | Separate routes and secrets; `mpa_money_domain` |

No tenant-money event enters SaaS billing. No SaaS event enters tenant FIN-OPS. **No new payment this turn.**

---

## 20. Complimentary tester

Master Admin → Complimentary Access → email → product → duration → optional limit → Send Access → branded email → **Set Up Your Account** → `/complimentary/claim` → Guided Setup → grant SKU → use → expiry warning → Reply-To **`feedback@my-property-assistant.com`** → expiry → **Choose a Plan** (`/pricing?from=complimentary`) → paid conversion reuses org.

No fake Stripe subscription. SKU locked at claim. Production: one existing **active FO tester** grant (`af7bea4e-…`, expires 2026-08-31). **Not touched. No email sent.**

---

## 21. Complimentary gift

Same claim/setup spine. Gift welcome copy has **no** tester-feedback paragraph. Reply-To is still `feedback@my-property-assistant.com` (shared mailbox; not a tester requirement in the body). Revoke / extend / change limit / convert tester → gift / remove expiration exist on the Master Admin console. Revoke has **no confirm dialog** — Master Admin only; **P2**.

---

## 22. Master Admin

`/admin` requires platform operator (middleware + layout). Unauthenticated / normal org admin → `/unauthorized?reason=admin`. Complimentary directory, grants, expiration, limits, revoke, extend, tester→gift, SKU admin, and organization visibility remain operator-only.

---

## 23. RBAC

| Actor | Expected | Actual |
|-------|----------|--------|
| PM admin | PM + finance | Entitled |
| PM staff | Role-filtered nav | Sidebar filtered |
| FO admin | FO only | Entitled; no residential finance |
| FO technician | FO work | FO home / operations |
| Complete both-scope | Both surfaces | Launcher + both nav groups |
| Complete one-scope | One surface | Sidebar correct; **FO MC / launcher CTAs over-offer** (P1-01) |
| Tenant | Portal | Portal only |
| Former tenant | History | Pay denied |
| Master Admin | `/admin` | Operator only |
| Unauthenticated | Denied | Redirect / 401 |

A clean 403 is acceptable. A **visible button that predictably 403s** is P1-01.

Technician Assign UI is not capability-gated in the command centers; a URL-capable technician who cannot assign gets an API 403. Recoverable. **P2**.

---

## 24. Navigation

Customer sidebar ships live workflows only (`readiness === "planned"` filtered out). Destinations exist in the Production build (187 pages). Entitlement filtering matches SKU + scope except P1-01 extra CTAs outside the sidebar.

No accidental customer nav to vanity `/property-manager` (docs/199 P2-10). Those remain unlinked 404s. Desktop and responsive shells share the same hrefs; important actions are buttons/links, not hover-only.

---

## 25. Email / web handoffs

| Mail | CTA | Logged-out | Logged-in | Expired | After |
|------|-----|------------|-----------|---------|-------|
| SaaS claim | `{APP}/commerce/continue?session_id=` | Claim password | Auto-claim | Friendly invalid | `/setup` |
| Provision welcome / continue | `/setup` or continue URL | Login then setup | Setup | Re-open email | SKU home |
| Tester | Set Up Your Account → `/complimentary/claim` | Password | Continue | Invalid/expired message | `/setup` |
| Gift | Same CTA, no tester paragraph | Same | Same | Same | `/setup` |
| Expiry | Continue With M.P.A. → `/pricing?from=complimentary` | Pricing | Pricing | N/A | Paid convert |
| Password reset | Supabase-native (P2) | Reset form | Reset | Provider message | Login |

Production origin `https://www.my-property-assistant.com`. **No email sent this turn.**

---

## 26. Empty / error / first-run

Major zeros (properties, units, tenants, work orders, vendors, charges, payments, Connect not started, no receipts, no complimentary grants) have titled empty states and a next action on the inspected homes and desks.

No raw stack traces on the happy path. `STRIPE_SECRET_KEY` can appear in an **unconfigured** tenant checkout 503 (docs/199 P2-06). Production Stripe is configured. Unauthorized page may show a required entitlement key in mono — operator-adjacent; **P2**.

---

## 27. Mobile / PWA

`/manifest.webmanifest` · `/sw.js` · `/offline.html` · Apple touch icon. Login, Guided Setup, Mission Control, launcher, work orders, Financial Operations, Online Payments, and tenant Billing are existing responsive app routes. Tables scroll; primary actions are full buttons. Apple vs Android install guidance already differs. **No native-app work.**

---

## 28. Data / API / UI state consistency

| Machine | DB / API / UI |
|---------|----------------|
| Subscription / SKU | Session metadata → provisioning → org SKU → setup home |
| Claim | Job + bind token → friendly UI states |
| Guided Setup | `completed_at` vs Mission Control Finish CTA (P2 loop if saved incomplete) |
| Work orders | Shared records across list / detail / reports |
| Complimentary | Grant status/SKU/expiry shown on claim + admin directory |
| Connect / Online Payments | Public customer states; no raw `acct_` on the customer payload |
| Payments / AutoPay | Execution false ⇒ CTAs hidden; ACH not paid until succeeded |
| Occupancy | Active vs historical drives pay vs history |

No UI “paid” before ACH success. No UI Enable path while Connect is not ready.

---

## 29. docs/199 P2 reclassification

| ID | Finding | This audit |
|----|---------|------------|
| P2-01 | S4 Autopay & Payment Plans Polish — blocked | **Keep P2.** PM FO command center only. AutoPay itself is certified elsewhere. FO-only customers never see it. |
| P2-02 | “Record your first payment” | **Keep P2.** Manual journey; Online Payments CTA still on the desk. |
| P2-03 | Global search | **Keep P2.** |
| P2-04 | Guided Setup “Optional” billing | **Keep P2.** Required checkbox with an explicit hint. Not a dead end. |
| P2-05 | Setup omits Online Payments | **Keep P2.** Connect is correctly not a setup gate. |
| P2-06 | `STRIPE_SECRET_KEY` in unconfigured 503 | **Keep P2.** Not the Production configured path. |
| P2-07 | Unbranded password reset | **Keep P2.** Recoverable. |
| P2-08 | PWA “foundation shell” | **Keep P2.** |
| P2-09 | Privacy/Terms FIN-OPS wording | **Keep P2.** |
| P2-10 | Vanity `/property-manager` 404s | **Keep P2.** Not linked. |
| P2-11 | No tenant receipt email | **Keep P2.** In-app receipts remain. |
| P2-12 | “late-fee assessment” live = manual desk | **Keep P2.** M5 still unauthorized. |

None promoted to P1.

---

## 30. Tests / build / lint

| Suite | Result |
|-------|--------|
| `@mpa/shared` `src/commercial` + `src/auth` + `src/finance` + `src/leasing` | **36 files / 265 tests pass** |
| `@mpa/web` commerce / finance / complimentary / commercial / auth / pre-marketing | **48 files pass · 2 files / 3 tests fail** |
| `apps/web` typecheck | **Pass** |
| Production `next build` | **Pass · 187 pages** |
| Changed-area ESLint | Pre-existing errors in complimentary-access + online-payments test (`any`, hooks-in-test, unused vars). Not introduced by this audit. |

**Do not hide red tests.** The three failures are **test-contract drift**, not allow-through:

1. `POST /api/finance/checkout` — test omits required `paymentMethodType`; route returns **400 Invalid payload** before authorize. Product still fail-closes.
2. `POST /api/finance/resident/autopay` former tenant — test omits required `paymentMethodType`; **400** before occupancy **403**.
3. Same route, admin with no occupancy — same stale payload → **400**.

Occupancy helpers still return **403 Forbidden** when the body is valid. Former tenants and admins cannot enroll. Classify as existing test hygiene (**P2**), not a launch blocker.

Repo-wide `pnpm lint` still reports the known complimentary / online-payments issues from prior records.

---

## 31. Mismatch table

Only genuine mismatches:

| FLOW | EXPECTED | ACTUAL | SEVERITY | FIX REQUIRED? |
|------|----------|--------|----------|---------------|
| Complete facility-scoped (or property-scoped) staff opens FO MC / Complete launcher | Only the assigned surface is offered | FO MC always adds Property Operations when SKU is Complete; launcher handoffs ignore member scope; click → `/unauthorized` | **P1** | Yes — smallest scope-filter remediations after Owner authorization |
| Complete scoped staff hits `/unauthorized?reason=entitlement` | Copy explains member operating scope | Copy says “outside your organization's purchased subscription” | **P2** | Optional copy |
| Guided Setup billing step | Label matches required checkbox | “Optional review” but required to finish | **P2** | No for launch |
| Setup saved without `complete: true` | Stay complete | `completed_at` cleared; Finish Guided Setup returns | **P2** | No for launch |
| PM Financial Operations home | Customer language | `FIN_OPS_SLICES` including S4 blocked | **P2** | No for launch |
| First-collect journey | Honest next action | “Record your first payment” (manual); Online Payments still on desk | **P2** | No for launch |
| Unconfigured Stripe checkout 503 | Customer sentence | Can mention `STRIPE_SECRET_KEY` | **P2** | No for launch |
| Password reset mail | Branded M.P.A. shell | Supabase-native | **P2** | No for launch |
| Vanity product slugs | 404 or redirect | Unlinked 404 | **P2** | No for launch |
| Master Admin revoke | Confirm if destructive | One-click revoke | **P2** | No for launch |
| Technician Assign control | Hidden if cannot assign | Control visible; API 403 | **P2** | No for launch |
| Finance route tests | 403 on unauthorized actor | 400 on stale fixtures missing `paymentMethodType` | **P2** | Test-only |

---

## Confirmed flows that passed

- Public Landing → product names → pricing → Get Started → server quote → Checkout `quoteId` only → SKU metadata → claim → Guided Setup → purchased home (PM / FO / Complete independently; no buy this turn)
- Monthly and annual display / quote / interval metadata; no client Price ID
- Claim states: new, reuse, used, expired, logged-in, wrong email
- Guided Setup required gates; Connect not required; SKU homes
- PM property → unit → resident → lease → posted charge → desk / history
- PM maintenance and vendor completion on shared records
- FO building → work order → assign → evidence → complete; no residential rent
- Complete both-scope launcher + sidebar isolation + no FO rent
- Tenant history with execution off; Pay Once / AutoPay gates; method enforcement; AutoPay exclusions; former-tenant history-only
- Online Payments state machine and Enable refusals
- Charge types and no historical rewrite; no M5; no auto late fee
- Webhook isolation and ACH not-paid-until-succeeded
- Complimentary tester vs gift copy; Reply-To; SKU lock; convert path
- Master Admin complimentary controls; org admin denied
- Sidebar entitlement filtering (except P1-01 extra CTAs)
- SaaS / complimentary email CTAs to real routes
- First-run empty states on homes
- Login `?next=` keeper; logout to login; PWA manifest
- docs/199 P2 items remain P2

---

## 32. P0

None.

---

## 33. P1

**P1-01 — Complete scoped-staff cross-surface handoffs**

A Complete member with `operating_scope` of `facility_operations` or `property_operations` is shown the other surface as an available action (FO MC Property Operations / Property maintenance; Complete launcher both handoffs). Middleware correctly sends them to `/unauthorized`.

This is a material mismatch on an intended, marketed path. It is **not** a first-purchaser org-admin blocker.

---

## 34. P2

docs/199 P2-01–P2-12 (unchanged). Plus this audit:

- Unauthorized entitlement copy (subscription vs member scope)
- Guided Setup `completed_at` cleared on incomplete save
- Master Admin revoke without confirm
- Technician Assign control not capability-gated
- Three finance route tests expecting 403, receiving 400 on stale payloads
- Missing-SKU provisioning fallback to PM (not the normal Checkout path; session without `mpa_product_sku`)

---

## 35. Exact remediations (do not implement from this record)

Smallest package consistent with already-approved ADR-033 operating scope. **No architecture redesign.**

1. `facility-mission-control-page.tsx`: `hasPmMaintenance = canAccess("pm.maintenance")`. Show Property Operations only when `canAccess("pm.mission_control")`.
2. Complete launcher: filter `buildCompleteWorkspaceHandoffs` (and empty-guidance / “open either workspace” copy) by `effectiveSurfaces` / `canAccess`. Do not fetch or promote a surface the member cannot open.

Optional later (P2, not required for recertification of P1-01): unauthorized member-scope sentence; Guided Setup “Optional” label; hide `FIN_OPS_SLICES` from customers; brand password-reset mail; align the three finance tests with `paymentMethodType`.

If Owner treats this as an implementation correction of approved scope behavior, authorize the two-file remediations, then recertify. If Owner treats launcher/MC handoff rules as a product change, restart Design → Document → Approve.

**STOP. Do not implement. Do not deploy.**

---

## 36. Final Production state

Read-only SQL on `mpa-prod` (`vahnmcrpnuggxkivynvo`) this turn. **No writes.**

| Check | Result |
|-------|--------|
| `stripe_payment_execution_enabled` true count | **0** (6 settings rows) |
| Property Demo execution | **FALSE** |
| Property Demo Connect | `acct_1U5MdJ8DmtuNiZTl` · `ready` · charges enabled |
| Other orgs Connect | `not_started` / no `acct_` (5 rows) |
| AutoPay enrollments | 1 total · **0 active** |
| Complimentary grants | 1 total · 1 active FO tester (pre-existing; not mutated) |
| New tenant payment | **None** |
| New SaaS subscription | **None** |
| New Connect account | **None** |
| New complimentary grant | **None** |
| July freeze | `finance_july_freeze_enabled() = true` |
| M5 | `isFinanceM5Authorized() === false` |
| Late-fee policies | **0** |
| FIN-OPS totals vs docs/199 | **Unchanged**: charges 21 / 24711.70 / paid 11114.54 · payments 14 / 11114.54 · allocations 14 / 11114.54 · receipts 4 · ledger 48 |
| SaaS Prices | In-repo copy unchanged ($59 / $59 / $109). No Stripe Price write. |
| Live Production app | Still docs/197 `dpl_BjW3Qk3EKEXxP8FvmKUWaJzip6nA` / SHA `0653b428`. docs/200 marketing is **in-repo only**. |
| Schema tip | `20260817193519` (unchanged) |

---

## 37. Exact next action

Owner authorizes the **smallest P1-01 remediations** in §35 (or explicitly accepts P1-01 as non-blocking for first-customer org-admin launch and asks for a follow-up polish record).

Until then:

**STOP.**

Do not implement the remediations from this audit. Do not activate a real customer. Do not Enable Online Payments. Do not process a tenant payment. Do not create Stripe Checkout or a PaymentIntent. Do not create another Connect account. Do not create a complimentary grant or send tester/gift email. Do not buy a SaaS subscription. Do not change Stripe Prices or SaaS Checkout. Do not enable M5. Do not unfreeze July. Do not globally flip payment execution. Do not invent features.

---

## Classification

**CONDITIONAL — ONE P1 ON COMPLETE SCOPED-STAFF CROSS-SURFACE HANDOFFS**

No P0. First-subscriber commercial spine has no launch-blocking dead end. Complete scoped-staff handoffs are the only P1. Execution remains FALSE everywhere.
