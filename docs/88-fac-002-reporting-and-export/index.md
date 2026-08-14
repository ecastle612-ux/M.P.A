# FAC-002 REPORTING AND EXPORT DESIGN

**Status:** Draft — awaiting Product Owner / Architect approval (ADR-012)  
**Date:** 2026-08-14  
**Program:** FAC-002 Reporting & Export  
**Related ADR:** [ADR-025](../18-decision-log/adr-025-fac-002-reporting-and-export.md) (Proposed)  
**Gate:** Design → Document → **Approve** → Implement  
**Production:** No production changes from this package  
**Billing / Stripe:** No changes  
**Implementation:** Forbidden until Approved

---

## 1. Problem statement

Facility Operations has passed production UAT (work orders, vendors, media, lifecycle, UX remediation). Facility managers still cannot answer a basic operational question with a downloadable artifact:

> **What happened in my operations?**

They need reports to:

- Review completed work
- Report to leadership
- Track maintenance activity
- Analyze operational performance

Today:

| Surface | What it does | Gap |
|---------|--------------|-----|
| FO / PM work queues | Live operational triage | Not a period report; no CSV/PDF management pack |
| `/shared/reports` (RAC, docs/57) | Executive insights briefing | Metric/insight export — not row-level work-order operational reports |
| FIN-OPS owner reports | Property money / owner summaries | Not work-order operations |

**FAC-002** designs the missing **operational Work Order Reporting & Export** capability.

---

## 2. Product goal

Enable property and facility teams to produce **organization-scoped, permission-filtered operational reports** for a chosen period — dashboard metrics, CSV extracts, and professional PDF management packs — answering “what happened” without inventing a fourth commercial product or a second work-order system.

### Goals (Phase 1)

1. Work order report dashboard with manager-useful summary metrics  
2. Filters that match how managers review operations  
3. CSV export of the filtered work-order set  
4. Professional PDF management report  
5. Product-correct permissions (FO / PM / Complete / Tenant)  
6. Strict data security (org + surface + RBAC; no cross-module leakage)  
7. Extensible report types for later phases without redesigning the spine  

### Non-goals (this package)

- Application code, UI components, Edge Functions, or scaffolding  
- Database migrations or RLS SQL  
- Production deploy or Preview behavior changes  
- Billing, Stripe, SKUs, SaaS tiers, Enterprise productization  
- Reporting warehouse / OLAP / BI tool  
- Vendor performance, cost, inventory, asset history reports (documented as future only)  
- Replacing Mission Control or the RAC executive briefing  
- Tenant / resident / vendor portal reporting access  

---

## 3. Constitution and product fit

| Rule | Application |
|------|-------------|
| Three products only | FAC-002 is a **capability**, not a fourth product or pricing tier |
| Facility Operations | Facility work-order reports (`work_surface = facility`) |
| Property Manager | Property / residential work-order reports (`work_surface = residential`) |
| Complete Platform | Combined access by **permission + surface** — one reporting spine, two scopes |
| Enterprise | Sales motion only — must not appear as a product or Confirm Plan option |
| Commercial flow | Unchanged |
| Capital Projects | Not a commercial product; out of Phase 1 reports |

Canopy and Experience Architecture remain visual/interaction authority when implementation is later approved.

---

## 4. Relationship to existing reporting

```
┌─────────────────────────────────────────────────────────────┐
│ Mission Control          Live attention (not a report pack) │
├─────────────────────────────────────────────────────────────┤
│ RAC /shared/reports      Executive insights (docs/57)       │
│                          “What should I pay attention to?”   │
├─────────────────────────────────────────────────────────────┤
│ FAC-002 (this design)    Operational WO reporting & export  │
│                          “What happened in my operations?”   │
├─────────────────────────────────────────────────────────────┤
│ FIN-OPS reports          Money / owner operational finance  │
└─────────────────────────────────────────────────────────────┘
```

**Decision (ADR-025):** FAC-002 does **not** replace RAC or FIN-OPS. It is a dedicated **work-order operational reporting** capability that reuses `maintenance_work_orders` and existing export patterns (CSV / PDF), with product-scoped homes under FO and PM **Reports** navigation (already present on module maps).

---

## 5. Phase 1 scope — Work Order Reporting

### 5.1 Report dashboard

**Primary question:** For the selected filters, what is the shape of work?

