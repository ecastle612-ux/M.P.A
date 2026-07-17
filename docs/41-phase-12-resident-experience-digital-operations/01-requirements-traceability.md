# Phase 12 — Requirements Traceability

Maps the twelve user-requested capability areas to PRR IDs and existing foundations.

---

## Capability → Requirement mapping

| # | User capability | Primary PRR IDs | Existing foundation | Net-new work |
|---|-----------------|-------------------|---------------------|--------------|
| 1 | Digital Applicant & Resident File | MHF-012, MHF-013, FEH-502 | `tenants`, `user_profiles` | Applicant lifecycle, unified person record, extended profile domains |
| 2 | Universal Document Vault | MHF-005, MHF-013, MHF-015, FEH-503 | None (metadata only on leases) | Storage-backed vault, versioning, entity polymorphism |
| 3 | Electronic Signatures | INT-202, MHF-015, FEH-503 | None | Provider abstraction + signing workflows |
| 4 | Background Screening | INT-201, MHF-004, MHF-015 | None | Provider abstraction + applicant workflow |
| 5 | Resident Messaging | MHF-001, MHF-003 | Announcements (broadcast) | Bi-directional threaded messaging |
| 6 | Maintenance Messaging | MHF-003, FEH-601, FEH-605 | Work orders, activity events | WO-linked conversation threads |
| 7 | Community Hub | MHF-001, FEH-1005, CA-004 | Announcements, read receipts | Events, office hours, emergency layer, future marketplace hooks |
| 8 | Push Notification Foundation | INT-301, MOB-002, MHF-001 | Placeholder delivery, `resident_devices` | Web push + preference/quiet-hours enforcement |
| 9 | Offline Operations | MOB-003, FEH-603, CA-007 | PWA shell | IndexedDB queue, sync status, inspection offline forms |
| 10 | Universal Timeline | MHF-008, MHF-012 | Domain events partial, WO activity | Unified timeline projection per entity |
| 11 | Operations Center Integration | MHF-011, PMX-002 | Dashboard widgets | Resident ops queue widgets |
| 12 | Command Center Integration | PMX-003, AI-007 | Search providers | New resident-domain search providers |

---

## Must-have compliance

| ID | Requirement | Phase 12 obligation |
|----|-------------|---------------------|
| MHF-001 | Digital resident comms | Extend — messaging + community; do not replace announcements |
| MHF-002 | PM-first | PM queues for screening, signatures, messages |
| MHF-003 | Workflow-first | Applicant → resident is one lifecycle, not CRUD |
| MHF-004 | AI assists; humans decide | Screening summary only; approve/deny by PM |
| MHF-005 | Multi-tenant RLS | All new tables org-scoped |
| MHF-008 | Domain events | Timeline + integrations emit events |
| MHF-012 | Unified operating graph | Person file links all domains |
| MHF-013 | Auditability | Document + message + screening audit |
| MHF-015 | Build vs integrate | Providers at boundaries only |

---

## Integration requirements (deferred vendors — abstract first)

| ID | Integration | Phase 12 deliverable |
|----|-------------|---------------------|
| INT-201 | Tenant screening | `ScreeningProvider` interface + stub |
| INT-202 | E-sign | `SignatureProvider` interface + stub |
| INT-301 | Push delivery | `PushProvider` interface + web push stub |

---

## Requirements **not** satisfied until implementation

All twelve user capabilities are **design-only** until approved slices ship. Partial credit from Phase 9/11:

- ✅ Announcements, QR, read receipts (MHF-001 partial)
- ✅ AI insights shell (MHF-004 partial)
- ❌ Applicant file, document vault, e-sign, screening, bi-directional messaging, offline queue, universal timeline
