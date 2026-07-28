# 28 — Amendment A11: Modules-First Acquisition & Trial Messaging Removal

**Package:** ACQ-001  
**Amendment ID:** A11  
**Status:** ✅ **Accepted** (2026-07-28) — companion to [UX-013](../117-ux-013-customer-acquisition-contextual-navigation/README.md)  
**Type:** Amendment to ACQ-001 binding journey and public website — **not** a replacement of ACQ-001  
**Date:** 2026-07-28  
**Gate:** Design → Document → Approve → Implement  
**Policy:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)  
**Does not authorize by itself:** application/UI code — requires `ACCEPT ACQ-001 AMENDMENT A11` **and** `APPROVE UX-013` **and** slice authorize

---

## Purpose

Record the product decision that public self-service acquisition:

1. Uses **module selection before pricing** (Property Ops / Facility Ops / Both)  
2. **Removes standalone Free Trial messaging** and the public Trial plan card / “Start free trial” CTA  
3. Continues to forbid public Sign Up / pre-payment registration  
4. Keeps post-payment **Guided Setup / SetupGate** continuity (no trial-specific onboarding fork)

UX-013 is the experience SoT for the amended journey and contextual navigation. ACQ-001 remains SoT for acquisition orchestration into BILL / AUTH / COM.

---

## Prior rules (binding until A11 Accepted)

| Item | Prior text (ACQ-001 Approved 2026-07-27) |
|------|------------------------------------------|
| Happy path | Tour → **Pricing** → Select Plan → Checkout → … |
| Public plans | **Trial** + Professional + Business; Enterprise = Contact Sales |
| OQ-01 | Trial **enabled** as public self-serve via Stripe Trial with payment method |
| Landing CTAs | **Start free trial** / See pricing / Take the tour |

---

## New rules (binding when A11 Accepted)

### Journey (supersedes §02 steps 3–4 and README happy path order)

```
Visitor → Landing → [Product Tour?] → Module selection
  → Pricing (Professional / Business) → Stripe Checkout → Payment Success
  → Provision → Welcome / First Login → Guided Setup → Active → Dashboard
```

| Step change | New binding |
|-------------|-------------|
| Module selection | **Required** before Checkout entry (Property Ops / Facility Ops / Both) |
| Pricing | Shows Professional / Business for the selected modules; Enterprise = Contact Sales |
| Trial | **Not** a public selectable plan; no standalone Free Trial CTA |

### Public messaging

| Forbidden | Allowed |
|-----------|---------|
| “Start free trial” as primary/secondary marketing CTA | “Choose modules” / “See pricing” / “Contact sales” / “Take the tour” |
| Trial plan card on `/pricing` | Professional / Business cards + Enterprise Contact Sales |
| “Create free account” / Sign Up without Checkout success | Unchanged forbid |

### Checkout entry

| Allowed public `plan_code` | Disallowed public entry |
|----------------------------|-------------------------|
| `professional`, `business` | `trial`, `enterprise`, `founder` |

Checkout metadata **must** include module selection (see UX-013 §02). Money rail remains BILL-001.

### Guided Setup

Unchanged spine: SetupGate + Finish Setup. **No** separate trial evaluator workflow after payment.

---

## Documents superseded in part (when Accepted)

| Document | Change |
|----------|--------|
| [README](./README.md) product direction / happy path | Modules-first; Trial removed from public self-serve marketing |
| [02 — Customer journey](./02-customer-journey.md) | Insert module selection; remove Trial from plan comparison step |
| [03 — Public website](./03-public-website.md) | Landing CTAs; pricing table without Trial card |
| [00 — Executive summary](./00-executive-summary.md) | Success definition without Trial selection |
| [01 — Personas](./01-personas.md) | P3 Trial evaluator reframed or retired from public path |
| [18 — Open questions](./18-open-questions.md) | OQ-01 superseded by A11 + UX-013 OQ-02 |
| [19 / 21 Approval](./21-approval-record.md) | Historical Approve remains; A11 governs going forward after Accept |
| COM-001 A10 C6′ | Trial parenthetical tightened — public Trial channel closed; Pro/Business self-serve remains |

Historical Slice A–C implementation records remain accurate **for the time they were written**. Future public acquisition work must follow **A11 + UX-013**.

---

## What does not change

| Area | Status |
|------|--------|
| AUTH invitation-only for team members | Unchanged |
| Enterprise sales-assisted | Unchanged |
| BILL Stripe Billing rail / one-sub invariant | Unchanged |
| Org only after payment success | Unchanged (Trial Checkout no longer a public path) |
| COM lifecycle spine after payment | Unchanged |
| ACQ ownership of public UX orchestration | Unchanged |

---

## Companion artifacts

| Artifact | Role |
|----------|------|
| [UX-013](../117-ux-013-customer-acquisition-contextual-navigation/README.md) | Journey + nav matrices SoT |
| [BILL-001 modules-first amendment](../100-bill-001-saas-subscription-billing/22-amendment-modules-first-public-catalog.md) | Catalog / trial code handling |
| [ADR-031](../18-decision-log/adr-031-ux-013-modules-first-contextual-navigation.md) | Architecture decision |

---

## Approval

| Item | Value |
|------|-------|
| Phrase | `ACCEPT ACQ-001 AMENDMENT A11` |
| Also required | `APPROVE UX-013` |
| Status | ✅ Accepted |
| Date | 2026-07-28 |
| Approvers | Product Owner (session) |

Recorded in [UX-013 §08](../117-ux-013-customer-acquisition-contextual-navigation/08-approval-record.md).