| Metric | Definition (Phase 1) |
|--------|----------------------|
| Total work orders | Count of WOs matching filters (all statuses in scope) |
| Open work orders | Status ∈ {`open`, `assigned`} (or product-equivalent open set) — exclude cancelled |
| In progress | Status = `in_progress` (and any explicit progress equivalent) |
| Completed | Status ∈ {`completed`, `closed`} completed in period if date filter applies to completion |
| Average completion time | Mean(`completed_at − created_at`) for completed/closed rows with both timestamps; honest-empty if none |
| Work orders by category | Group count by `category` |
| Work orders by priority | Group count by `priority` |
| Work orders by vendor | Group count by assigned vendor (display name); bucket `Unassigned` / technician-only as needed |

**Display rules**

- One composition: summary metrics first, then breakdown charts/tables — not a second Mission Control  
- Honest-empty: show zero / “No data for this period” — never fabricate  
- Default period: last 30 days (created date), overridable  
- Metrics respect the same filter set as the export table  

**Date semantics (binding for Phase 1)**

| Filter mode | Applies to |
|-------------|------------|
| Default | `created_at` within range |
| Optional toggle (design) | “Completed in period” uses `completed_at` for completed metrics and completed-row listing |

Document the active mode on PDF cover and CSV metadata row / filename.

### 5.2 Filters

| Filter | Type | Notes |
|--------|------|-------|
| Date range | Inclusive start/end (org timezone display; store UTC) | Required for exports |
| Property / facility | Multi-select | FO: facility sites / buildings; PM: properties; Complete: union of permitted sites |
| Location | Free-text or location entity if present | Maps to WO location / unit / building fields available on `maintenance_work_orders` |
| Status | Multi-select | Align to lifecycle enums already used in FO/PM |
| Priority | Multi-select | `emergency` / `high` / `normal` / `low` (product enums) |
| Category | Multi-select | Existing category values |
| Assigned vendor | Multi-select | From org vendors; includes “Any vendor” / “Unassigned vendor” |
| Assigned user | Multi-select | Technicians / staff assignees (`technician_user_id` / assignee user) |

**Filter enforcement:** Every dashboard query and every export uses the **same** server-side filter object. UI filters never widen beyond the caller’s ACL.

### 5.3 CSV export

**Purpose:** Spreadsheet-ready operational extract for managers and leadership packs.

**Required columns (Phase 1)**

| Column | Source / rule |
|--------|----------------|
| Work order ID | `maintenance_work_orders.id` (stable public display id if one exists; else UUID) |
| Created date | `created_at` (ISO-8601 or org-local formatted consistently) |
| Requested by | Display name from `requested_by_user_id` (or honest “Unknown”) |
| Location | Best available location string (building / unit / site fields) |
| Category | `category` |
| Priority | `priority` |
| Description | `description` (CSV-escaped; truncate only if documented max length) |
| Assigned vendor | Vendor display name when `assignee_type = vendor`; else empty |
| Assigned user | Technician/staff display name when assigned; else empty |
| Status | Current status |
| Completed date | `completed_at` or empty |
| Completion notes | Completion / close notes field if present; else empty |
| Media attached indicator | `Yes` / `No` from MEDIA-001 attachment existence for parent work order |

**CSV rules**

- UTF-8 with header row  
- Filename pattern: `{org-slug}_work-orders_{surface}_{yyyy-mm-dd}_{yyyy-mm-dd}.csv`  
- Row set = filtered result capped by a documented Phase 1 max (propose **10,000** rows); if truncated, include a trailing note row and UI warning  
- No media binaries in CSV — indicator only  
- No cross-surface rows (FO export never includes residential WOs and vice versa)  

### 5.4 PDF reports

**Purpose:** Professional management report for leadership review / board packs.

**Required sections**

1. **Cover / header** — Organization name, product surface label (Facility Operations | Property Operations | Complete — scoped), report title “Work Order Operations Report”, reporting period, generated-at timestamp, generated-by user  
2. **Summary metrics** — Same Phase 1 dashboard metrics for the filter set  
3. **Completion statistics** — Completed count, average completion time, optional completion rate = completed / (completed + still-open in set) with honest definition footnote  
4. **Work order table** — Compact tabular subset of CSV fields (ID, created, location, category, priority, assignee, status, completed). Paginate; if over Phase 1 PDF row cap (propose **500**), summarize remainder (“N additional rows — see CSV export”)  
5. **Footer** — Confidential / organization-only; page numbers  

