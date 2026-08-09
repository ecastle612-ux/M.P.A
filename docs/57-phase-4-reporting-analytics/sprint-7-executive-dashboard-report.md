# Sprint 7 — Executive Dashboard Report

## Personas

| Persona | Default areas | Primary decisions |
| --- | --- | --- |
| Organization Owner | Financial · Property · Commercial · Resident · Documents · Platform Health | Cash, occupancy, plan activation |
| Property Manager | Property · Maintenance · Resident · Financial · Vendors · Documents | Leases, backlog, collections |
| Facility Manager | Facility · Maintenance · Assets · Compliance · Vendors · Documents | Emergencies, compliance docs, vendor payables |
| Platform Operator | Commercial · Platform Health · Documents · Financial · Property | Org subscription/setup; platform MRR via Admin link |

## Auto-resolution

`resolveExecutivePersona` maps membership roles + FO entitlement → persona. UI allows explicit override for exec review without changing auth.

## Honesty

- Assets: planned module — empty with explanation (no fake health scores)
- Resident satisfaction: not invented
- Document expirations: warranty docs counted; structured expiry dates not assumed
- Commercial MRR/ARR for the whole platform stays in Master Admin
