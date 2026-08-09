# Sprint 6 — PDF Generation Report

**Library:** `pdf-lib`  
**Entry:** `apps/web/src/lib/documents/pdf-export.ts`  
**API:** `GET /api/shared/documents/[documentId]/pdf?template=`

## Templates
Lease · Work Order · Inspection · Maintenance · Move-in · Move-out · Vendor Work Order · Purchase Order · Invoice · Property / Asset / Compliance / Resident Statement / Financial / Organization · Generic

## Behavior
- Professional cover meta (title, belongs-to, category, status, version, tags)
- Body from `contentText` with wrapping
- Suitable for print/share with customers, vendors, auditors, owners
- Binary-only docs still export a branded cover + honesty note when text is empty

## LIVE smoke (2026-08-09)

`buildProfessionalPdf` executed against Production code SHA `1bf28c697a99f901243793d7b4de07b555b43be6`:

| Required template | Result |
| --- | --- |
| Lease Agreement | **PASS** |
| Work Order | **PASS** |
| Inspection Report | **PASS** |
| Vendor Invoice | **PASS** |
| Property Report | **PASS** |
| Asset Report | **PASS** |

Artifacts: `/opt/cursor/artifacts/sprint6-pdf-smoke/`. Authenticated browser download remains Owner LIVE.
