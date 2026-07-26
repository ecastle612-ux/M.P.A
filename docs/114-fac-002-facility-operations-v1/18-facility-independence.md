# 18 — Facility Independence (Property Ops off)

**Package:** FAC-002  
**Binding SoT:** [V1.0 Subscription Architecture](../00-governance/v1-0-subscription-architecture.md) §4  

---

## Law

Facility Operations **must work fully** when the organization has:

```
Core + Facility Operations
```

and does **not** have Property Operations.

No tenant, lease, rent, owner portal, or resident payment dependency may block Facility features.

---

## Customer examples (Facility-only)

Schools, hospitals, hotels, churches, manufacturing plants, municipal maintenance, facility management companies, commercial buildings run as ops (not landlord portals).

---

## Place model

| Concept | Facility-only meaning |
|---------|----------------------|
| Organization | Customer account |
| Property / site | Building or campus location where work happens |
| Unit / space (optional) | Room, wing, floor — **optional**; never required to create WO/PM/inventory/asset |
| Tenant / lease / rent / owner portal | **Hidden** — not in nav; APIs must not require them |

Implement note: reuse existing `properties` (and optional `units`) as place records. Do not invent a parallel “FacilitySite” DB unless Approve amends. UX copy may say “Building” / “Site” for Facility-only orgs.

---

## Must work with Property module off

| Feature | Independence requirement |
|---------|---------------------------|
| Technician dashboard | Yes |
| Work orders | Yes — assign to buildings/sites; unit optional |
| Preventive maintenance | Yes — property required; asset/unit optional |
| Assets | Yes — property required; unit optional |
| Inventory | Yes — property optional |
| Vendors + token workflow | Yes |
| Inspections | Yes — property required; unit optional |
| Calendar / scheduling | Yes |
| Facility reports | Yes — no rent/owner metrics |
| FAC-001 records / timeline | Yes — no resident events required |

---

## Must not appear (Property off)

- Tenants, leases, applicants, rent collection, owner portal, tenant portal  
- Owner payouts, resident statements  
- Property-only reports (rent roll, occupancy)  

---

## Shared when both modules on

Same WO/vendor/asset records; nav is the **union**. No duplicate WO system under Property.

---

## Acceptance (for FAC-002 Approve)

- [ ] Design states Facility-only SKU is first-class  
- [ ] No acceptance criterion requires tenants/leases/rent  
- [ ] Nav design assumes Property items omitted when unlicensed  
- [ ] Reports listed are Facility-tagged only  
