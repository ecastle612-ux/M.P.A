# FIN-001 — Financial Reporting Foundation

**Status:** **Approved — Execution Phase 1**  
**Initiative ID:** FIN-001  
**Gate:** Design ✔ · Document ✔ · **Approved** · **Implement Phase 1 complete**  
**Policy:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)  
**Type:** Platform foundation (read-only reporting) — **not** a new accounting system

---

## Objective

Design a **Financial Reporting Foundation** that generates professional, owner-ready reports from existing accounting and operational financial data — without modifying any accounting workflow, ledger write path, or payment rail.

The reporting engine is **completely isolated** from accounting mutation. It only **reads** accounting data, composes report models, renders PDFs, and stores versioned artifacts in Document Vault.

---

## Gate status

| Stage | Status |
| --- | --- |
| Design | ✔ |
| Document | ✔ |
| Approve | ✔ Approved (EP-001 execution authorization) |
| Implement | **In progress** |

### Approve decisions (binding)

| Q | Decision |
| --- | --- |
| Q1 Income recognition | Dual toggle; **default Cash** |
| Q2 Owner statements | **A** — Phase 10 operational statements remain; FIN-001 PDF is presentation/vault layer |
| Q3 Capability | Reuse `financial:read` (+ `document:create` for vault persist) |
| Q4 Empty data | Generate empty-section PDF (not hard-fail) |

---

## Architecture (binding)

```
Accounting (read-only source of truth)
        ↓
ReportingService          ← single reporting entry point
        ↓
Report Engine             ← typed report models per catalog item
        ↓
PDF Renderer              ← branded professional layout
        ↓
Document Vault            ← versioned, never overwrite
```

**Hard rule:** Accounting modules **must never** generate PDFs directly. All PDF generation flows through `ReportingService` → Report Engine → PDF Renderer → Document Vault.

Future scheduling, owner delivery, and AI financial summaries **must plug into ReportingService** — they must not fork parallel report pipelines.

---

## Cross-links

| Package / surface | Relationship |
| --- | --- |
| [Phase 10 Financial Operations](../30-phase-10-financial-operations-foundation/README.md) | Primary operational data: charges, payments, expenses, owner statements, activity |
| [API-005 Resident Payments & Billing](../51-api-005-resident-payments-billing/README.md) | Ledger completeness / settlement quality feeds accurate reports ([07 Ledger & Reporting](../51-api-005-resident-payments-billing/07-ledger-and-reporting.md)) |
| [ADR-010 Defer Full Accounting](../18-decision-log/adr-010-defer-accounting-not-reject.md) | FIN-001 is reporting on operational finance — not a GL redesign |
| [API-002A Universal Media](../46-api-002a-universal-media-foundation/README.md) | Binary storage plane for PDF artifacts |
| [Phase 12 Document Vault](../41-phase-12-resident-experience-digital-operations/02-architecture-and-integration.md) | Vault metadata, versioning, entity linkage |
| [API-004 Signatures — Vault](../50-api-004-electronic-signatures/07-document-vault-integration.md) | Proven vault versioning / retention patterns to reuse |
| [Phase 9 Owner Portal & Reporting](../17-development-roadmap/index.md) | Future owner transparency consumes FIN-001 outputs |
| [DX-003 Zero Friction](../60-dx-003-zero-friction-daily-operations/README.md) | One path to Reports under Accounting; no competing report UIs |
| [DX-004 Five-Minute Rule](../61-dx-004-five-minute-rule/README.md) | Command Center / Today’s Work may deep-link to generate/preview |
| [MOAT-001 Competitive Moat](../63-moat-001-competitive-advantage-blueprint/README.md) | Effortless monthly owner reporting as retention moat |
| [RC-001 Beta Readiness](../52-rc-001-beta-readiness/README.md) | Design Partner constraints; reporting must not destabilize accounting |
| [Canopy / Product Experience](../30-product-experience/05-design-system.md) | Premium Reports page UX after Approve |
| [Security — Documents](../14-security-standards/index.md) | Org isolation, signed downloads, audit |

---

## Package contents

| Doc | Purpose |
| --- | --- |
| [00 — Executive Summary](./00-executive-summary.md) | Problem, value, success criteria, non-goals |
| [01 — Architecture](./01-architecture.md) | Isolation, layers, boundaries, nav IA |
| [02 — Report Catalog](./02-report-catalog.md) | Phase 1 reports: purpose, data, filters, totals |
| [03 — ReportingService](./03-reporting-service.md) | Contracts, read-only rules, job lifecycle |
| [04 — PDF Standard](./04-pdf-standard.md) | Brand, metadata, typography, print layout |
| [05 — Document Vault Integration](./05-document-vault-integration.md) | Pathing, versioning, retention hooks |
| [06 — Performance](./06-performance.md) | Async generation, cache, progress, retry |
| [07 — Future Roadmap](./07-future-roadmap.md) | Extensions documented only — not in Phase 1 |
| [08 — Risks](./08-risks.md) | Accuracy, load, scope creep, partner impact |
| [09 — Definition of Done](./09-definition-of-done.md) | Post-Approve implementation acceptance |
| [10 — Approval Checklist](./10-approval-checklist.md) | Explicit Approve gate |

---

## Binding rules (post-Approve)

1. **Read-only:** `ReportingService` never inserts/updates/deletes transactions, payments, expenses, rent charges, reconciliation, ledger, or accounting state.  
2. **Single entry point:** No module generates financial PDFs outside ReportingService.  
3. **Version, never overwrite:** Every generate creates a new vault version.  
4. **Zero accounting UX regression:** Existing Accounting pages keep current behavior; Reports is additive.  
5. **Future plugs in:** Schedule, delivery, AI summary, portfolio rollups extend ReportingService — they do not invent parallel engines.  
6. Material scope changes restart Design → Document → Approve.

---

## Phase 1 report catalog (summary)

1. Monthly Profit & Loss  
2. Owner Statement  
3. Rent Roll  
4. Cash Flow Summary  
5. Expense Report  
6. Delinquency Report  

Details: [02 — Report Catalog](./02-report-catalog.md).

---

## Explicit non-goals (this package)

- Accounting workflow changes  
- General ledger / chart of accounts redesign  
- Payment processing or provider changes  
- Bookkeeping automation  
- Scheduled delivery, AI summary, portfolio/tax packages (**future only** — [07](./07-future-roadmap.md))  
- Any Implement-phase code before Approve
