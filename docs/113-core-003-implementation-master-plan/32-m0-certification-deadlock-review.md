# 32 — M0 Certification Deadlock Review

**Package:** CORE-003 · M0 · Governance Review  
**Document ID:** `CORE-003-M0-CERT-DEADLOCK-REVIEW`  
**Status:** ✅ **CLOSED** — OPTION B adopted as `CORE-003-AMD-M0-AUTH-ROLE-CERT-DEFER` ✅ **APPROVED** ([33](./33-core-003-amd-m0-auth-role-cert-defer.md))  
**Date:** 2026-07-24  
**Code / AUTH-001 / UX-012 / OPS / COM / FIN-003:** ❌ **Not modified · not authorized**

**Related:** [05](./05-master-implementation-order.md) · [24](./24-core-003-amd-m0-perf-framework-limit.md) · [28](./28-m0-authenticated-regression-certification.md) · [30](./30-reg-cov-001-qa-fixture-certification.md) · [31](./31-role-model-reconciliation.md) · [AUTH-001](../109-auth-001-organization-provisioning-authentication/README.md) · [ADR-026](../18-decision-log/adr-026-organization-provisioning-username-identity.md)

---

## 1. Engineering Summary

M0 has exhausted certification work that can be performed against **implemented** production capabilities. The remaining failure of Authenticated Regression to achieve a full multi-role PASS is caused by requiring proof of three AUTH-001 first-class roles that **do not exist in production** and **cannot be created without AUTH-001 Slice D**.

Under the current CORE-003 serial order, AUTH-001 Slice D is reachable only **after** M0 = GO (then UX-012 A → OPS-001 A → AUTH-001 A→B→C→D). Holding M0.5 open until those roles exist creates a **circular gate**: M0 waits on AUTH-001 Slice D; AUTH-001 Slice D waits on M0.

| Classification | Verdict |
|----------------|---------|
| Is this a **production defect**? | **No** — absence of unimplemented architecture is expected |
| Is this an **expected pre-implementation limitation**? | **Yes** |
| Is M0 blocked by **implementation prerequisites** rather than **production readiness**? | **Yes** (for these three roles) |

**Recommendation: OPTION B** — **ADOPTED** via [33](./33-core-003-amd-m0-auth-role-cert-defer.md) ✅ APPROVED. M0 authenticates only implemented roles; Organization Administrator / Leasing Agent / Facility Technician certification moves to AUTH-001 Slice D acceptance. No implementation is authorized by the amendment.

---

## 2. Current M0 Status

| Gate | Status | Notes |
|------|--------|-------|
| M0.4 Performance | ✅ CONDITIONALLY SATISFIED | [24](./24-core-003-amd-m0-perf-framework-limit.md) |
| M0.3 Infrastructure | ✅ PASS | [27](./27-m0-infrastructure-closeout.md) |
| M0.2 PAY-001 | ✅ VERIFIED | [26](./26-pay-001-production-closeout.md) |
| Storage regression (REG-STOR-001) | ✅ PASS | [29](./29-reg-stor-001-remediation.md) |
| Authorization regression (REG-ACL-001) | ⚠ Conditionally PASS | Code remediated ([31](./31-role-model-reconciliation.md)); Production deploy re-verify still required |
| M0.5 Authenticated regression | ❌ FAIL (as currently scoped) | REG-COV-001 — three AUTH-001 roles not in production ([28](./28-m0-authenticated-regression-certification.md) · [30](./30-reg-cov-001-qa-fixture-certification.md)) |
| M0.1 PMX-004 real-device certification | ❌ Not PASS / not authorized to run as final gate yet | Distinct readiness item |
| M0.6 Final readiness review | ❌ NO-GO | Depends on remaining gates |
| Role model reconciliation | ⚠ CONDITIONAL PASS | Option A architecture truth; implementation deferred ([31](./31-role-model-reconciliation.md)) |

**Implemented membership roles in production today:** `property_manager` · `property_owner` · `tenant` · `vendor` (+ Master Admin via metadata).

**Approved but not implemented membership roles:** Organization Administrator · Leasing Agent · Facility Technician (AUTH-001 Option A — [31](./31-role-model-reconciliation.md)).

---

## 3. Deadlock Analysis

### What full authenticated certification currently requires

