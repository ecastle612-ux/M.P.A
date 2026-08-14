# ADR-030: Operational Workspace — Documents and Tables (OPS-001)

## Status
Accepted

## Date
2026-08-14

## Accepted
2026-08-14 — Product Owner authorization for OPS-001 Phase 1 with amendment: XLSX export is in Phase 1. DOCX, formulas, FAC-002 report connections, and source-system writeback remain not approved.

## Context

M.P.A. already has a Shared Platform Document Intelligence library (`platform.documents`, `/shared/documents`) for uploaded files, versions, relationships, and professional PDF export. MEDIA-001 holds operational photos/video. FAC-002 is the report/export spine. FAC-003 is the asset and stock system of record. FAC-003 explicitly reserved **DOC-001** (operational documents / manuals) and **SHEET-001** (operational tables) as later designs.

Customers still cannot create rich-text operational documents from templates or keep spreadsheet-style grids that connect to M.P.A. data. Inventing a fourth product, a second document vault, or a second inventory ledger would violate ADR-019, ADR-023, and ADR-028. Implementing before Approve would violate ADR-012.

Related:

- Design: `docs/112-ops-001-operational-workspace-documents-tables/index.md`
- Document Intelligence: `docs/56-phase-4-document-intelligence/`
- ADR-012 Implementation Gate
- ADR-019 Product Constitution
- ADR-023 MEDIA-001
- ADR-025 FAC-002
- ADR-026 authorization pipeline
- ADR-028 FAC-003 (DOC-001 / SHEET-001 reserved)

ADR-027 remains reserved on the unmerged PLAT-002 production-compatibility branch. This record is **030**.

## Decision

1. Introduce **OPS-001 Operational Workspace** as a **Shared Platform capability** (Documents + Tables). It is not a fourth product, SaaS tier, or Enterprise SKU. It is the approved home for DOC-001 and SHEET-001.

2. **Documents:** Evolve the existing library. Add **authored** documents (create, templates, rich-text, PDF export; Word/DOCX per approved phase). Do not replace uploads. Do not store job evidence photos here (MEDIA-001).

3. **Tables:** Add operational grids (sort/filter, CSV, and **XLSX export** in Phase 1) with **read-only** M.P.A. data connections. Formulas remain Phase 1b. FAC-003, work orders, and FAC-002 remain systems of record. Tables must not write stock quantity or asset lifecycle. Bidirectional sync is **not approved**.

4. **Authorization:** Reuse `platform.documents` and the ADR-026 pipeline. No new roles. No new entitlement keys in Phase 1. A `platform.tables` key requires a later Approve.

5. **Navigation:** One module. Documents and Tables are sibling surfaces (`/shared/documents`, `/shared/tables` or tabs). Complete does not get two copies.

6. **Implementation is authorized** for Phase 1 while this ADR is **Accepted** and docs/112 is **Approved**. Material scope changes restart Design → Document → Approve. No Production apply, billing, or Stripe changes without Owner authorization. Stop after implementation certification.

## Consequences

**Easier:** Staff get operational writing and grids without a second CMMS, a second vault, or a new SKU; FAC-003/FAC-002/MEDIA-001 stay authoritative; all three products share one workspace.

**More difficult:** Authored vs uploaded kinds must stay in one library; connection queries must stay fail-closed and read-only; formula/XLSX compatibility must be phased.

## Alternatives Considered

- **Fourth product / paid Workspace add-on:** Rejected — ADR-019.  
- **New entitlement keys in Phase 1:** Rejected — `platform.documents` already granted on all SKUs.  
- **Replace Document Intelligence or FAC-002:** Rejected — different jobs.  
- **Tables as FAC-003 editor:** Rejected — would bypass ledger RLS and negative-stock.  
- **Full Excel / Google Docs compatibility in Phase 1:** Rejected — out of product goal.  
- **Implement before Approve:** Rejected — ADR-012.
