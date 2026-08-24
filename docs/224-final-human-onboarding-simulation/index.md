# 224 — Final Human Onboarding Simulation

**Title:** FINAL PRE-ONBOARDING HUMAN SIMULATION  
**Status:** **FINAL HUMAN ONBOARDING SIMULATION PASS — BEGIN REAL USER ONBOARDING**  
**Date:** 2026-08-18  
**Authority:** Owner authorization — Final human onboarding simulation. No new major features.  
**Mode:** Human experience simulation. Existing synthetic/demo data. Existing certified users/personas. Safe local/Preview sessions. Read-only Production verification. **Do not buy a SaaS subscription. Do not create a real subscriber or employee. Do not process tenant payment. Do not enable payment execution. Do not create Connect. Do not enable M5. Do not unfreeze July. Do not alter SaaS pricing. Do not send another Production complimentary grant/email. Do not create another Production public request unless required.**

**Preserves:** Product Constitution ADR-019 · ADR-033 / [docs/202](../202-complete-scoped-staff-handoff-remediation/index.md) · [docs/214](../214-app-wide-sidebar-production-release/index.md) sidebar · Slice 4 Search/Create/Recent · Slice 5 Preventive Maintenance · Slice 6 Deterministic Routing · [docs/223](../223-ai-assistant-functionality-audit/index.md) briefing permission gate

This is **not** another architecture audit. The question is: can a normal person start using M.P.A. without the Owner standing beside them explaining where everything is?

---

## Verdict

**FINAL HUMAN ONBOARDING SIMULATION PASS — BEGIN REAL USER ONBOARDING**

**P0:** 0  
**P1:** 0  
**P2:** recorded below; none block first real-user onboarding.

A new Property Manager, Facility Operations, or Complete subscriber can follow the public commercial flow, claim, finish Guided Setup, and land on a home that names the next action. Daily work lives on the sidebar, not only in Settings. Search, + Create, and Recent are in the header for managers. Technicians land on My Work. Tenants see balance and history without a fake Pay button when Online Payments is off. Public QR intake is phone-first and already certified. Complimentary testers get branded welcome copy with Reply-To `feedback@my-property-assistant.com`.

The Owner-cited Slice 6 Production SHA `c84742d9` does **not** contain the technician / non-finance briefing permission fix. **Current live Production does.** Simulation continued on the live line.

**STOP.** Do not implement new features from this record. Begin real user onboarding is the Owner’s next step.

---

## 1. Canonical docs numbering reconciliation

Two parallel records both used **docs/222**:

| Historical record | Parallel branch | Decision |
|-------------------|-----------------|----------|
| FO-EFF Slice 6 Production Release + UAT | `cursor/fo-eff-slice6-production-release-6821` | **Kept as canonical 222** — Owner-named Production baseline |
| AI Assistant Functionality Audit | `cursor/ai-assistant-functionality-audit-01f2` / later `cursor/pre-onboarding-production-01f2` | **Renumbered to canonical 223** |

Meaning is unchanged. Certification content is preserved.

| Canonical # | Path | Meaning |
|-------------|------|---------|
| 221 | `docs/221-fo-eff-slice6-deterministic-routing/` | Slice 6 implement (STOP before Production apply) |
| **222** | `docs/222-fo-eff-slice6-production-release/` | Slice 6 Production release + UAT SUCCESSFUL |
| **223** | `docs/223-ai-assistant-functionality-audit/` | AI functionality audit + in-repo briefing P1 fix (originally numbered 222 on a parallel branch) |
| **224** | `docs/224-final-human-onboarding-simulation/` | This simulation |

This package is the next unique number after the reconciled sequence.

---

## 2. Current Production SHA / deployment

Owner-cited Slice 6 baseline (still the last **feature** release):

| Item | Value |
|------|--------|
| Slice 6 Production SHA | `c84742d936c6c9be31b52e6cfa6232bce502e31e` |
| Slice 6 deploy | `dpl_BYMrKYufEpvSY1CbU4ybaY1f76RB` |
| Slice 6 stamp | `20260818091246` / `docs_221_fo_eff_slice6_routing` |

**Current live Production** (www + login + unauthorized fonts all report the same deploy):

