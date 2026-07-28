# 30 — UX-012 Slice A Authorization

**Package:** UX-012 — Platform Experience & Design System  
**Slice:** **A — Design foundations**  
**Status:** ✅ **AUTHORIZED**  
**Authorization date:** 2026-07-24  
**Binding phrase (issued):**

```
AUTHORIZE UX-012 SLICE A
```

**Program record:** [CORE-003 §38](../113-core-003-implementation-master-plan/38-ux-012-slice-a-authorization.md)  
**Slice catalog:** [19 — Implementation slices](./19-implementation-slices.md)  
**Package approval:** [29 — Approval record](./29-approval-record.md) · ✅ APPROVED WITH AMENDMENTS  
**M0 prerequisite:** ✅ **GO** ([36](../113-core-003-implementation-master-plan/36-final-m0-governance-review.md))

> **This document authorizes Slice A implementation only.**  
> It does **not** begin implementation in this governance session.  
> Slices B–E, OPS-001, AUTH-001 (including Slice D deferred roles), COM-001, PMX-004 Phase 2, and FIN-003 remain **locked**.

---

## 1. Prerequisite verification

| Prerequisite | Evidence | Status |
|--------------|----------|--------|
| UX-012 Approved with Amendments | [29](./29-approval-record.md) · A01–A08 | ✅ |
| ADR-029 Accepted | [ADR-029](../18-decision-log/adr-029-platform-experience-design-system.md) | ✅ |
| Canopy Approved (token values) | [06 Design Language](../06-design-language/index.md) | ✅ |
| Implementation slices finalized | [19](./19-implementation-slices.md) | ✅ |
| M0 = GO | [36](../113-core-003-implementation-master-plan/36-final-m0-governance-review.md) | ✅ |
| M0.1 PMX-004 device cert PASS | [35](../113-core-003-implementation-master-plan/35-pmx-004-real-device-certification.md) · [18](../106-pmx-004-native-pwa-parity/18-pmx-004-amd-device-cert-owner-checklist.md) | ✅ |
| M0.2 PAY-001 VERIFIED | [26](../113-core-003-implementation-master-plan/26-pay-001-production-closeout.md) | ✅ |
| M0.3 Infrastructure PASS | [27](../113-core-003-implementation-master-plan/27-m0-infrastructure-closeout.md) | ✅ |
| M0.4 Perf CONDITIONALLY SATISFIED | [24](../113-core-003-implementation-master-plan/24-core-003-amd-m0-perf-framework-limit.md) | ✅ |
| M0.5 Auth regression (implemented roles) + REG-ACL | [28](../113-core-003-implementation-master-plan/28-m0-authenticated-regression-certification.md) · [28a](../113-core-003-implementation-master-plan/28a-implemented-role-regression-rerun.md) · [34](../113-core-003-implementation-master-plan/34-reg-acl-001-production-verification.md) | ✅ |
| No open M0 blocking defects | [36](../113-core-003-implementation-master-plan/36-final-m0-governance-review.md) §5 | ✅ |
| Explicit authorize phrase recorded | **This document** | ✅ |

**Governance blockers remaining for Slice A?** ❌ **None.**

---

## 2. Authorization scope

### In scope (Slice A)

| Deliverable | Binding source |
|-------------|----------------|
| Design Tokens | [02](./02-design-system.md) · [22](./22-design-token-governance.md) · Canopy |
| Typography | [02](./02-design-system.md) · Canopy type scale / families |
| Spacing | [02](./02-design-system.md) · Canopy spacing scale |
| Color System | [02](./02-design-system.md) · Canopy color + light/dark semantic pairs |
| Token governance enforcement in `packages/ui` | [22](./22-design-token-governance.md) |
| No hardcoded styling values on **touched** foundation surfaces | [22](./22-design-token-governance.md) · [18](./18-acceptance-criteria.md) |

### Implementation boundaries

1. Work is limited to **design foundations** (tokens, typography, spacing, color) and the plumbing that makes them consumable (`packages/ui` theme / CSS variables / Tailwind theme maps as already patterned).  
2. Touch only surfaces required to establish or enforce foundations — do not redesign product workflows.  
3. Prefer extending Canopy / existing token maps over inventing a parallel system.  
4. Light and dark semantic pairs must remain coherent.  
5. Material scope expansion beyond Slice A requires a new authorize phrase (Slice B+).  
6. No schema, auth model, payments, messaging, or PWA architecture changes under this authorize.

---

## 3. Excluded functionality (explicit)

