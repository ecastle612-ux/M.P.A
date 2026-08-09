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
