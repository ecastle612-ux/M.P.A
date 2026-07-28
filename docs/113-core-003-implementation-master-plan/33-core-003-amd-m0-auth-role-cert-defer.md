# 33 — CORE-003 Amendment: M0 Auth Role Certification Deferral

**Amendment ID:** `CORE-003-AMD-M0-AUTH-ROLE-CERT-DEFER`  
**Status:** ✅ **APPROVED**  
**Decision date:** 2026-07-24  
**Package:** CORE-003  
**Review:** [32](./32-m0-certification-deadlock-review.md)  
**Code / AUTH-001 / UX-012 / OPS / COM / FIN-003:** ❌ **Not authorized** by this amendment

---

## Official decision

| Field | Decision |
|-------|----------|
| Amendment | `CORE-003-AMD-M0-AUTH-ROLE-CERT-DEFER` |
| Status | ✅ **APPROVED** |
| Classification | Governance sequencing — not an engineering defect |
| Prior hard gate | M0.5 required distinct Org Admin / Leasing Agent / Facility Technician fixtures for suite PASS |
| Replacement policy | **M0 certifies only implemented production capabilities** |
| Deferred certifications | Organization Administrator · Leasing Agent · Facility Technician → **AUTH-001 Slice D** |
| M0 overall | ❌ **NO-GO** (remaining implemented-capability gates) |
| UX-012 Slice A | 🔒 Forbidden until M0 **GO** + explicit authorize phrase |
| AUTH-001 unlock | 🔒 Unchanged — still requires `AUTHORIZE AUTH-001 SLICE …` |

---

## Rationale (binding)

The purpose of M0 is to certify production readiness of **implemented** platform capabilities. It is **not** intended to certify functionality intentionally deferred by the approved implementation roadmap.

AUTH-001 defines three first-class roles scheduled for Slice D. CORE-003 correctly prevents Slice D until earlier AUTH slices complete. Requiring those roles for M0.5 created a circular gate (M0 waits on Slice D; Slice D waits on M0 GO). That is a governance sequencing issue, not a production defect.

---

## Binding policy text

### M0 certifies implemented capabilities only

M0 certifies **ONLY** implemented production capabilities.

Architecture that has been approved but intentionally deferred to a future implementation slice **SHALL NOT** block M0 certification.

Certification responsibility transfers to the implementation slice that introduces the capability.

### Roles removed from M0 / reassigned

| Role | Disposition |
|------|-------------|
| Organization Administrator | **Deferred Until AUTH-001 Slice D** — mandatory before Slice D = COMPLETE |
| Leasing Agent | **Deferred Until AUTH-001 Slice D** — mandatory before Slice D = COMPLETE |
| Facility Technician | **Deferred Until AUTH-001 Slice D** — mandatory before Slice D = COMPLETE |

### M0.5 mandatory role set (implemented)

| Role | Membership / mechanism |
|------|------------------------|
| Master Administrator | `app_metadata.dev_master_admin` (or equivalent) |
| Property Manager | `property_manager` |
| Property Owner | `property_owner` |
| Vendor | `vendor` |
| Tenant | `tenant` |

### M0 remains responsible for

1. PMX-004 Phase 1 real-device certification  
2. REG-ACL-001 production verification  
3. Authenticated regression for the **implemented** role set above  
4. Infrastructure PASS  
5. PAY-001 VERIFIED  
6. Performance gate as amended ([24](./24-core-003-amd-m0-perf-framework-limit.md))  
7. Existing production functionality regression  
8. Final M0 Production Readiness review  

No implemented capability is exempted. This amendment does **not** make M0 = GO.

### AUTH-001 Slice D shall not be COMPLETE until

1. Organization Administrator implemented  
2. Leasing Agent implemented  
3. Facility Technician implemented  
4. Dashboard routing verified  
5. Permission boundaries verified  
6. Organization isolation verified  
7. Regression certification PASS  
8. Role-specific acceptance criteria PASS  

---

## What this amendment does not change

1. AUTH-001 remains architectural SoT; Option A role model is **not** redefined as Option B.  
2. CORE-003 implementation order ([05](./05-master-implementation-order.md)) remains unchanged.  
3. Serial slice authorization remains unchanged.  
4. AUTH-001 remains the sole owner of role implementation.  
5. M0 remains the owner of production readiness for **implemented** capabilities.  
6. No application code, schema, or AUTH-001 implementation is authorized.

---

## Next authorized action (binding)

Complete remaining **implemented-capability** M0 closeout tasks in order:

1. Deploy REG-ACL-001 remediation  
2. Verify REG-ACL-001 in Production  
3. Re-run authenticated regression for all currently implemented roles  
4. Execute PMX-004 real-device certification  
5. Perform Final M0 Readiness Review  

If all remaining implemented-capability gates PASS → M0 = **GO**.  
Only then may the first implementation authorization be issued: **`AUTHORIZE UX-012 SLICE A`**.

No other implementation slices are authorized by this amendment.

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Product Owner / Governance authority | ✅ **APPROVED** | 2026-07-24 |
| Deadlock review | [32](./32-m0-certification-deadlock-review.md) OPTION B | 2026-07-24 |

---

## Document map

| Doc | Role after amendment |
|-----|----------------------|
| This file | Authoritative amendment record |
| [32](./32-m0-certification-deadlock-review.md) | Review → APPROVED |
| [05](./05-master-implementation-order.md) | M0.5 scope |
| [09](./09-authorization-protocol.md) | Execution status |
| [12](./12-approval-record.md) | Amendment register |
| [28](./28-m0-authenticated-regression-certification.md) | M0.5 mandatory roles |
| [30](./30-reg-cov-001-qa-fixture-certification.md) · [31](./31-role-model-reconciliation.md) | Deferred disposition |
| AUTH-001 [31 — Implementation slices](../109-auth-001-organization-provisioning-authentication/31-implementation-slices.md) | Slice D COMPLETE criteria |
| AUTH-001 [23 — Acceptance](../109-auth-001-organization-provisioning-authentication/23-acceptance-criteria.md) | Slice D product criteria pointer |
