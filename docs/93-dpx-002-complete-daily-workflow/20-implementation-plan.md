# 20 — Prioritized Implementation Plan (Phase 6 gate)

**Package:** DPX-002  
**Rule:** Implement highest-friction first. No drive-by redesigns. Preserve APIs, permissions, architecture.

---

## Sequence

| Order | ID | Work | Why | Est. | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | DPX2-001 | Fix RSC import of `buildAiPageContext` + suggestion builders | Unblocks path | S | **Done** |
| 2 | DPX2-002 | Fix Resident detail load error | Unblocks path | S–M | **Done** |
| 3 | Re-run baseline S1→S10 live | Evidence for after metrics | S | **Done** — [05](./05-measurement.md) + [14](./14-certification-report.md) |
| 4 | DPX2-007 | Property Next Action: Residents | Continuity S3→S4 | S | **Done** |
| 5 | DPX2-003 | Contextual Message from resident/WO | Removes inbox hunt | M | **Done** (+ RLS fix) |
| 6 | DPX2-008 | Maintenance default filter alignment | Stops false empty | S | **Done** |
| 7 | DPX2-004 | Notify owner from property/WO context | Completes S10 | M | **Done** |
| 8 | P2 batch | Continuity chips, dashboard command glance, AI operational labels, sidebar hydration | Polish | M | **Done** (2026-07-21) |

## Out of scope until PASS

- New modules / nav items  
- DPX-003+ workflows  
- Visual redesign for aesthetics only  
- EP-019 performance deep dive  

## Definition of ready for next implement slice

After each slice: update [05-measurement.md](./05-measurement.md) deltas + close friction rows + re-check heat map.

## Live verification (2026-07-21)

Verified on Canopy Property Partners (`localhost:3000`):

- Property / Resident / WO detail pages load (no RSC client crash)
- Property **Residents** → `/tenants?propertyId=` scoped list
- Maintenance default **Open** shows 3 waiting-resident WOs (matches dashboard)
- Resident **Message** → thread `Message · Cert Resident`
- **Notify owner** → announcement prefilled (property scope + title)
- Lease / charge **Continue** chips (Return Resident/Property, Message, …)
- Operations Center command glance + disclosed portfolio
- AI operational labels on dashboard / property / resident / WO
- No hydration error text after server-seeded permissions
- Full S1→S10 continuous path re-run complete → [14](./14-certification-report.md)
