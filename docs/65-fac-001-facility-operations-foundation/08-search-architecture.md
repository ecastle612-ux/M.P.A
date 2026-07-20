# 08 — Search Architecture

**Package:** FAC-001  
**Status:** Design ✔ · Document ✔ · Approve Pending · Implement Blocked

---

## Intent

Facility Search makes building memory instantly retrievable. Queries like **Roof**, **HVAC**, **ABC Plumbing**, **Kitchen Sink**, **Unit 204**, **Water Heater** must return the right mix of entities — not only work orders.

---

## Result types

| Type | Examples |
| --- | --- |
| Facility Record (repair) | “Roof leak repaired — Unit 204” |
| FacilityAsset | “Water Heater — Unit 204” |
| ServiceProvider | “ABC Plumbing” |
| Property | Property name / address match |
| Unit | “Unit 204” at property |
| Photo / Document | Vault media titled or tagged HVAC |
| TimelineEvent | “Smoke detector tested” |
| Work Order | Open/closed coordination tickets (existing) |
| Future AI | Insight cards (IA-001 — not Phase 1) |

---

## Query → retrieval contract (conceptual)

```
FacilitySearchQuery {
  organizationId, q, limit?,
  filters?: { propertyId?, unitId?, providerId?, category?, dateFrom?, dateTo? }
}

FacilitySearchHit {
  entityType, entityId, title, subtitle, propertyId?, unitId?,
  occurredAt?, score, deepLink
}
```

---

## Indexing fields (guidance)

| Entity | Searchable |
| --- | --- |
| FacilityRecord | issue, root cause, resolution, provider snapshot, unit label, category tags |
| Asset | name, category, manufacturer, model, serial |
| Provider | displayName, specialties, type |
| Unit | unit_number, property name |
| Media | title, document_type, OCR/future |
| Timeline | title, summary, event_type |

Prefer extending [Command Center](../61-dx-004-five-minute-rule/README.md) / existing search providers over inventing a parallel search product ([DX-003](../60-dx-003-zero-friction-daily-operations/README.md)).

---

## Ranking (design principles)

1. Exact unit / provider name matches first  
2. Active/open WO next when query implies urgency  
3. Recent Facility Records before old  
4. Assets before generic property hits when category keywords match (hvac, roof, …)  
5. Media lower unless query is clearly document-oriented  

No ML ranking required in Phase 1.

---

## Example expectations

| Query | Must surface |
| --- | --- |
| Roof | Repairs + roof assets + related photos |
| HVAC | Assets + repairs + providers specializing in HVAC |
| ABC Plumbing | Provider + their Facility Records |
| Kitchen Sink | Repairs / WOs with that text |
| Unit 204 | Unit entity + unit-scoped repairs + timeline |
| Water Heater | Asset + warranty + repairs |

---

## Non-goals

- Replacing global Command Center with a facility-only silo  
- Semantic AI search in Phase 1  
- Searching across organizations
