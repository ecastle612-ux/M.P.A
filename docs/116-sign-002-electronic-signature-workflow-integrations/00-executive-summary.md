# 00 — Executive Summary

**Package:** SIGN-002  
**Status:** Draft — Ready for Approval

---

## Problem

M.P.A. has a production-capable signature platform (API-004 + SignWell) but **workflow coverage is uneven**. Lease packages exist on lease/applicant surfaces; renewals, owner agreements, move-in/out acknowledgements, vendor/contractor agreements, work authorizations, inspection sign-offs, and org HR/policy documents lack designed, approved integration contracts.

Without SIGN-002, implementers will either:

1. Hard-code ad-hoc SignWell/package calls into screens (lock-in + inconsistent UX), or  
2. Skip legally meaningful signatures and leave compliance gaps.

---

## Outcome

A single governance package that:

1. Lists every V1.0 workflow that **must** or **may** use electronic signatures.  
2. Defines trigger → parties → order → status → vault → notify → audit → report for each.  
3. Mandates reuse of `SignatureService` and existing platform rails.  
4. Standardizes user-facing lifecycle language across modules.  
5. Enables **phased Approve → Implement** (Slices A → D) without redesigning API-004.

---

## Non-goals

- Replacing API-004, SignWell, vault, notifications, audit, or reporting engines  
- Requiring signatures on routine operational clicks (status toggles, notes, photo uploads)  
- Building a standalone “Signatures” product that replaces lease/vendor/owner screens  
- Notary / wet-ink / multi-jurisdiction compliance packs  
- Dual live e-sign providers in V1.0  

---

## Success metrics (post-implement)

| Metric | Target |
|--------|--------|
| Lease packages creatable/sendable from lease record | ✔ |
| Executed artifacts in Document Vault with entity links | ✔ |
| Zero provider brand strings in PM/resident/owner UX | ✔ |
| All V1.0 workflows in [07](./07-workflow-integration-matrix.md) meet [13](./13-acceptance-checklist.md) | ✔ |
| No duplicate notification or audit subsystems | ✔ |

---

## Relationship summary

```
API-004  = platform (how signatures work)
SIGN-002 = workflows (when and where signatures are used)
ADR-030  = SignWell is the V1.0 provider behind SignatureProvider
```
