# 03 — Property Timeline

**Package:** FAC-001  
**Status:** Design ✔ · Document ✔ · Approve Pending · Implement Blocked

---

## Intent

The Property Timeline is the **operational memory stream** for a property (and optionally a unit). Every important event contributes. It is append-only, permanent, and navigable without hunting across modules.

---

## Principles

1. **Append-only** — corrections add compensating events or link to corrected Facility Records; do not rewrite history silently.  
2. **Source-linked** — every event points at its originating entity when available.  
3. **Human-readable** — title + short summary suitable for a vertical timeline UI.  
4. **Cross-pillar** — facility, resident lifecycle, and selected financial/ops signals may appear; Facility Ops owns the stream store.  
5. **Unit filter** — property stream can filter to a unit.

---

## Event catalog (Phase 1 + extensible)

| Event type | Typical source | Pillar |
| --- | --- | --- |
| `resident.moved_in` | WF-003 | Resident |
| `resident.moved_out` | WF-003 | Resident |
| `lease.signed` | API-004 / leases | Resident |
| `lease.activated` | leases | Resident |
| `facility.repair_completed` | Facility Record from WO | Facility |
| `facility.service_visit` | Facility Record / WO | Facility |
| `facility.asset_installed` | Asset foundation | Facility |
| `facility.asset_replaced` | Asset foundation | Facility |
| `facility.warranty_created` | Warranty | Facility |
| `facility.inspection_completed` | Future inspection module | Facility |
| `facility.compliance_checked` | Placeholder | Facility |
| `facility.smoke_detector_tested` | Future PM / inspection | Facility |
| `provider.visit_logged` | WO / Facility Record | Facility |
| `financial.major_expense` | Optional FIN link (reference only) | Financial |
| `ops.note` | Manual (future) | Business |

Phase 1 Implement (post-Approve) must at minimum emit facility repair completion + adopt existing lifecycle events where cheap; full catalog may phase in.

---

## Payload shape (conceptual)

```
TimelineEvent {
  id, organizationId, propertyId, unitId?, buildingId?,
  eventType, occurredAt,
  title, summary,
  actorUserId?,
  sourceEntityType, sourceEntityId,
  facilityRecordId?, assetId?, serviceProviderId?,
  payload: { ...opaque but typed per eventType },
  createdAt
}
```

---

## UX (design)

Property → **Timeline** (and Property History hub):

- Reverse-chronological  
- Filters: All · Facility · Residents · Financial · Compliance  
- Click-through to Facility Record / WO / Lease / Asset / Vault doc  
- Empty state: “No timeline events yet — completed repairs and move-ins will appear here.”

[DX-004](../61-dx-004-five-minute-rule/README.md): Command Center entity result for a property should offer **Open Timeline**.

---

## Ingestion rules

| Source | When | Behavior |
| --- | --- | --- |
| Work Order completed | On complete/close | Create Facility Record + `facility.repair_completed` (or service) event |
| Resident move-in/out | Existing lifecycle success | Emit timeline event (no duplicate resident systems of record) |
| Warranty created | On warranty write | Emit `facility.warranty_created` |
| Asset install/replace | On asset mutation | Emit corresponding event |
| Manual ops note | Future | Explicit Add Event (not Phase 1 required) |

Idempotency: ingest keyed by `(sourceEntityType, sourceEntityId, eventType)` to avoid duplicates on retries.

---

## Non-goals

- Replacing lease or applicant timelines as systems of record  
- Real-time social feed / comments product  
- Editing past events without audit trail
