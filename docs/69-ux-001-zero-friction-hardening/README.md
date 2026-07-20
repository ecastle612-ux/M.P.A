# UX-001 — Zero Friction Hardening + Master Admin Slice A

**Status:** Design ✔ · Document ✔ · **Approved (EP-004)** · Implement unlocked  
**Initiative ID:** UX-001  
**Authorization:** EP-004 — 2026-07-19  
**Parent:** Live production friction testing  
**Deferred:** Impersonation + Audit Center → [ADMIN-001 Slice B](../71-admin-001-master-admin-impersonation/README.md) (placeholder)

---

## Objective

Eliminate Property Manager friction discovered in production use. No new PM product modules. Preserve DX-003/004, WF-003, IA-001, FAC-001, FIN-001, OPS-001, DP-001, PR-001/002.

## Work items

| WI | Deliverable |
| --- | --- |
| 1 | Bulk Unit Generator (default); Advanced single create |
| 2 | Upload → Crop → Avatar (no Photo URL) |
| 3 | Single primary CTA on guided workflows |
| 4 | Push enrollment state machine (no infinite Enabling) |
| 5 | Enterprise form labels / controls |
| 6 | Mobile density tightening |
| 7 | AI Operations mobile conversational shell |
| 8 | Announcement upload + labels; architecture note only for dashboards |
| 9 | Master Admin Slice A (capability, sidebar, switchers, provider, health, flags, testing utils) |

## Master Admin Slice A (in scope)

- Permanent `master_admin` capability (not hardcoded email)
- Sidebar + Dashboard Switcher + Organization Switcher
- Provider Status, Testing Utilities, System Health, Feature Flags (read-only OK)

## Out of scope (ADMIN-001 Slice B)

- User impersonation
- Impersonation banner
- Audit Center / impersonation logging

## Documents

| Doc | Purpose |
| --- | --- |
| [01-implementation-notes.md](./01-implementation-notes.md) | File targets + acceptance |
| [02-announcement-architecture.md](./02-announcement-architecture.md) | Future dashboard flow (no tenant impl) |
| [03-delivery-summary.md](./03-delivery-summary.md) | Verification + scores |
