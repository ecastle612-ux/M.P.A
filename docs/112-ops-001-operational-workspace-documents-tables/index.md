# M.P.A. OPERATIONAL WORKSPACE — DOCUMENTS AND TABLES DESIGN

**Title:** M.P.A. OPERATIONAL WORKSPACE — DOCUMENTS AND TABLES DESIGN  
**Status:** Approved  
**Date:** 2026-08-14  
**Approved:** 2026-08-14 — Product Owner authorization to implement Phase 1 **with amendment** (XLSX export in Phase 1)  
**Program:** OPS-001 (covers previously reserved **DOC-001** + **SHEET-001**)  
**Related ADR:** [ADR-030](../18-decision-log/adr-030-operational-workspace-documents-tables.md) (Accepted)  
**Gate:** Design → Document → Approve → **Implement** (ADR-012)  
**Production:** No Production migration apply or deploy from this design record  
**Billing / Stripe / roles / SKUs:** No changes  
**New entitlement keys:** None in Phase 1 (reuse `platform.documents`)  
**New roles:** None  

---

## Constraints honored

Phase 1 implementation is authorized for the approved scope only. It does **not**:

- Add a fourth product, SKU, role, or entitlement key
- Change billing, Stripe, or commercial flow
- Replace FAC-003, FAC-002, MEDIA-001, or Document Intelligence with a second system of record
- Implement source-system writeback
- Implement DOCX export, formulas, or FAC-002 report connections (Phase 1b)
- Apply Production migrations or deploy Production from this design record

---

## 1. Product goal

Give every M.P.A. organization one **Operational Workspace** where staff can:

```
M.P.A. Operational Workspace
│
├── Documents
│   ├── Create document
│   ├── Templates
│   ├── Rich-text editing
│   ├── PDF export
│   └── Word/DOCX export
│
└── Tables
    ├── Spreadsheet-style grids
    ├── Formulas
    ├── Sort/filter
    ├── CSV/XLSX export
    └── M.P.A. data connections
```

This is a **Shared Platform capability**, not a commercial product. It appears once in navigation for Property Manager, Facility Operations, and Complete.

It is **not** Google Workspace, Notion, or Excel Online as a general office suite. The job is operational writing and operational grids that stay tied to M.P.A. records.

---

## 2. Constitution and product fit

| Rule | Application |
|------|-------------|
| Three products only | Operational Workspace is Shared Platform. Not a fourth product. |
| Property Manager | Documents + Tables under existing `platform.documents` |
| Facility Operations | Same workspace (FO module map already lists Documents) |
| Complete Platform | One workspace — no PM copy and FO copy |
| Enterprise | Sales motion only — must not appear as a product or tier |
| Commercial flow | Unchanged |
| ADR-023 MEDIA-001 | Photos/video evidence stay on `media_attachments`. Do not store job photos as Documents. |
| ADR-025 FAC-002 | Reports remain the operational report/export spine. Tables do not replace report types. |
| ADR-028 FAC-003 | Assets and stock remain the system of record. Tables may **read** them; they must not become a second ledger. |
| ADR-026 PLAT-002 | Same authorization pipeline. No new roles. |

---

## 3. What already exists (do not invent a second vault)

| Today | Job | Keep |
|-------|-----|------|
| Document Intelligence Center (`/shared/documents`) | Upload / search / preview / versions / relationships / professional PDF of **files** | Yes — library spine |
| `document_documents` + links + versions | File metadata and relationships | Yes — evolve additively |
| `platform.documents` | Entitlement for all three SKUs | Yes — reuse |
| MEDIA-001 | Operational photo/video | Separate |
| FAC-002 reports + CSV | Decision reports | Separate |
| FAC-003 assets / stock ledger | Equipment and quantity system of record | Separate |

Sprint 6 Document Intelligence is a **library of files**. This program adds **authored documents** and **operational tables** beside that library. One vault. One entitlement. Two new object kinds.

---

## 4. Target architecture

### 4.1 Documents

An **authored document** is a first-class org object the user creates in M.P.A., not only an uploaded PDF.

| Capability | Meaning |
|------------|---------|
| Create document | New blank or from template; title; org + optional property/site/asset/work-order link |
| Templates | Org-visible starter set (SOP, incident narrative, vendor scope, meeting notes). Phase 1 ships a small approved catalog — not a template marketplace |
| Rich-text editing | Canopy-styled editor (headings, lists, tables-in-doc, links). Not a full desktop word processor |
| PDF export | Reuse / extend the existing professional PDF path |
| Word/DOCX export | Download a `.docx` of the authored body |

Uploaded files remain in the same library. An authored document may have exported PDF/DOCX versions without becoming MEDIA-001.

**Do not** use Documents for:

- Work-order photo evidence (MEDIA-001)
- Lease PDF as the leasing system of record (leasing workflows stay)
- A second asset manual store that bypasses FAC-003 identity

### 4.2 Tables

An **operational table** is a spreadsheet-style grid owned by the organization.

| Capability | Meaning |
|------------|---------|
| Spreadsheet-style grids | Rows/columns, typed cells (text, number, date, select), pinned header |
| Formulas | Cell formulas over the grid (Phase 1b — see §6). No VBA / macros |
| Sort/filter | Column sort and simple filters |
| CSV/XLSX export | CSV and XLSX in Phase 1 (XLSX moved into Phase 1 by Owner amendment) |
| M.P.A. data connections | **Read-only** live or snapshot queries into approved M.P.A. objects |

