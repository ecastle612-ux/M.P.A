# 07 — Property Health

**Package:** FAC-001  
**Status:** Design ✔ · Document ✔ · Approve Pending · Implement Blocked

**Architecture only. No scoring algorithm in this package or Phase 1 Implement.**

---

## Intent

Define **Property Health** as a concept: a property’s operational condition inferred from facility and adjacent signals. FAC-001 specifies **contributing factors** and extension points — not a numeric score, color grade, or ML model.

---

## Contributing factors (catalog)

| Factor | Signal source | Direction |
| --- | --- | --- |
| Open work orders | Maintenance WO statuses | More open → worse |
| Repeated repairs | Facility Records frequency by category/asset/unit | Recurrence → worse |
| Asset age | Asset install date vs expected life | Over-age → worse |
| Inspection failures | Future inspection module | Failures → worse |
| Warranty expirations | Warranty.end date approaching/past | Expiring → attention |
| Preventive maintenance completion | Future PM schedules | Missed → worse |
| Compliance issues | Future compliance placeholders | Open issues → worse |
| Resident maintenance complaints | WO volume / messaging themes (future NLP) | Surge → worse |

---

## Architecture shape

```
PropertyHealthSignalProvider[]  →  PropertyHealthSnapshot (factors only)
                                         │
                    ┌────────────────────┼────────────────────┐
                    ▼                    ▼                    ▼
             Property History     Future Ops widget     IA-001 insights
```

Phase 1 may expose **raw factor cards** (counts/lists) without aggregation.

Forbidden in FAC-001 Phase 1:

- Weighted scoring formula as product truth  
- Automated “unhealthy” labels that block leasing/payments  
- Silent AI grading

---

## Snapshot (conceptual)

```
PropertyHealthSnapshot {
  propertyId,
  asOf,
  factors: [
    { key: 'open_work_orders', value: number, detailRef? },
    { key: 'repeat_repairs_90d', value: number, detailRef? },
    ...
  ]
}
```

IA-001 may later turn factors into explainable recommendations ([09](./09-future-roadmap.md)).

---

## UX guidance (post-Approve)

Property History → **Statistics / Health** section:

- Show factor list with deep links (Open WOs, Repeat category, Expiring warranties)  
- Empty/healthy: “No outstanding facility risk signals right now.”  
- Never invent a fake 0–100 score without a separate Approve.