Per [28](./28-m0-authenticated-regression-certification.md) / [30](./30-reg-cov-001-qa-fixture-certification.md), suite PASS has been interpreted to require dedicated fixtures and exercises for every role in the AUTH-001 catalog, including:

1. Organization Administrator  
2. Leasing Agent  
3. Facility Technician  

Those roles are **not** in `USER_ROLES` / `organization_memberships_roles_check`. Provisioning them requires schema + role templates + dashboard assignment — **AUTH-001 Slice D** (after A→C), which is 🔒 locked and **must not** be started from M0 certification work ([31](./31-role-model-reconciliation.md)).

### Why this is not a production defect

| Test | Result |
|------|--------|
| Do the three roles fail in production because of a bug? | **No** — they are undefined membership values |
| Does AUTH-001 approve them as architecture? | **Yes** |
| Has AUTH-001 Slice D been authorized? | **No** |
| Is missing Slice D output expected before implementation? | **Yes** |

This matches the pattern already accepted for Performance: a gate that permanently requires work outside the current implementation plane is a **governance sequencing problem**, not an indefinite production-quality failure ([24](./24-core-003-amd-m0-perf-framework-limit.md)).

### Circular dependency (binding order)

From [05 — Master Implementation Order](./05-master-implementation-order.md):

```
M0 GO
  → AUTHORIZE UX-012 SLICE A
  → OPS-001 Slice A
  → AUTH-001 Slice A
  → … → AUTH-001 Slice D (role templates / dashboard assignment)
```

If M0.5 **cannot** PASS without Slice D roles, then:

```
M0.5 PASS  ←requires←  AUTH-001 Slice D
AUTH-001 Slice D  ←requires←  M0 GO  ←requires←  M0.5 PASS
```

That is a **hard deadlock**. Option A (maintain the current gate with no exception) makes M0 permanently NO-GO under the approved serial order.

### Separable readiness items (still real M0 production work)

These are **not** resolved by Option B and remain production-readiness (or deploy-verify) work:

| Item | Why it stays on M0 |
|------|--------------------|
| PMX-004 real-device certification | Implemented PWA surface; device evidence still required |
| REG-ACL-001 Production re-verify | Fix exists in code; must be confirmed on the live deploy |
| Final M0 GO / NO-GO review | Still required after remaining M0 gates |

Option B only relocates **unimplemented-role** certification — not device certification, and not ACL production confirmation.

---

## 4. Governance Impact

| Option | Effect |
|--------|--------|
| **A — Maintain gate** | M0 remains blocked indefinitely; UX/OPS/AUTH cannot start under [05](./05-master-implementation-order.md); no path to implement the roles M0 is waiting for |
| **B — Exception (recommended)** | M0.5 certifies **implemented** roles only; three AUTH-001 roles become Slice D acceptance criteria; AUTH-001 architecture unchanged; no code authorized |
| **C — Alternative** | e.g. reorder CORE-003 to authorize AUTH-001 before M0 GO — larger program disruption; not required if B is adopted |

Option B does **not**:

- Amend AUTH-001 architecture (roles remain first-class when implemented)  
- Authorize UX-012, OPS-001, AUTH-001, COM-001, or FIN-003  
- Waive M0.1 device certification  
- Claim Authenticated Regression PASS without still requiring: implemented-role coverage + REG-ACL Production verify (and other open M0 items)

Option B **does**:

- Align M0.5 with “certify what ships,” same spirit as the Performance framework-limit amendment  
- Break the circular dependency so AUTH-001 can eventually implement Option A roles under the normal M1→M2 sequence  

---

## 5. Recommended Option

# **OPTION B**

Issue a CORE-003 governance exception:

| Certification item | New disposition |
|--------------------|-----------------|
| Organization Administrator (distinct membership + surfaces) | **Deferred Until AUTH-001 Slice D** |
| Leasing Agent | **Deferred Until AUTH-001 Slice D** |
| Facility Technician | **Deferred Until AUTH-001 Slice D** |

| M0.5 mandatory scope (after amendment) | |
|----------------------------------------|--|
| Master Administrator | Required |
| Property Manager (`property_manager`) | Required |
| Property Owner (`property_owner`) | Required |
| Vendor (`vendor`) | Required |
| Tenant (`tenant`) | Required |
| Org isolation / ACL / storage / no Ops-shell escalation for portal roles | Required (incl. REG-ACL-001 Production verify) |