Approved connection sources (Phase 1):

- Facility assets (FAC-003)
- Stock on-hand (FAC-003)
- Facility / residential work orders (existing WO spine)

FAC-002 report row sets remain **Phase 1b**.

**System of record rule:** connected rows are projections. Edits in a Table never write quantity, asset status, or work-order status unless a later Approve defines a bidirectional contract. FAC-003 negative-stock and append-only ledger stay authoritative.

**Do not** use Tables for:

- Warehouse / ERP
- Accounting (ADR-010)
- A shadow inventory
- Replacing FAC-002 report registry

### 4.3 Navigation

One Shared Platform home, two tabs (or sibling routes under one module):

```
/shared/documents          Library + authored documents
/shared/tables             Operational tables
```

Both gated by existing `platform.documents` in Phase 1. A distinct `platform.tables` key is **out of Phase 1** unless Approve adds it.

FO and PM sidebars already (or will) point at Documents. Tables appear in the same module — not a new commercial module, not Capital Projects, not Enterprise.

---

## 5. Authorization

Reuse ADR-026:

Authentication → Organization → Role / plane → SKU entitlement (`platform.documents`) → Module permission → Action.

| Actor | Documents | Tables |
|-------|-----------|--------|
| PM / FO / Complete manager | Create, edit, export, connect | Create, edit, export, connect (read-only connections) |
| Technician | Read linked docs/tables on assigned work; no workspace administer | Same |
| Tenant / owner / vendor | Denied unless a later Approve adds a portal surface | Denied |
| Property Manager SKU | Allowed (shared platform) | Allowed |
| Facility Operations SKU | Allowed | Allowed |

No new roles. No new entitlement keys in Phase 1.

RLS: org isolation, fail closed, current-row predicates (do not repeat the FAC-003 RETURNING self-select mistake). Soft-deleted rows hidden.

---

## 6. Recommended Phase 1 (Approve to implement)

Ship the outline without boiling the ocean.

**Documents Phase 1**

1. Create authored document  
2. Small template catalog  
3. Rich-text editor  
4. PDF export  
5. Library remains for uploads  

**Tables Phase 1**

1. Create grid  
2. Sort / filter  
3. CSV export  
4. XLSX export (Owner amendment — moved from 1b)  
5. Read-only connections to FAC-003 assets, FAC-003 stock, and work orders  

**Phase 1b (separate Approve)**

- Word/DOCX export  
- Formulas  
- FAC-002 report connection  
- Bidirectional writes (default **no** — **not approved**)

**Out of this program**

- Real-time multiplayer cursors  
- Template marketplace  
- Google/Microsoft sync  
- Macro language  
- New SKU or paid add-on  
- Tenant-authored documents  

---

## 7. Data sketch (after Approve only)

Additive. No Production apply from this record.

- Extend `document_documents` with `kind` (`file` \| `authored`) and rich-text body / template id — **or** add `document_authored_documents` linked to the library row. Prefer one library row per authored doc so search/relationships stay singular.
- New `workspace_tables`, `workspace_table_columns`, `workspace_table_rows` (names illustrative) with `organization_id`, optional connection descriptor, `deleted_at`.
- Connections store source type + filter, not a copied ledger.
- MEDIA-001 parent allowlist may later add `authored_document` / `workspace_table` — not required for Phase 1.

Do not replay unrelated lineage. Do not store table cell blobs in `media_attachments`.

---

## 8. Options considered

| Option | Verdict |
|--------|---------|
| Fourth product “Workspace” | **Rejected** — violates ADR-019 |
| New entitlement keys now | **Rejected** for Phase 1 — `platform.documents` already ships on all SKUs |
| Put authored docs only in FO | **Rejected** — Shared Platform; PM needs SOPs too |
| Use Tables as FAC-003 UI | **Rejected** — ledger and RLS stay on FAC-003 |
| Replace Document Intelligence | **Rejected** — evolve the library |
| Store manuals only as MEDIA-001 | **Rejected** — ADR-023 / ADR-028 already send PDFs to DOC-001 |
| Full Excel compatibility in Phase 1 | **Rejected** — formulas, charts, macros, and round-trip editing wait for 1b. XLSX **export** is Phase 1 by amendment. |

---

## 9. Security implications

- Org RLS on every new object  
- Exports inherit the same entitlement as the workspace  
- Connected queries run as the authenticated user (no service-role read of other orgs)  
- DOCX/PDF generation must not embed other tenants’ data  
- No public document URLs  

---

## 10. Production compatibility

No schema or app change from this record. Existing Document Intelligence, MEDIA-001, FAC-002, and FAC-003 Production data stay as they are.

---

## 11. Rollback (after a later implement)

- App: revert the workspace routes; library remains  
- Schema: drop additive table objects only after a new Approve; do not delete `document_documents` files  
- Entitlements: unchanged if Phase 1 reused `platform.documents`  

---

## 12. Approval

**Approved 2026-08-14** for Phase 1 only (§6), with amendment: **XLSX export is Phase 1**. DOCX, formulas, FAC-002 report connections, and source-system writeback remain **not approved**.

Implementation must stop after implementation certification. Do not apply Production migration or deploy Production from the implement PR.
