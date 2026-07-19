# 01 — Implementation Notes

**Package:** MIG-001 · EP-010 Approved

## Foundation reused (MX-001)

- `/api/migration/jobs*` upload / map / preview / import / review / rollback  
- `detectColumnMapping`, software templates, CSV/XLSX/ZIP parsers  
- Import writes into existing Properties / Units / Tenants / Leases / Vendors  

## Presentation additions

| Artifact | Role |
| --- | --- |
| `lib/migration/guide.ts` | Portfolio phase labels + entity checklist |
| `lib/migration/template-csv.ts` | Downloadable CSV templates |
| Enriched `templates/custom.json` aliases | Intelligent mapping |
| `migration-column-mapper.tsx` | Visual field mapping (replaces JSON textarea) |
| `migration-file-dropzone.tsx` | Drag-and-drop + examples |
| `migration-preview-summary.tsx` | Counts / warnings / errors |
| `migration-import-progress.tsx` | Live progress copy |
| `migration-results-panel.tsx` | Completion summary + log download |
| Rewritten `migration-wizard.tsx` | Guided experience |

## Explicit non-goals

- New import storage / secondary migration DB  
- Accounting balance importer (guidance only → existing Financials)  
- Asset import (future-ready placeholder copy only)  