| Excluded | Remains |
|----------|---------|
| Core components, forms, navigation, tables, cards | Slice B |
| Role dashboards, Command Center, role playbook UI | Slice C |
| AI experience chrome, motion system shipping, full a11y sweep, responsive overhaul | Slice D |
| Visual polish / microinteractions / final UX validation | Slice E |
| OPS-001 / AUTH-001 / COM-001 any slice | Separate package authorize |
| AUTH-001 Slice D (Org Admin · Leasing Agent · Facility Technician) | Deferred ([33](../113-core-003-implementation-master-plan/33-core-003-amd-m0-auth-role-cert-defer.md)) |
| PMX-004 Phase 2+ | `AUTHORIZE PMX-004 PHASE 2` |
| FIN-003 / PAY destination enable | Ops / package gates |
| Competing design systems / one-off token sets | Forbidden ([18](./18-acceptance-criteria.md)) |
| User-selectable dashboards / bolt-on purple AI chrome | Forbidden package-wide |

---

## 4. Dependencies

| Dependency | Role |
|------------|------|
| Canopy (Approved) | Token **values** / visual identity SoT |
| UX-012 Approved with Amendments | Experience SoT + governance |
| ADR-029 | Architectural authority |
| CORE-003 M0 = GO | Program unlock prerequisite |
| Existing `packages/ui` / app theme patterns | Implementation substrate |

**Does not depend on:** OPS-001, AUTH-001 Slice A, COM-001, PMX-004 Phase 2, FIN-003 C+.

---

## 5. Acceptance criteria (Slice A)

| ID | Criterion |
|----|-----------|
| A-01 | Design token categories required by [22](./22-design-token-governance.md) are represented in the consumable theme (`packages/ui` / CSS variables) for Color, Typography, Spacing (and related foundation categories already in Canopy). |
| A-02 | Typography roles map to Canopy direction (display / body / mono) without introducing a second type system. |
| A-03 | Spacing uses the Canopy scale; no new arbitrary spacing ladder. |
| A-04 | Color system exposes semantic light/dark pairs for brand, surface, text, border, status, interactive (as defined in Canopy / [22](./22-design-token-governance.md)). |
| A-05 | Token audit on **touched** foundation surfaces is clean — no new hardcoded colors/fonts/radii/shadows that bypass tokens. |
| A-06 | Feature code paths touched for foundations reference semantic (or component) tokens — not raw HEX in JSX/CSS modules. |
| A-07 | No Slice B–E product UI / Command Center / role-home redesign shipped under this authorize. |
| A-08 | Design Review Process ([28](./28-design-review-process.md)) applied to Slice A surfaces before validation close. |
| A-09 | Quality standards applicable to foundations ([25](./25-design-quality-standards.md)) met for touched work. |
| A-10 | Package fail conditions in [18](./18-acceptance-criteria.md) not violated. |

---

## 6. Exit criteria (Validation)

Slice A exits **Validated** only when **all** are true:

1. Acceptance criteria A-01–A-10 satisfied.  
2. Token audit clean for touched foundation surfaces.  
3. Light/dark semantic pairs verified.  
4. Design Review Process completed for Slice A scope ([28](./28-design-review-process.md)).  
5. Validation phrase recorded:

```
VALIDATE UX-012 SLICE A
```

Until Validation is recorded: Slice B remains **locked**.

---

## 7. Deferred / outside Slice A (remain open)

| Item | Disposition |
|------|-------------|
| UX-012 Slices B–E | Locked until each `AUTHORIZE UX-012 SLICE …` |
| OPS-001 Slice A | After UX-A Validated + `AUTHORIZE OPS-001 SLICE A` |
| AUTH-001 Slice A | After OPS-A Validated (default M1 order) |
| AUTH-001 Slice D roles | Deferred; not unblocked by this authorize |
| PMX-004 Phase 2 | Separate authorize |
| PAY-001 destination enable | Ops-gated |
| UI-001 large-scale polish package | Inherits UX-012; not Slice A |
| Historical M0 / PMX FAIL records | Preserved; not rewritten |

---

## 8. Recommendation

| Field | Result |
|-------|--------|
| **Authorize Slice A?** | ✅ **YES — AUTHORIZED** |
| **Recommend begin Slice A implementation?** | ✅ **YES** — in a **separate implementation session** explicitly tasked to implement Slice A |
| **Begin implementation in this governance session?** | ❌ **NO** |
| **Next program step after Validation** | `AUTHORIZE OPS-001 SLICE A` (per CORE-003 M1) |

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Governance / Product Owner authority | ✅ **AUTHORIZE UX-012 SLICE A** | 2026-07-24 |
| Implementation | ✅ Completed · [31](./31-slice-a-implementation.md) | 2026-07-24 |
| Validation | ✅ **PASS** · `VALIDATE UX-012 SLICE A` · [32](./32-slice-a-validation.md) | 2026-07-24 |