| Item | Value |
|------|--------|
| Live application SHA | `a1f617de77f30696471045e2f684ba8fe3d15f4f` |
| Live deploy | `dpl_4vsYcecpATEcFeQUNJaSJT4izHGS` |
| Live HTML `data-dpl-id` | `dpl_4vsYcecpATEcFeQUNJaSJT4izHGS` |
| Lineage | `c84742d9` is an ancestor of `a1f617de` |
| Added commits | `c8341c5e` briefing permission gate · `a1f617de` AI audit docs (originally numbered 222) |

Simulation uses **live** Production. Slice 6 remains the Owner-named feature baseline.

---

## 3. AI briefing permission fix — Production status

Required Production behavior:

- finance briefing requires `pm.finance:read`
- resident/lease briefing is limited to `organization_admin` / `property_manager` / `leasing_agent`
- technician briefing does **not** expose outstanding rent, delinquency, resident queues, or lease queues

| Check | Result |
|-------|--------|
| Present on Owner-cited SHA `c84742d9` | **NO** — `resolveDailyOpsBriefingAccess` is absent |
| Present on live SHA `a1f617de` | **YES** — commit `c8341c5e` |
| Serving `www.my-property-assistant.com` | **YES** — `dpl_4vsYcecpATEcFeQUNJaSJT4izHGS` |

Live implementation:

- `packages/shared/src/property/daily-ops.ts` — `resolveDailyOpsBriefingAccess`
- `apps/web/src/lib/property/daily-ops-service.ts` — skips finance report and lease/resident queries unless access flags
- `apps/web/src/app/api/pm/mission-control/route.ts` — passes `roles` + `permissions: authz.permissions`

Focused tests: 43 passed (`daily-ops`, nav presentation, Complete launcher, post-auth home).

**Continue.** Not `BLOCKED — AI BRIEFING PERMISSION FIX NOT LIVE`.

---

## How this simulation was run

| Layer | What was used |
|-------|----------------|
| Public commercial | Live `www.my-property-assistant.com` landing, Explore Platforms, pricing monthly/annual, login, unauthorized, Live Demo — desktop and ~390px. No purchase. |
| Claim / Guided Setup / homes | Certified commercial evidence ([docs/199](../199-final-public-launch-audit-after-tenant-payments/index.md), [docs/201](../201-final-end-to-end-flow-audit/index.md)) + current Guided Setup / Day-1 / post-auth home source |
| Authenticated daily work | Sidebar, Mission Control, My Work, Search/Create/Recent, empty states, entitlements — source + certified UAT. No new Production users. |
| Facility manager / QR / PM | [docs/206](../206-facility-public-work-request-production-release/index.md), [docs/216](../216-fo-eff-slice3-production-release/index.md) `UAT-CHAIR-14`, [docs/218](../218-simplicity-slice4-production-release/index.md), [docs/220](../220-fo-eff-slice5-production-release/index.md), [docs/222](../222-fo-eff-slice6-production-release/index.md) `FR-2026-00003` |
| Tenant | [docs/193](../193-tenant-stripe-payment-uat-property-demo/index.md)–[198](../198-property-demo-ach-payment-method-activation-uat/index.md) + current billing portal source. No money processed. |
| Complimentary | [docs/185](../185-complimentary-tester-gift-access/index.md)–[187](../187-complimentary-access-production-release-certification/index.md) + email tests. No new grant sent. |
| Safety | Read-only `mpa-prod` SQL + in-repo M5 hard-stop + public price HTML |

---

## 4. New Property Manager onboarding

Simulated path (no purchase):

```
Landing → Property Manager → Pricing (Monthly / Annual) → Confirm Plan
  → certified Checkout understanding → claim → Guided Setup → PM Mission Control
```

Public Production shows three products, $59 Property Manager, Monthly/Annual toggle, and the six-step commercial spine (Pricing → Get Started → Questionnaire → Quote → Confirm Plan → Checkout). Guided Setup states the purchased product and routes to Property Manager Mission Control. Stripe Connect / Online Payments are **optional after signup** (`RENT_COLLECTION_OPTIONAL_AFTER_SIGNUP`).

After setup, a first-time PM can find:

