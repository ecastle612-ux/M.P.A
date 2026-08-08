# Dataset Verification

**Slice:** COM-002 B  
**Date:** 2026-08-07  

---

## Property Manager Demo

| Domain | Present |
|--------|---------|
| Properties | Oak Street, Riverfront, Cedar Court |
| Residents / Leases | Yes |
| Maintenance | Work orders |
| Financial Operations | Vendor invoices (simulated) |
| Documents / Communications | Yes |
| Mission Control / Assistant / Timeline | Yes |
| Owner / Vendor / Resident portals | Persona surfaces |

Integrity: `assertSnapshotIntegrity(PM)` → `[]`

---

## Facility Operations Demo

| Domain | Present |
|--------|---------|
| Sites / Locations | HQ + East Plant |
| Assets / Building Systems | Chiller, generator, fire pump |
| Corrective / Preventive | Yes |
| Inventory / Parts | Yes |
| Inspections / Safety / Compliance | Yes |
| Mission Control / Assistant | Yes |

Honesty banner required. Integrity pass.

---

## Complete Platform Demo

PM + FO bundles under one synthetic org name with cross-product persona nav for Executive.

Integrity pass.

---

## Watermark

All bundles include `SYNTHETIC DEMO DATA` watermark — never presented as production customers.
