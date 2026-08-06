# 2 — Onboarding Blockers

**Status:** Draft  
**Parent:** [LAUNCH-001](./index.md)  
**Audit date:** 2026-08-06  
**Method:** Code + docs walkthrough of the brand-new customer journey (no implementation)

---

## Verdict

A brand-new customer **cannot** become fully operational without assistance today.

Commercial chrome (SKU, entitlements, Guided Setup checklist for org/billing/home) is largely hardened.  
Operational onboarding (property → people → lease → rent → maintenance → vendors → daily Mission Control) is incomplete except for a **Financial Operations money path** that is easy to miss.

---

## Journey audit (today)

| Step | Status | What happens | Blocker type |
|------|--------|--------------|--------------|
| Purchase subscription | **Missing / simulated** | SKU chosen at org create or assigned in Master Admin — no SaaS checkout | Hard |
| Organization created | **Works** | Guided Setup / Settings create org; creator gets `property_manager` | — |
| Guided Setup | **Partial** | Org + product confirm + billing ack + home confirm only | Soft → Hard for ops |
| Property created | **Partial** | Create lives on FO Finance Desk; `/pm/properties` is money health, not create UX | Hard (discoverability) |
| Property import | **Missing** | No CSV/import path | Soft (manual create OK for #1) |
| Users invited | **Broken for self-serve** | Invite row created; **no email send**; UI does not surface accept URL/token | Hard |
| Roles assigned | **Partial** | Role at invite time; membership PATCH exists; **no role-edit UI** | Soft |
| Email verification | **Partial** | Supabase signup “check inbox”; no app verification UX beyond copy | Soft |
| Billing setup (SaaS plan) | **Partial** | `/billing` explains plan; no paid purchase | Soft for demo / Hard for real launch |
| Stripe (rent) configured | **Partial** | Platform Checkout env keys; Connect table exists; **no org Connect onboarding UI** | Hard for online rent |
| SignWell configured | **Missing** | Zero product surface | Hard if e-sign is launch-required |
| Workspace selection | **Works** | Launcher + org switcher with plan badge | Soft (login redirect dual path) |
| First login | **Works with friction** | Login → `/dashboard` vs middleware `/launcher` inconsistency | Soft |
| First dashboard | **Empty** | `/pm/mission-control` is alignment stub — no attention queue | Hard |
| First recommended action | **Missing** | No single CTA “Add first property”; First Five Minutes not wired | Hard |
| Resident added | **Partial** | Bundled into FO “Add resident lease”; `/pm/residents` stub | Hard (IA) |
| Lease created | **Partial** | Same FO path; `/pm/leasing` stub | Hard (IA) |
| Rent collected | **Works (if found)** | FO charges + manual pay + Checkout + resident portal | Soft (FO discoverability) |
| Maintenance request | **Stub** | `/pm/maintenance` alignment page only | Hard |
| Vendor assigned | **Stub for jobs** | `/pm/vendors` stub; FO has vendor **AP** only | Hard |
| Daily operations | **Not ready** | Mission Control not operational | Hard |

---

## Hard blockers (Customer #1 cannot proceed alone)

### H1 — Invitation dead end
- Invite API creates a tokenized invitation.
- No transactional email delivery (`packages/email` is not a send pipeline for invites).
- Settings UI shows email/role but **not** the accept link.
- Invitee cannot discover `/accept-invitation/[token]` without staff pasting a URL.

**Impact:** Team onboarding fails. Solo PM can continue; multi-user orgs cannot.

### H2 — Mission Control is not a command center
- `/pm/mission-control` uses `ModuleAlignmentPage` (“no business workflow”).
- No attention queue, no first-win CTA, no link into FO or property create.

**Impact:** First dashboard feels empty; customer does not know what to do.

### H3 — Core PM modules are shells labeled ready
- `/pm/residents`, `/pm/leasing`, `/pm/maintenance`, `/pm/vendors` are alignment stubs.
- Nav often reads as available while workflows are absent.

**Impact:** Customer clicks “real” modules and hits dead ends → support load / churn.

### H4 — Property / resident / lease setup buried in FO
- Creation is on Financial Operations Finance Desk (`#setup`), not Properties or Guided Setup.
- `/pm/properties` shows money health panels (S3) but does not create properties.

**Impact:** Money demo possible only if someone knows the FO path; unaided onboarding fails.

### H5 — Stripe Connect org onboarding missing
- Rent Checkout works when **platform** Stripe env is configured.
- Org-level Connect readiness UI / empty states called out in FO design are not delivered.
- Customer cannot self-serve “connect my bank / account to collect.”

**Impact:** Online collection depends on operator/env setup, not customer setup.

### H6 — SignWell absent
- No configuration, no lease send, no status.

**Impact:** If launch requires e-sign leases, journey stops. If leases are offline-OK for #1, downgrade to soft/scope decision.

### H7 — Maintenance → vendor assignment loop missing
- Cannot submit a real maintenance request or assign a vendor to work.

**Impact:** “Daily operations” story incomplete even if rent works.

### H8 — No real purchase path
- Customer can pick SKU at create (shopping feel) or Admin assigns.
- No paid SaaS Checkout for M.P.A. subscription.

**Impact:** Commercial trust + real Customer #1 acquisition path incomplete (partially mitigated by Admin assign for a white-glove #1).

### H9 — LAUNCH-001 not approved for implementation
- Gate: LAUNCH-001 **Stopped** until designed, documented, approved.
- This package is Draft audit only.

**Impact:** Process blocker — correct until Approve.

---

## Soft blockers (confused but not fully stopped)

| ID | Issue | Why it hurts |
|----|-------|--------------|
| S1 | Dual org-create (Setup + Settings) with SKU select still in Settings | Undermines “what you purchased” |
| S2 | Login redirect split (`/dashboard` vs `/launcher`) | Inconsistent first landing |
| S3 | Guided Setup does not include property / invite / Connect / first money win | Commercial Pass ≠ operational ready |
| S4 | `setupComplete` does not gate module access | Customer can skip comprehension and still wander |
| S5 | Default invite role = `tenant` | Easy to invite wrong role |
| S6 | Membership list shows raw user ids; no role change UI | Hard to manage team |
| S7 | “Aligned” vs empty workflow | Overstates readiness |
| S8 | Portal shells (`/portal/manager`) beside product homes | Duplicate mental model |
| S9 | Property import missing | OK for single-property #1; painful for portfolio customers |
| S10 | FO Command Center is powerful but not the Setup destination | Power users find it; new customers do not |

---

## Confusion points (by stage)

### Purchase → Setup
- “Did I buy this, or did I just pick it?”
- Facility SKU buyers see mostly Planned modules after commercial Pass.

### First dashboard
- Mission Control empty vs FO rich — wrong default home for first win.
- No assistant “do this next” on Mission Control.

### Property & people
- Properties page looks financial, not administrative.
- Residents/Leasing stubs after FO already created a lease elsewhere → data/IA split brain risk.

### Payments
- SaaS Billing (`/billing`) vs rent collection (FO) naming must stay distinct — currently OK if found; Setup never mentions rent Stripe.

### Ops
- Vendor AP in FO ≠ vendor job assignment in Maintenance.

---

## What works today (do not break)

| Capability | Evidence |
|------------|----------|
| Fail-closed entitlements | Middleware + unauthorized |
| Guided Setup commercial checklist | Org / billing / home |
| Plan page + inclusions | `/billing` |
| FO money loop S0–S3 | Charges, collect, delinquency, AP, snapshots, owner summary |
| Resident portal pay | `/portal/tenant/billing` when Stripe env present |
| Invitation accept **route** | `/accept-invitation/[token]` exists if token known |
| Org switcher plan badge | Commercial clarity |

---

## Blocker summary

| Severity | Count | Theme |
|----------|------:|-------|
| Hard | 9 | Invites, Mission Control, module stubs, FO burial, Connect, SignWell, maintenance loop, purchase, gate |
| Soft | 10 | IA, redirects, Setup scope, labeling, role UX |

**Net:** Commercial onboarding Pass ≠ unaided operational launch readiness.