**Visual:** Canopy-aligned when implemented; no new design language. Prefer existing `pdf-lib` / document export patterns already used by RAC and Document Intelligence — reuse libraries, not copy FIN-OPS money semantics.

### 5.5 Out of Phase 1 content

- Charts as images beyond simple breakdown tables (nice-to-have later)  
- Scheduled email delivery / subscriptions  
- Saved report templates  
- Cost / invoice / inventory / asset columns  
- Embedded media thumbnails in PDF  

---

## 6. Information architecture & surfaces

### 6.1 Navigation homes

| Product SKU | Report home | Work-order surface filter |
|-------------|-------------|---------------------------|
| Facility Operations | FO **Reports** (module map already lists Reports) | `work_surface = facility` only |
| Property Manager | PM **Reports** | `work_surface = residential` only |
| Complete Platform | Same FO and PM Reports entries (union of nav); optional Shared entry that **routes by permission** | Caller may access both surfaces **only** if entitled to both; never merge rows across surfaces in one export without explicit Complete “combined” mode (Phase 1 default: **surface-scoped** tabs/sections) |

**Phase 1 recommendation:** Complete uses **two scoped report views** (Facility | Property), not a blended anonymous mix. A future “Combined Complete pack” is a separate Approve.

RAC `/shared/reports` remains the executive briefing. FAC-002 links from Reports workspaces; it does not subsume RAC.

### 6.2 Suggested routes (design only — not implemented)

| Route | Role |
|-------|------|
| `/facility/reports` | FO work-order reporting dashboard + export |
| `/pm/reports/work-orders` (or under existing PM Reports) | PM residential work-order reporting |
| `/api/.../reports/work-orders` + `/export` | Authenticated read + export endpoints |

Exact path names are implementation choices; ownership and surface filters are binding.

---

## 7. Permissions

| Actor | Access |
|-------|--------|
| **Facility Operations** staff (org roles with FO ops/report entitlement) | Facility reports only (`facility` surface) |
| **Property Operations** staff (PM maintenance/report entitlement) | Property / residential reports only |
| **Complete** staff | Combined **according to permissions** — FO entitlement ⇒ facility reports; PM entitlement ⇒ property reports; both ⇒ both scoped views |
| **Tenant** (resident plane) | **No reporting access** |
| **Vendor portal** | **No reporting access** (Phase 1) |
| **Owner portal** | **No FAC-002 work-order export** (owner money remains FIN-OPS; do not conflate) |
| **Master Admin / platform operator** | May use platform health tools; must not bypass customer org isolation when acting inside a customer org context |

**Capability model (design intent)**

- Prefer **reuse** of existing report / maintenance read capabilities (`platform.reports:read`, maintenance read, FO ops read) rather than inventing customer-facing tiers  
- If a new capability key is required at implement time (e.g. `platform.work_order_reports:export`), it is an **entitlement flag**, not a SKU — must be approved with implementation package  
- Fail closed: missing capability ⇒ 403 / empty honest state  

**RBAC reuse:** Organization membership, product SKU gates, property/facility ACLs, and work-order read rules already used by FO/PM queues apply identically to report queries and exports.

---

## 8. Data security

| Control | Requirement |
|---------|-------------|
| Organization isolation | Every query filters `organization_id = caller.org`; RLS + service checks |
| Property / facility boundaries | Property ACL / facility site ACL applied to filter options and result rows |
| Surface isolation | FO never reads residential rows; PM never reads facility rows; Complete only via explicit dual entitlement |
| RBAC reuse | No parallel auth system; same four-plane model (ADR-003) |
| No cross-module leakage | Exports exclude FIN-OPS ledger lines, tenant PII beyond requester display name needed for ops, other orgs’ vendors |
| Media | CSV/PDF use **indicator only**; signed media URLs are not bulk-exported in Phase 1 |
| Audit | Export actions write `audit_events` (who, when, filters, format, row count) |
| Transport | Authenticated session only; no public report links in Phase 1 |

**Threat notes**

- Large CSV download is a data exfil path — enforce authz, row caps, and audit  
- Filter IDOR: validate every property/vendor/user filter id belongs to the org and is ACL-visible  

---

## 9. Technical approach (design — not implementation)

### 9.1 Data source

- **Primary:** `maintenance_work_orders` (ADR-020 shared work orders)  
- **Joins:** vendors, users/profiles for display names, MEDIA-001 attachment existence check  
- **No new reporting warehouse** in Phase 1  
- Additive indexes may be proposed at implement time if query plans require them — **not** authorized by this design package alone  

