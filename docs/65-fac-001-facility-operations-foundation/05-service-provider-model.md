# 05 — Service Provider Model

**Package:** FAC-001  
**Status:** Design ✔ · Document ✔ · Approve Pending · Implement Blocked

---

## Intent

Unify “who did the work” under **Service Provider** without redesigning current vendor assignment workflows.

> Do **not** redesign current vendor workflows.  
> Design a **migration strategy** from Vendor → Service Provider.

---

## Provider types

| Type | Meaning |
| --- | --- |
| `internal_maintenance` | Staff / in-house techs |
| `vendor` | External vendor (maps from today’s Vendor) |
| `contractor` | Project / specialty contractor |
| `emergency_vendor` | After-hours / emergency roster |
| `owner` | Owner-performed work |
| `volunteer` | Non-paid helper (rare; auditable) |
| `other` | Escape hatch |

**Workflow law:** Assignment, acceptance, messaging, and completion UX remain identical regardless of provider type. Type is classification + reporting — not a fork of status machines.

---

## Conceptual model

```
ServiceProvider {
  id, organizationId,
  providerType,
  displayName,
  status: active | inactive | archived,
  legacyVendorId?,          // migration bridge
  contactEmail?, contactPhone?,
  specialties[],            // e.g. plumbing, HVAC
  metadata,
  createdAt, updatedAt
}
```

Facility Records and Timeline events store:

- `service_provider_id`  
- **Snapshot** of `displayName` + `providerType` at completion (so renames don’t rewrite history)

---

## Migration strategy (Vendor → Service Provider)

### Phase A — Dual-write / bridge (recommended)

1. Introduce `service_providers` (or equivalent).  
2. For each existing `vendors` row, create ServiceProvider with `provider_type=vendor` and `legacy_vendor_id`.  
3. WO assignment continues to use existing vendor foreign keys.  
4. Facility Record creation resolves Vendor → ServiceProvider via bridge.  
5. UI labels may say “Service Provider” while routes `/vendors` still work.

### Phase B — Read compatibility

1. Vendor list becomes a filtered view of Service Providers (`type=vendor` + legacy).  
2. Internal staff providers appear in the same picker with type badge.  
3. Command Center / search indexes providers under one entity type.

### Phase C — Write cutover (separate Approve if material)

1. New assignments write `service_provider_id`.  
2. Keep `vendor_id` mirrored until backfill complete.  
3. Deprecate vendor-only APIs only after DX-003 path audit.

**Non-goal of FAC-001 Phase 1 Implement:** Forced cutover that breaks vendor assign. Bridge is enough to ship Facility Records.

---

## Internal staff

Represent as ServiceProvider `internal_maintenance` linked to user/membership where appropriate. Do not invent a second “assignee” concept that bypasses WO assignment.

---

## Emergency vendors

Same assignment workflow; type + roster flags enable future after-hours routing (not implemented here).

---

## UX naming

| During migration | Guidance |
| --- | --- |
| Nav | “Service Providers” preferred; “Vendors” alias acceptable |
| WO assign panel | Keep control behavior; update copy to “Assign service provider” when safe |
| History | Always show provider snapshot + type badge |

---

## Open Approve questions

See [12](./12-approval-checklist.md) Q2 (bridge vs rename-in-place) and Q5 (nav label timing).
