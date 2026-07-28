# 43 — Amendment A10: Self-Service Customer Acquisition

**Package:** COM-001  
**Amendment:** **A10**  
**Status:** ✅ **Accepted** (2026-07-27) — companion to [ACQ-001](../115-acq-001-self-service-customer-acquisition/README.md) Approved  
**Type:** Amendment to COM-001 binding decisions — **not** a replacement of COM-001  
**Date:** 2026-07-27

---

## Purpose

Record the product decision that **public self-service acquisition** is permitted for standard plans, superseding binding decision **C6 (Invitation-only acquisition)** while preserving Enterprise sales-assisted onboarding and AUTH invitation-only rules for team members.

---

## Prior rule (C6)

| Item | Prior text |
|------|------------|
| **C6** | Invitation-only acquisition |
| Meaning | Customers are not created via public self-registration; acquisition was sales/activation driven |

Related acceptance language forbade “public self-registration as acquisition path.”

---

## New rule (C6′ — replaces C6)

| Item | New binding text |
|------|------------------|
| **C6′** | **Hybrid acquisition** |
| Self-serve | Public self-service acquisition **permitted** for **Trial** (if retained), **Professional**, and **Business** via Stripe Checkout |
| Provision | Organization provisioning is **automatic** after successful payment (or successful Trial Checkout activation), using existing COM → AUTH pipelines |
| Enterprise | **Enterprise** customers remain **sales-assisted** (Contact Sales / Schedule Demo → COM pipeline). No public Enterprise Checkout |
| Unchanged | Authentication, billing (BILL-001), entitlement enforcement, Guided Setup, activation, audit, and notifications architecture remain the systems of record — **no duplicate workflows** |

---

## Clarifications (binding)

1. **Not open registration.** Visitors may not create a free organization without Checkout / Trial activation success. AUTH-001 invitation-only for **subaccounts / team users** remains fully in force.
2. **Purchase ≠ signup.** The public CTA is “Start trial / Choose plan / Contact sales,” never “Create free account.”
3. **COM remains commercial SoT.** Self-serve is an **acquisition channel** into the same lifecycle spine (Subscription Purchased → Payment Successful → Org Created → … → Active).
4. **Q10 resolved.** [15 — Open questions](./15-open-questions.md) Q10 (“Self-serve Checkout without sales”) is answered: Pro/Business (+ Trial if retained) self-serve OK; Enterprise sales-assisted.
5. **ACQ-001** is the UX/design SoT for public discovery → Checkout entry → success/resume surfaces. COM-001 remains SoT for commercial lifecycle, opportunities, health, offboarding, and staff commercial ops.

---

## Documents superseded in part

| Document | Change |
|----------|--------|
| [README binding C6](./README.md) | C6 → C6′ (this amendment) |
| [00 — Executive summary](./00-executive-summary.md) | Invitation-only acquisition row updated |
| [12 — Acceptance criteria](./12-acceptance-criteria.md) | Remove blanket forbid of public self-serve purchase; keep forbid of free open registration |
| [02 — Sales-to-customer workflow](./02-sales-to-customer-workflow.md) | Add parallel self-serve spine; Enterprise unchanged |
| Slice auth docs citing “C6 forever” | Historical; A10 governs going forward after Accept |

Historical Slice A–E validation records remain accurate **for the time they were written**; they are not rewritten. Future work must follow **C6′**.

---

## What does not change

| Area | Status |
|------|--------|
| C1–C5, C7–C12 | Unchanged |
| Amendments A01–A09 | Unchanged |
| BILL-001 money rail separation | Unchanged |
| AUTH-001 username identity + invitation-only team | Unchanged |
| Won ↛ org without payment success | Unchanged (self-serve still requires payment/Trial success) |
| Staff commercial dashboard | Unchanged |

---

## Approval

| Item | Value |
|------|-------|
| Decision phrase | ✅ `ACCEPT COM-001 AMENDMENT A10` (with `APPROVE ACQ-001`, 2026-07-27) |
| Gate owners | Product + Commercial + Architect (+ Security for acquisition abuse) |
| Blocks | ACQ Implement until ACQ Approved — **cleared**; slice authorize still required |

---

## Implementation note

Accepting A10 **does not** authorize application code by itself. Implementation requires **`APPROVE ACQ-001`** plus an ACQ slice authorize phrase.
