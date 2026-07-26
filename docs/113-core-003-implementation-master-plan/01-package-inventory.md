# 01 — Package Inventory

**Package:** CORE-003  
**As-of:** 2026-07-23

Every implementation unit below is in scope for the master order. Status reflects governance/evidence at package READMEs — not informal code branches.

---

## COM-001 — Customer Lifecycle & Commercial Operations

| Unit | Name | Status | Package-internal depends |
|------|------|--------|---------------------------|
| Slice A | Commercial data foundation (pipeline, activation contract) | 🔒 Locked | Approved package |
| Slice B | Implementation progress + trial | 🔒 Locked | A Validated |
| Slice C | Health + feature discovery + timeline | 🔒 Locked | B Validated |
| Slice D | Offboarding + success automation | 🔒 Locked | C Validated |
| Slice E | Staff commercial dashboard (+ marketplace prep) | 🔒 Locked | D Validated; ADMIN-003 alignment |

**Unlock:** `AUTHORIZE COM-001 SLICE A` (then B…E in order)  
**SoC:** Does not invent auth identity or owner payouts.

---

## AUTH-001 — Organization Provisioning & Authentication

| Unit | Name | Status | Package-internal depends |
|------|------|--------|---------------------------|
| Slice A | Identity foundation (username, first login) | ✅ **VALIDATED** | Approved package |
| Slice B | Organization provisioning + Org Admin | ✅ **VALIDATED** | A Validated |
| Slice C | Invitations & credentials delivery | ✅ **VALIDATED** | B Validated |
| Slice D | Authorization surfaces (roles, dashboards) | ✅ **VALIDATED** | C Validated |
| Slice E | Recovery, audit, support | ✅ **AUTHORIZED** | D Validated |

**Unlock:** `AUTHORIZE AUTH-001 SLICE E` (issued) · [44](./44-auth-001-slice-e-authorization.md) · [AUTH-001 §47](../109-auth-001-organization-provisioning-authentication/47-slice-e-authorization.md) · next: implement Slice E → `VALIDATE AUTH-001 SLICE E`  
**Cross-deps:** Slice B consumes COM/BILL activation; must not invent “customer” without COM/BILL Payment Successful semantics. Slice C consumes EML-001 send pipeline. Slice D certified deferred Org Admin / Leasing / Facility Tech roles ([33](./33-core-003-amd-m0-auth-role-cert-defer.md)). Slice E consumes EML-001 for recovery/reset sends.

---

## FIN-003 — Owner Payout / Stripe Connect

| Unit | Name | Status | Depends |
|------|------|--------|---------|
| Phase A | Connect foundation | ✅ COMPLETE · CERTIFIED PASS | — |
| Phase B | Owner onboarding polish | ✅ COMPLETE · CERTIFIED PASS | A |
| Phase C | Allocation & transfer (money) | 🔒 Locked | **PAY-001 Verified** + Phase C Authorize |
| Phase D | Portal & notifications | 🔒 Locked | C |
| Phase E | Hardening & cert | 🔒 Locked | D |

**Predecessor:** PAY-001 (Slices 1–2 done; Slice 3 🔒; full A1–A21 Verified required before Phase C).

---

## OPS-001 — Platform Operations Architecture

| Unit | Name | Status | Package-internal depends |
|------|------|--------|---------------------------|
| Slice A | Event Bus + Activity Timeline | 🔒 Locked | Approved package |
| Slice B | Notification Center + Reminder + Scheduler | 🔒 Locked | A Validated |
| Slice C | Task Engine + Workflow + Priority | 🔒 Locked | B Validated |
| Slice D | AI Operations Director + Automation + Analytics | 🔒 Locked | C Validated |
| Slice E | Unified Inbox + Command Center + Search + Quick Actions | 🔒 Locked | D Validated |

**Unlock:** `AUTHORIZE OPS-001 SLICE A`  
**Rule:** Modules emit into OPS; no parallel buses.

---

## PMX-004 — Native PWA Parity

| Unit | Name | Status | Depends |
|------|------|--------|---------|
| Phase 1 | Unified Service Worker | Code ✔ · Prod deploy ✔ · **Device Final PASS ⛔** | Approve |
| Phase 2 | Native Installation Experience | ✅ **VALIDATED PASS** ([§62](./62-pmx-004-phase-2-validation.md) · [PMX-004 §21](../106-pmx-004-native-pwa-parity/21-phase-2-validation.md)) | Phase 1 Final PASS + authorize issued |
| Phase 3 | Native Application Shell | ✅ **VALIDATED PASS** ([§65](./65-pmx-004-phase-3-validation.md) · [PMX-004 §24](../106-pmx-004-native-pwa-parity/24-phase-3-validation.md)) | Phase 3 Validated |
| Phase 4 | Standalone Compliance | ✅ **VALIDATED PASS** ([§68](./68-pmx-004-phase-4-validation.md) · [PMX-004 §28](../106-pmx-004-native-pwa-parity/28-phase-4-validation.md)) | Phase 4 Validated |
| Phase 5 | Native Mobile UX + UX matrix first pass | ✅ **VALIDATED PASS** ([§71](./71-pmx-004-phase-5-validation.md) · [PMX-004 §31](../106-pmx-004-native-pwa-parity/31-phase-5-validation.md)) | Phase 5 Validated |
| Phase 6 | Push certification | ❌ **VALIDATION FAIL** ([§74](./74-pmx-004-phase-6-validation.md) · [PMX-004 §34](../106-pmx-004-native-pwa-parity/34-phase-6-validation.md)) · Remediation R1 (Production ship) | Re-validate after Phase 6 deploy READY |
| Phase 7 | Offline reliability | 🔒 Locked | Phase 1 (critical) |
| Phases 8–9 | Perf / premium | 🔒 Locked | Soft overlap rules in package 05 |
| Phase 10 | Production validation | 🔒 Locked | 1–9 |
| Phase 11 | Real-world pilot | 🔒 Locked | Phase 10 — **COMPLETE gate** |

---

## UX-012 — Platform Experience & Design System

| Unit | Name | Status | Package-internal depends |
|------|------|--------|---------------------------|
| Slice A | Design foundations (tokens, type, spacing, color) | 🔒 Locked | Approved; Canopy Approved |
| Slice B | Core components | 🔒 Locked | A Validated |
| Slice C | Role surfaces / Command Center chrome | 🔒 Locked | B Validated; OPS data when required |
| Slice D | AI + a11y + responsive | 🔒 Locked | C Validated |
| Slice E | Polish + final UX validation | 🔒 Locked | D Validated |

**Unlock:** `AUTHORIZE UX-012 SLICE A`  
**Inheritance:** UI-001 and role UIs inherit UX-012; Canopy remains token SoT.

---

## PAY-001 — Settlement Funding (binding predecessor)

| Unit | Status |
|------|--------|
| Slice 1 | ✅ PASS |
| Slice 2 | ✅ COMPLETE |
| Slice 3 | 🔒 NOT AUTHORIZED |
| Full Verified (A1–A21) | Required before FIN-003 Phase C |

Listed here because **FIN-003 C is blocked without it**, even though PAY-001 was outside the brief title list.