| Need | Where | Owner explanation required? |
|------|-------|-----------------------------|
| Properties | Sidebar **Properties** · Day-1 “Add first property” · Mission Control fallback “Add your first property” | No |
| Residents | Sidebar **Residents** | No |
| Maintenance | Sidebar **Maintenance** | No |
| Financial Operations | Sidebar **Financial Operations** | No |
| Online Payments | Financial Operations desk **Open Online Payments** (`/pm/financial-operations/online-payments`) | No — one extra click inside Finance, not a dead end |
| Search | Header **Search workspace…** (`/` / ⌘K on desktop) | No |
| + Create | Header **+ Create** (managers) | No |
| Recent | Search palette with empty query | Slightly less obvious than Search/Create (P2) |

Mission Control gives a useful next action. Empty org: add first property. After data exists: daily-ops briefing + first task. No Owner narration is required for the commercial spine or first home.

---

## 5. New Facility Operations onboarding

Simulated path (no purchase):

```
Landing → Facility Operations → Pricing → certified Checkout understanding
  → claim → Guided Setup → Facility Mission Control
```

Guided Setup next-action copy: “add your first building in Assets (or create facility work in Operations).” Day-1 checklist: building/site → invite technicians → vendors → first work order → assign → complete.

First session findability:

| Need | Sidebar / home | Buried only in Settings? |
|------|----------------|--------------------------|
| Buildings / sites | **Assets** (Day-1 and Mission Control say “building”) | No |
| Operations | **Operations** | No |
| My Work | **My Work** (managers see it; technicians land here) | No |
| Request Forms | **Request Forms** | No — on the FO rail |
| Work Templates | **Work templates** | No — on the FO rail |
| Assets | **Assets** | No |
| Preventive Maintenance | **Preventive Maintenance** | No |
| Assignment Rules | **Assignment Rules** | No — on the FO rail |
| Vendors | **Vendors** | No |
| Search / + Create | Header, same as PM managers | No |

Mission Control answers **WHAT NEEDS MY ATTENTION?** (Needs Attention rows open the exact work order). Daily work is not hidden behind Settings.

---

## 6. Complete onboarding

```
Complete subscription → Guided Setup → /launcher → Property Operations
  → Facility Operations → switch back
```

| Audience | Home | Confusion risk |
|----------|------|----------------|
| Both-surface authorized | `/launcher` · “Start here” · one-click surface switcher (Property Operations / Facility Operations) | Low — group titles name the surface |
| PM-only scoped Complete | PM Mission Control only · FO handoff hidden ([docs/202](../202-complete-scoped-staff-handoff-remediation/index.md)) | No FO CTA to `/unauthorized` |
| FO-only scoped Complete | FO Mission Control only · PM handoff hidden | No PM CTA to `/unauthorized` |

Surface switch is a direct Mission Control hop. Tests confirm scoped launcher/sidebar hide the other surface. A correct 403 is not presented as the normal Complete path.

---

## 7. Facility manager daily flow

Exact workflow, using current UI + certified Clinic Demo evidence:

1. Open M.P.A. → Facility Mission Control (SKU/scope home).
2. Needs Attention lists unassigned / public / urgent work; each row opens the exact Operations work order.
3. Assign if needed; matching routing can assign with **0 manager clicks** ([docs/222](../222-fo-eff-slice6-production-release/index.md) `FR-2026-00003` → Mike).
4. Back to Mission Control via sidebar or crumbs.
5. Search `UAT-CHAIR-14` → Asset Detail → work history → Create Work ([docs/216](../216-fo-eff-slice3-production-release/index.md), [docs/218](../218-simplicity-slice4-production-release/index.md)).
6. Preventive Maintenance → inspect plan → generated WO → asset history ([docs/220](../220-fo-eff-slice5-production-release/index.md)).
7. Assignment Rules page states in plain language: “First matching active rule assigns new facility work. No match leaves the work Unassigned.” New rules start inactive so they can be previewed.

A first-time facility manager does **not** need to be told where each module lives. Mission Control, Operations, Assets, Preventive Maintenance, and Assignment Rules are on the rail. Search finds the known asset tag in 1–2 actions.

---

## 8. Technician flow

Post-auth home for a facility-only technician: **`/facility/my-work`**.

Expected path:

```
My Work → assigned WO → location → asset → issue → checklist → evidence → Complete
```

That path is one destination. Technician sidebar is filtered to daily work (`TECHNICIAN_SIDEBAR_HREFS`). + Create is empty for technician-only staff.

