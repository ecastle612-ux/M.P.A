# 40 — AUTH-001 Slice A Authorization (Program Record)

**Package:** CORE-003 · M1.3  
**Status:** ✅ **AUTHORIZED** · ✅ **IMPLEMENTED** · ✅ **VALIDATED** ([AUTH-001 §35](../109-auth-001-organization-provisioning-authentication/35-slice-a-validation.md) · **PASS**)  
**Date:** 2026-07-24  
**Binding phrase (issued):**

```
AUTHORIZE AUTH-001 SLICE A
```

**Validation phrase (issued):**

```
VALIDATE AUTH-001 SLICE A
```

**Authoritative package document:** [AUTH-001 §33 — Slice A Authorization](../109-auth-001-organization-provisioning-authentication/33-slice-a-authorization.md)  
**Implementation summary:** [AUTH-001 §34](../109-auth-001-organization-provisioning-authentication/34-slice-a-implementation.md)  
**Validation report:** [AUTH-001 §35](../109-auth-001-organization-provisioning-authentication/35-slice-a-validation.md)  
**Prerequisites:** M0 ✅ **GO** ([36](./36-final-m0-governance-review.md)) · UX-012 Slice A ✅ **VALIDATED** ([UX-012 §32](../112-ux-012-platform-experience-design-system/32-slice-a-validation.md)) · OPS-001 Slice A ✅ **VALIDATED** ([OPS-001 §34](../111-ops-001-platform-operations-architecture/34-slice-a-validation-rerun.md))  
**Order authority:** [05 — Master Implementation Order](./05-master-implementation-order.md)

> Slice A is **Validated (PASS)**. Subsequent authorize: **`AUTHORIZE AUTH-001 SLICE B`** ([41](./41-auth-001-slice-b-authorization.md)).  
> AUTH-001 Slice D deferred-role certification · OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 · AUTH-001 C–E remain locked until their authorize phrases.

---

## Prerequisite roll-up

| Gate | Status |
|------|--------|
| M0.1–M0.6 → GO | ✅ |
| UX-012 Slice A Validated | ✅ |
| OPS-001 Slice A Validated | ✅ |
| AUTH-001 Approved with Amendments · ADR-026 | ✅ |
| OPS-001 Slice B authorized? | ❌ No (correct) |
| AUTH-001 Slice D roles in Slice A? | ❌ Excluded / deferred |
| Open blockers for AUTH-A | ❌ None |
| Scope / acceptance / exit | Recorded in [AUTH-001 §33](../109-auth-001-organization-provisioning-authentication/33-slice-a-authorization.md) |

---

## What this authorize unlocks

| Item | Status |
|------|--------|
| AUTH-001 Slice A (Identity Adapter · Username auth · First login · Password change · invitation-only hardening) | 🔓 **Authorized** |
| AUTH-001 Slices B–E | 🔒 Locked |
| AUTH-001 Slice D deferred roles (Org Admin / Leasing / Facility Tech) | 🔒 Deferred — **not** unlocked |
| OPS-001 Slice B | 🔒 Eligible separately · **not** issued |
| UX-012 Slice B | 🔒 Eligible separately · **not** issued |
| PMX-004 Phase 2 | 🔒 Locked |

---

## Recommendation

1. ✅ Authorize phrase **issued**.  
2. ✅ Slice A **IMPLEMENTED** ([AUTH-001 §34](../109-auth-001-organization-provisioning-authentication/34-slice-a-implementation.md)).  
3. ✅ Slice A **VALIDATED · PASS** ([AUTH-001 §35](../109-auth-001-organization-provisioning-authentication/35-slice-a-validation.md)).  
4. ✅ Subsequent authorize issued: **`AUTHORIZE AUTH-001 SLICE B`** ([41](./41-auth-001-slice-b-authorization.md)).  
5. ❌ Slice B implementation remains for a dedicated implementation session (not this A record).