Certification of the three deferred roles becomes **AUTH-001 Slice D validation**, not an M0 exit criterion.

---

## 6. Proposed CORE-003 Amendment (if Option B selected)

> **Status of this section:** ✅ **IN FORCE** — Product Owner approved `CORE-003-AMD-M0-AUTH-ROLE-CERT-DEFER` on 2026-07-24. Authoritative record: [33](./33-core-003-amd-m0-auth-role-cert-defer.md).

### Amendment header

| Field | Value |
|-------|--------|
| Amendment ID | `CORE-003-AMD-M0-AUTH-ROLE-CERT-DEFER` |
| Package | CORE-003 |
| Type | M0 certification scope exception |
| Implementation | ❌ Not authorized |

### Binding text (proposed)

#### Authenticated Regression Gate — Implemented Capabilities Only

M0.5 **Authenticated regression validation** SHALL certify **only roles and surfaces that exist in the production membership model** at the time of certification.

The following AUTH-001-approved roles are **Deferred Until AUTH-001 Slice D** and are **removed as M0.5 exit criteria**:

1. Organization Administrator (as a distinct first-class membership role / dashboard assignment)  
2. Leasing Agent  
3. Facility Technician  

Certification, fixtures, and acceptance evidence for those roles SHALL be completed as part of **AUTH-001 Slice D** validation (role templates · dashboard assignment · permission boundaries), not as a precondition of M0 = GO.

#### M0.5 mandatory role set (binding after approval)

| Role | Membership / mechanism |
|------|------------------------|
| Master Administrator | `app_metadata.dev_master_admin` (or equivalent Master Admin grant) |
| Property Manager | `property_manager` |
| Property Owner | `property_owner` |
| Vendor | `vendor` |
| Tenant | `tenant` |

#### What this amendment does not change

1. AUTH-001 remains the architectural source of truth; Option A role model is **not** redefined as Option B.  
2. AUTH-001 implementation remains 🔒 locked until explicit `AUTHORIZE AUTH-001 SLICE …` phrases.  
3. M0.1 PMX-004 Phase 1 real-device certification remains mandatory.  
4. REG-ACL-001 Production verification remains required for Authenticated Regression PASS under the implemented role set.  
5. Serial authorize discipline and `AUTHORIZE UX-012 SLICE A` after M0 = GO remain unchanged.  
6. No application code, schema, or AUTH-001 package text is authorized by this amendment alone.

#### Acceptance addition for AUTH-001 Slice D (proposed cross-reference)

When AUTH-001 Slice D is authorized, validation SHALL include affirmative authenticated evidence for:

- Organization Administrator  
- Leasing Agent  
- Facility Technician  

including expected dashboard, navigation, permissions, landing page, denied routes, and redirects (per AUTH-001 dashboard assignment rules).

### Sign-off table

| Role | Decision | Date |
|------|----------|------|
| Product Owner / Governance authority | ✅ **APPROVED** | 2026-07-24 |
| Authoritative amendment | [33](./33-core-003-amd-m0-auth-role-cert-defer.md) | 2026-07-24 |

---

## 7. Final Recommendation

| Field | Decision |
|-------|----------|
| **Recommended option** | **OPTION B** — ✅ **ADOPTED** |
| **Classification** | Expected **pre-implementation limitation** / **implementation-prerequisite deadlock** — not a production defect |
| **Amendment** | `CORE-003-AMD-M0-AUTH-ROLE-CERT-DEFER` ✅ **APPROVED** ([33](./33-core-003-amd-m0-auth-role-cert-defer.md)) |
| **Next M0 closeout** | Deploy + verify REG-ACL-001 → implemented-role regression → PMX-004 device cert → Final M0 review |
| **UX-012** | 🔒 Still forbidden until M0 = GO + explicit authorize |
| **AUTH-001 unlock** | 🔒 Not granted by this review or amendment |

**Outcome:** CORE-003 amended so M0 certifies implemented platform roles only; Organization Administrator, Leasing Agent, and Facility Technician certification deferred to AUTH-001 Slice D — deadlock broken without changing AUTH-001 architecture or authorizing implementation.