Technician does **not** see on the rail:

- Request Form admin
- Work Template admin
- Assignment Rules
- Preventive Maintenance admin
- Financial Operations / Online Payments
- Residents / Leasing
- Master Admin

If a technician can reach Property Mission Control (PM-entitled membership + URL), the live briefing gate withholds finance and resident/lease queues. Facility Mission Control in technician viewer mode points to My Work and does not present the manager attention queue as their job list.

Empty My Work: “Nothing assigned in this list.” Honest. Not a management-dashboard hunt.

---

## 9. Tenant flow

Tenant portal billing (`resident-billing-portal`):

- Current balance, posted charges, payment history, receipts are the primary content.
- Pay is shown only when `canPay` and `onlinePaymentsEnabled` are true. **No fake Pay button** when Online Payments is disabled.
- Certified method labels remain: ACH only → **Bank Account**; Cards only → **Card**; both → both.
- AutoPay authorization is tenant-controlled. Property managers cannot turn AutoPay on for the tenant.
- This simulation did **not** process money.

---

## 10. Public QR requester flow

Certified architecture (no new Production request):

```
Phone → scan QR → public form → locked location/asset context
  → enter problem → attach photo → Submit → confirmation
  → request number → View Request Status
```

Evidence: [docs/206](../206-facility-public-work-request-production-release/index.md) Wendy `FR-2026-00001`; [docs/216](../216-fo-eff-slice3-production-release/index.md) asset-locked QR; [docs/222](../222-fo-eff-slice6-production-release/index.md) `FR-2026-00003`. Current `PublicRequestPortal` still locks building/asset context, accepts photo, and shows confirmation + request number + **View Request Status**.

**Could Wendy complete this without training?** Yes. The form is a short phone page with locked context already filled.

---

## 11. Complimentary tester flow

Simulated from certified grant/email (no new Production send):

```
Owner asks for email → Master Admin Send Access → branded welcome
  → claim → Guided Setup → product access → use app → reply with feedback
```

| Expectation | Live / certified behavior |
|-------------|---------------------------|
| Reply-To | `feedback@my-property-assistant.com` |
| Access is complimentary | Subject/headline “Your Complimentary {Product} Access” |
| What plan | Dynamic Property Manager / Facility Operations / Complete Platform |
| Expiration | “Expires on {date}.” or “No expiration.” |
| No payment during complimentary period | “No payment is required” / “will not be charged automatically” |
| How to report bugs | Tester welcome asks for bugs, errors, confusing behavior, or suggestions (screenshot mentioned) |

Guided Setup also states complimentary product vs purchased product.

Master Admin was only lightly checked: complimentary directory remains `/admin/commercial/complimentary-access`; unauthenticated `/admin` is Access denied.

---

## 12. Search usability

Header **Search workspace…** is visible without knowing a module path.

Human terms against certified evidence + Slice 4 UAT:

| Query | Expected | 1–2 actions? |
|-------|----------|--------------|
| `UAT-CHAIR-14` | Asset Detail | Yes |
| `FR-2026-00003` | Exact public request / WO | Yes |
| Demo Apartments / property name | Property record | Yes |
| Resident name | Resident record (PM-entitled) | Yes |

Technician search is narrower (assigned work). No-result copy: `No results for '{query}'. Try a name, tag, or request number.` Discoverability is good for managers.

---

## 13. Quick Create usability

Managers see **+ Create** in the header. Actions are entitlement-filtered (property, resident, work order, asset, PM plan, and so on). Technicians get no create menu. A manager does not need to know which module owns the create form.

---

## 14. Recent usability

Recent operational records appear in the Search palette when the query is empty. Technically correct and useful after the first visit. A brand-new user will not see Recent until they have opened something — expected. Discoverability is slightly weaker than Search/+ Create because Recent is inside the palette, not a sidebar item (P2).

---

## 15. Sidebar usability (docs/214 as a human)

| Question | Answer |
|----------|--------|
| Which surface am I in? | Complete: surface switcher + group title (Property Operations / Facility Operations). Single-SKU: product group title. |
| Which org am I in? | Organization name in the rail / account menu. |
| Is active location obvious? | Longest-prefix active item; current group marked. |
| Are groups understandable? | Overview / work / facilities / finance / shared — daily words, not API names. |
| Is important daily work easy to find? | Yes for PM and FO managers. Technician rail is deliberately short. |
| Does collapse remain understandable? | Icon rail + brand lockup; expand control stays on desktop. |
| Is mobile drawer straightforward? | **Menu** opens `app-mobile-nav-drawer` with the same rail. |

