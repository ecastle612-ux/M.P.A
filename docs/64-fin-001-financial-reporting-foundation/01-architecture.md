# 01 — Architecture

**Package:** FIN-001  
**Status:** Design ✔ · Document ✔ · Approve Pending · Implement Blocked

---

## Intent

Separate **money mutation** (Accounting) from **money presentation** (Reporting). Accounting remains system of record for operational financial state. Reporting is a pure consumer that produces immutable artifacts.

---

## Layered architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Accounting domain (Phase 10 + API-005 consumers)            │
│  rent_charges · payments · expenses · activity · statements  │
│  WRITE paths unchanged · NEVER emit PDFs                    │
└────────────────────────────┬────────────────────────────────┘
                             │ read-only queries / projections
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  ReportingService                                            │
│  • authorize + scope (org / property / capability)           │
│  • validate filters (property, period)                       │
│  • enqueue / run generation job                              │
│  • return preview model + job status                         │
│  • resolve cached PDF / vault version                        │
└────────────────────────────┬────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  Report Engine                                               │
│  One generator per catalog type → typed ReportModel          │
│  Totals / subtotals / groupings computed in engine           │
└────────────────────────────┬────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  PDF Renderer                                                │
│  Applies FIN-001 PDF Standard (brand, headers, page #)       │
│  Output: bytes + content hash                                │
└────────────────────────────┬────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  Document Vault (API-002A media + Phase 12 metadata)         │
│  Versioned path · never overwrite · signed download          │
└─────────────────────────────────────────────────────────────┘
```

---

## Isolation rules

| Rule | Requirement |
| --- | --- |
| I-1 | Reporting code lives in a dedicated module namespace (e.g. `lib/reporting/**`) — not inside charge/payment/expense mutation services |
| I-2 | ReportingService may **SELECT** (or equivalent read APIs) only |
| I-3 | Accounting services must not import PDF renderer |
| I-4 | Existing owner-statement **workflows** that create operational `owner_statements` records remain Accounting concerns; PDF presentation of those summaries goes through ReportingService |
| I-5 | Failures in report generation must not roll back or lock accounting writes |

### Clarification: Phase 10 `owner_statements`

Phase 10 already has an operational owner-statement concept. FIN-001 treats:

- **Operational statement record** (if present) as a **read source / input**, not something ReportingService mutates as bookkeeping  
- **Owner Statement PDF / preview** as a **report artifact** owned by ReportingService + Vault  

Post-Approve implementation must not break existing statement list/generate UX. Prefer additive: Reports card can generate vaulted PDF from the same underlying period data the operational statement uses. Any consolidation of “statement record vs report artifact” requires an explicit Approve-time decision (see [10](./10-approval-checklist.md) Q2).

---

## Navigation IA (additive)

Under **Accounting** (product name in UX; maps to current financials surfaces):

| Item | Behavior change in FIN-001 Phase 1 |
| --- | --- |
| Dashboard | None |
| Transactions | None |
| Expenses | None |
| Rent | None |
| Vendors | None |
| **Reports** | **New** destination — report cards hub |

**DX-003 alignment:** Reports is the single place to generate financial PDFs. Do not add competing “Export PDF” buttons on every accounting list that bypass ReportingService.

**DX-004 alignment (post-Implement, optional):** Command Center actions such as “Generate Owner Statement” deep-link into Reports with prefilled property + period — still calling ReportingService.

---

## Reports page (design)

### Layout

Premium Canopy composition (not a dense admin table):

- Page title: **Reports**  
- Short supporting line: e.g. “Professional property reports from your live accounting data.”  
- Grid of **report cards** (six Phase 1 types)

### Each report card includes

| Element | Purpose |
| --- | --- |
| Report name + one-line purpose | Orientation |
| Property selector | Scope (required for Phase 1 single-property reports) |
| Reporting period | Month/year or date range per report type |
| Saved report count | Versions already in vault for this type/property/period context |
| Preview | Opens interactive in-app preview |
| Generate | Starts async generation job |
| Download PDF | Uses latest successful job / vault version |
| View previous versions | Version list drawer/panel |

### UX states (required)

| State | Behavior |
| --- | --- |
| Loading | Skeleton cards / selectors; no false empty |
| Empty | No properties / no data for period — explain next action |
| Error | Human-readable failure; retry without leaving page |
| Success | Toast + enable Download / View in Vault / Preview refresh |
| Generating | Progress indicator (indeterminate or staged) |
| Cached | If identical inputs + source fingerprint match, serve cached PDF |

### Interactive preview

Before download:

1. Render report inside M.P.A. with professional formatting  
2. Support dark/light theme-compatible preview chrome  
3. Primary actions: **Download PDF**, **Save to Vault** (auto-save on generate may already vault — UI reflects status)  
4. Disabled / future placeholders (visible but not Phase 1): **Send to Owner**, **AI Summary**

---

## Capability & tenancy (design)

| Concern | Design |
| --- | --- |
| Auth | Existing session / org membership |
| Capability | Prefer `financial:read` (or dedicated `reporting:generate` if Approve chooses split) |
| RLS | All reads org-scoped; vault writes org + property linked |
| Audit | Job start/complete/fail + vault store events |

Exact capability naming is an Approve-time detail; must not grant write on money tables.

---

## Extension ports (design only)

ReportingService must expose conceptual hooks (interfaces / events), not implementations:

| Hook | Future consumer |
| --- | --- |
| `onReportGenerated` | Notifications, Owner Portal publish |
| `scheduleReport(spec)` | Monthly cron |
| `deliverReport(versionId, channel)` | Email / portal |
| `summarizeReport(versionId)` | IA-001 AI financial summary |
| `listTemplates()` | Custom templates |

See [07 Future Roadmap](./07-future-roadmap.md).

---

## Dependency direction (allowed)

```
UI (Reports) → ReportingService → Report Engine → reads Accounting repositories
                              → PDF Renderer → Document Vault / MediaService
```

**Forbidden:**

```
Accounting write service → PDF Renderer
Report Engine → payment/expense mutation APIs
```
