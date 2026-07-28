# 00 — Executive Summary

**Package:** UX-013  
**Status:** Draft — Ready for Approval  
**Date:** 2026-07-28

---

## Problem

Self-serve acquisition (ACQ-001) is live for Trial / Professional / Business with **pricing-first** selection. Product now needs buyers to choose **which operational modules they run** before they see price cards, and to stop marketing a standalone **Free Trial** as a public plan.

Separately, the authenticated shell still centers on a **single Ops navigation model** with module hiding (`entitledModules`). Org Admin, Property Ops, Facility Ops, and portal roles (Tenant, Owner, Technician, Vendor) need **purpose-built contextual sidebars** — still filtered by role, org permissions, and licensed modules — without inventing parallel entitlement systems.

---

## Business goals

| ID | Goal | Measure |
|----|------|---------|
| BG-01 | Module-intent clarity before price | Visitors select Property Ops / Facility Ops / Both before plan cards |
| BG-02 | Paid-first public messaging | No standalone Free Trial CTA or Trial plan card on public surfaces |
| BG-03 | Preserve commercial spine | Checkout → provision → Guided Setup → Active dashboard unchanged in architecture |
| BG-04 | Enterprise remains sales-assisted | Contact Sales / Schedule Demo only — no self-serve Enterprise Checkout |
| BG-05 | Contextual nav fitness | Each listed surface has an approved nav matrix; unentitled items never appear |
| BG-06 | Architecture reuse | BILL / AUTH / COM / Setup / capability matrix remain SoT |

---

## Success definition

A new property-management company can:

1. Land on the public site and understand value  
2. Optionally take the product tour  
3. Choose **Property Operations**, **Facility Operations**, or **Both**  
4. Compare **Professional** / **Business** (and Contact Sales for Enterprise)  
5. Complete Stripe Checkout **without** a public Trial plan path  
6. Receive Org Admin credentials, complete Guided Setup, reach Production Dashboard  
7. See navigation that matches **their role + permissions + licensed modules**

…without staff intervention for Professional / Business, and without a parallel billing or auth stack.

---

## Non-goals

| Non-goal | Why |
|----------|-----|
| Free open registration | Violates AUTH / COM hybrid acquisition rules |
| Self-serve Enterprise | Commercial / legal complexity |
| Dual money rails | ADR-024 SaaS separation remains binding |
| Full redesign of every module workflow | Nav + acquisition only |
| Resolving Vendor Portal product retirement in code | Documented as open question until Product decides |

---

## Relationship to approved packages

| Package | Relationship |
|---------|--------------|
| **ACQ-001** | Superseded **in part** by Amendment A11 (journey order + Trial messaging) once Accepted |
| **BILL-001** | Catalog / public Checkout plan set amended; money rail unchanged |
| **COM-001 A10** | Hybrid acquisition remains; Trial public channel tightened per UX-013 |
| **AUTH-001** | SetupGate + invitation-only team unchanged |
| **UX-012** | Contextual matrices refine navigation architecture / role playbooks — not a Canopy rewrite |

---

## Risks if delayed

- Marketing and Checkout continue to promise Free Trial while product wants paid-first positioning  
- Buyers pick plans without understanding Property vs Facility ops fit  
- Shell nav stays one-size-fits-all as Facility Ops and portals grow  

---

## Gate reminder

```
Design → Document → Approve → Implement
```

This package completes **Design + Document**. **Approve** is recorded only in [08 — Approval record](./08-approval-record.md). **Implement** is forbidden until then ([09](./09-implementation-lock.md)).
