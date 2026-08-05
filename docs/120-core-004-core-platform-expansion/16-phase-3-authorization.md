# 16 — Phase 3 Authorization

**Package:** CORE-004  
**Phase:** 3 — Leasing Operations  
**Date:** 2026-08-05  
**Status:** ✅ **Authorized**

---

## Authorize phrase

```
AUTHORIZE CORE-004 PHASE 3 – Leasing Operations
```

---

## Prerequisites

| Prerequisite | Status |
|--------------|--------|
| CORE-004 Approved · ADR-035 | ✅ |
| Phase 1 Accepted | ✅ ([11](./11-phase-1-acceptance.md)) |
| Phase 2 Accepted | ✅ ([15](./15-phase-2-acceptance.md)) |
| STD-001 Certified | ✅ |
| MAC-002 Certified | ✅ |
| NAV-001 · ARCH-001 · UX-016 | ✅ |

---

## Mission

Build the **complete Leasing Operations System** — one canonical operational lifecycle from prospect through renewal or move-out / archive.

**Do not** build isolated leasing screens or isolated CRUD.  
**Do** build the authoritative leasing lifecycle that every entry path converges into.

---

## Permanent rule

There is exactly **ONE** canonical leasing lifecycle.

Whether a lease begins from website, phone, referral, manual entry, import, or an existing resident — **all paths converge into the same state machine.**

No parallel workflows. No duplicate state machines. No alternate signature workflows (SignWell only).

---

## Canonical workflow

```
Prospect → Inquiry → Lead Qualification → Tour Scheduling → Property Showing
  → Application → Screening → Approval → Lease Generation → SignWell Signature
  → Move-In Preparation → Move-In → Resident → Renewal → Move-Out → Archive
```

---

## Non-goals

- Parallel leasing / application systems  
- Custom dashboards outside STD-001  
- Alternate e-signature providers  
- Phase 4+ resident/vendor/finance expansion beyond leasing integration hooks  
- Changing MAC-002 / identity / auth planes  

---

## Gate

| Stage | Status |
|-------|--------|
| Design | ✅ [17](./17-phase-3-design.md) |
| Document | ✅ |
| Authorize | ✅ **Issued** |
| Implement | Unlocked by this phrase |
| Verify / Certify | [18](./18-phase-3-certification.md) |