### 9.2 Service boundary

| Concern | Owner |
|---------|-------|
| Filter validation + authz | Server / Edge (ADR-007 for privileged export generation if needed) |
| Aggregation + row query | Reporting service over existing DB |
| CSV build | Server-side string builder (pattern: existing report CSV helpers) |
| PDF build | Server-side PDF (pattern: existing pdf-lib exports) |
| Caching | Optional short TTL for dashboard aggregates only; exports always fresh |

Reads may use RLS-backed queries. Heavy PDF/CSV generation should not block Mission Control UX — design for request/response download in Phase 1; async job queue is a future option if caps are hit.

### 9.3 Domain events (optional Phase 1)

- `work_order_report.exported` (format, filter hash, row count) for audit/analytics  
- Do not emit fabricated business metrics events  

---

## 10. Future compatibility

FAC-002 Phase 1 establishes a **report type registry** concept so later reports plug in without a second export stack:

| Future report type | Builds on |
|--------------------|-----------|
| Vendor performance | Same filters + group-by vendor; SLA / cycle-time columns; still org-scoped |
| Maintenance trends | Time-bucketed aggregates over WO history (may need rollup table later) |
| Cost reporting | Join FIN-OPS / vendor invoice data — **separate Approve**; ADR-010 deferral of full accounting still applies |
| Inventory reports | Inventory/parts modules (FO) — only after those modules are designed & approved |
| Asset history | Assets module work + WO links — after Assets workflows are approved |

**Extension rules**

1. New report types = Design → Document → Approve (do not silently expand Phase 1)  
2. Shared: authz, org isolation, CSV/PDF renderers, filter chrome, audit  
3. Distinct: metric definitions, columns, and data sources  
4. Never blend residential and facility facts unless a Complete combined pack is explicitly approved  

---

## 11. UX principles (when UI is later approved)

- Reports are **not** Mission Control — period review, not live triage  
- Brand/product context clear in FO vs PM homes  
- One job per section: Filters → Summary → Breakdown → Export actions  
- Export CTAs: **Download CSV**, **Download PDF** — clear busy/progress messaging (learn from FO UX remediation)  
- No tenant-facing reporting chrome  

---

## 12. Acceptance criteria (for a future implementation package)

Implementation may be claimed complete only when:

1. FO user sees facility-only dashboard metrics matching filters  
2. PM user sees residential-only metrics  
3. Complete user with both entitlements sees both scoped views; without one entitlement, that view is denied  
4. Tenant cannot open report routes or APIs  
5. CSV contains all required columns and only permitted rows  
6. PDF contains org name, period, summary metrics, table, completion statistics  
7. Cross-org and cross-surface leakage tests fail closed  
8. Export is audited  
9. No Stripe/billing/schema productization changes beyond any Approved additive migration  

---

## 13. Open questions (for Approve)

| ID | Question | Default if Approve is silent |
|----|----------|------------------------------|
| Q1 | Complete Phase 1: dual scoped views only, or one combined PDF? | Dual scoped views only |
| Q2 | Default date field: created vs completed? | Created; optional completed toggle |
| Q3 | New capability key vs reuse `platform.reports:read`? | Reuse read; add export capability only if security review requires |
| Q4 | CSV/PDF row caps (10k / 500)? | Adopt proposed caps |
| Q5 | Exact FO/PM route paths? | Deferred to implement; ownership binding |

---

## 14. Governance

| Artifact | Role |
|----------|------|
| This record (`docs/88`) | Authoritative Phase 1 design |
| ADR-025 | Architectural decisions (Proposed until Accept) |
| ADR-012 | Gate — no implement while Draft/Proposed |
| ADR-019 | Product constitution |
| ADR-020 | Shared work orders |
| ADR-003 | Four-plane auth |
| docs/57 | RAC executive layer — complementary, not replaced |
| FO module map | Reports nav ownership |

### Status board

| Stage | State |
|-------|-------|
| Design | **Done** (this document) |
| Document | **Done** |
| Approve | **Pending** Product Owner + Architect |
| Implement | **Blocked** until Approve |

---

## 15. Final statement

**FAC-002 Phase 1** is designed as organization-scoped **Work Order Reporting & Export** for Facility Operations and Property Operations (Complete by permission union), with dashboard metrics, filters, CSV, PDF, RBAC reuse, and hard tenant denial — complementary to RAC and FIN-OPS.

**STOP after design. No implementation.**