No redesign. No genuine navigation dead end for the eight personas.

---

## 16. Terminology

Stable product words kept. Flagged only where a new customer may pause:

| Term | Human risk | Severity |
|------|------------|----------|
| Mission Control | Not everyday English; the page itself answers “what needs attention” | P2 |
| Operations vs Maintenance | Complete users have both; group titles distinguish Facility vs Property | P2 |
| Assets vs Buildings | Day-1 says “building”; sidebar says **Assets** | P2 |
| M.P.A. Assistant | Sounds like chat; honesty line is “Rule-based next-action briefing” ([docs/223](../223-ai-assistant-functionality-audit/index.md)) | P2 |
| Confirm Plan | Commercial step name at checkout; constitution-binding flow | Not a defect |
| Financial Operations / Online Payments | Finance desk explains Online Payments | Not a defect |
| Request Forms / Work Templates / Assignment Rules / Preventive Maintenance | Page descriptions explain each in one sentence | Not a defect |

Do **not** rename these casually.

---

## 17. First 10 minutes — Property Manager

| Need | Present? |
|------|----------|
| Clear home | `/pm/mission-control` |
| Next action | Add first property (empty) or daily-ops first task |
| Blank dashboard | No — next-action card + empty-state copy |
| Mandatory Stripe | No |
| Search / Create | Header |
| Role-appropriate nav | Properties, Residents, Leasing, Maintenance, Financial Operations |

**Likely first useful action:** Add the first property.

---

## 18. First 10 minutes — Facility Operations

| Need | Present? |
|------|----------|
| Clear home | `/facility/mission-control` |
| Next action | Add first building in Assets, or open a Needs Attention row |
| Blank dashboard | Needs Attention empty is still an attention home with Day-1 guidance |
| Mandatory Stripe | No (FO has no tenant Pay) |
| Search / Create | Header for managers |
| Role-appropriate nav | Mission Control, My Work, Operations, Request Forms, Templates, Assets, PM, Assignment Rules, Vendors |

**Likely first useful action:** Add the first building/site in Assets, then create or receive the first work order.

---

## 19. First 10 minutes — Complete

| Need | Present? |
|------|----------|
| Clear home | `/launcher` (“Start here”) |
| Next action | Add first property/site; then open Property Operations or Facility Operations |
| Both surfaces | One-click switch for authorized users |
| Scoped staff | Only their surface |
| Mandatory Stripe | No |

**Likely first useful action:** Add the shared property/site, then open one workspace and complete one workflow.

---

## 20. Empty / recovery states (Owner unavailable)

| Situation | Recovery |
|-----------|----------|
| Don’t know where something is | Sidebar labels + header Search + + Create |
| Empty page | Day-1 / `ownerEmptyStateCopy` points to the next record (property, resident, building, work order, lease) |
| No search result | Human “try a name, tag, or request number” — not raw JSON |
| Unauthorized route | Access denied + **Go to your workspace** + Sign in again. Entitlement/role reasons are plain language. Optional `Required: {key}` is technical (P2) |
| Incomplete Stripe Connect | Online Payments: “Continue Stripe Setup” / “Stripe needs a few more details” — app remains usable |
| No work assigned (technician) | “Nothing assigned in this list.” |
| No assets / no PM plans / no request forms | Empty copy + create on the same page (“No rules yet. Create one below.” / Request Forms create / Assets empty) |

Good enough that the Owner does not have to narrate recovery.

---

## 21. Error states

Spot-check of customer-facing failures:

- Public form unavailable: “This request link is no longer available.” / “Could not open this form.”
- Mission Control load failure: “Mission Control could not load recommendations for this organization.”
- Unauthorized HTML is a page, not API JSON.
- Assignment / request updates surface `body.error` strings, not stack traces.

Not observed on public Production: UUID dump, stack trace, env names, Stripe internals, or database jargon as the primary UX.

`/unauthorized?reason=entitlement&required=…` can show a capability key in monospace. That is a polish issue (P2), not an unusable onboarding failure. Normal Complete scoped-staff CTAs no longer lead there ([docs/202](../202-complete-scoped-staff-handoff-remediation/index.md)).

---

## 22. Mobile

Phone-width (~390px) public Production: landing, Explore Platforms, pricing (PM $59 / FO $59 / Complete $109), login, unauthorized, Live Demo. Menu drawer pattern matches the certified staff drawer.

Authenticated core tasks are not desktop-only:

| Task | Mobile path |
|------|-------------|
| Login | Usable form |
| Sidebar | **Menu** drawer |
| Search / + Create | Header controls (`min-h-11`) |
| FO Mission Control / My Work / Asset Detail / PM plan | Same routes; certified phone QR walkthrough already exists |
| QR request | Phone-first public form |
| Tenant Billing | Portal form with large pay/AutoPay controls |

No desktop-only gate makes the core task impossible.

---

## 23. Click / efficiency confirmation

| Goal | Observed |
|------|----------|
| Find known record | Search → result, ~1–2 actions |
| Open attention item | Mission Control row → exact WO, ~1–2 |
| Technician assigned work | 1 destination: My Work |
| Public request | Scan → form → submit |
| Matching routing | 0 manager assignment clicks (certified `FR-2026-00003`) |
| Asset → PM plan | Asset Detail / Preventive Maintenance, ~2 |

Safety confirmations (activate rule, enable Online Payments) are extra clicks on purpose.

---

## 24. P0

**None.**

No security hole, data loss, or completely unusable onboarding path was found in this simulation.

---

## 25. P1

**None.**

The briefing permission fix is live on current Production. Complete scoped-staff cross-surface CTAs no longer dump users on `/unauthorized`. Empty homes have a next action. Technicians are not sent through management admin.

---

## 26. P2

Record only. Do **not** implement from this package.

1. **Recent** lives inside empty Search — useful after first use, easy to miss on minute one.
2. **Assets vs Buildings** — Day-1 says building; sidebar says Assets.
3. **Mission Control** and **M.P.A. Assistant** are product language; the pages explain themselves.
4. **Operations vs Maintenance** on Complete — group titles resolve it; first-time users may still ask once.
5. **Online Payments** is one click inside Financial Operations, not a top-level sibling.
6. **Work templates** nav capitalization is sentence case; Request Forms is title case.
7. Unauthorized entitlement view can show a capability key (`Required: …`).
8. Technician empty My Work does not say “ask your manager” — honest, slightly terse.
9. FO rail also lists category queues (Inspection / Safety / Compliance / Inventory / Parts / Building Systems). Empty is fine; the extra labels can feel like extra products. Not a dead end.

---

## 27. Exact remediation if required

**None required to begin real user onboarding.**

If the Owner later wants polish: smallest P2 packages would be copy-only (Assets/Buildings helper, Recent hint, unauthorized `required` wording). **STOP for authorization before any of those.** Do not implement them from this record.

---

## 28. Production safety

Re-verified during this package. **No mutations.**

| Gate | Result |
|------|--------|
| Tenant payment execution TRUE | **0 of 6** (`financial_module_settings`) |
| July freeze | **ON** (`finance_july_freeze_enabled() = true`) |
| M5 | **Unauthorized** (`isFinanceM5Authorized()` hard-coded `false`) |
| SaaS prices | Unchanged — **$59 / $59 / $109** monthly · **$566.40 / $566.40 / $1,046.40** annual (public `/pricing` HTML + `PM_BASE_MONTHLY_USD` / `FO_MONTHLY_USD` / `COMPLETE_BASE_MONTHLY_USD`) |
| SaaS purchase | Not performed |
| Real subscriber / employee | Not created |
| Tenant payment | Not processed |
| Connect create | Not performed |
| Complimentary grant/email | Not sent |
| New Production public request | Not created |

---

## 29. Final onboarding verdict

**P0 = 0. P1 = 0.**

**FINAL HUMAN ONBOARDING SIMULATION PASS — BEGIN REAL USER ONBOARDING**

A normal person can start using M.P.A. without the Owner explaining where everything is.

**STOP.** Do not start generative AI/chat, inventory expansion, native app, vendor auto-dispatch, predictive maintenance, favorites, saved views, additional routing intelligence, or new financial automation from this package.
