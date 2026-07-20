# 00 — Executive Summary

**Package:** FIN-001  
**Status:** Design ✔ · Document ✔ · Approve Pending · Implement Blocked

---

## Problem

Property managers spend disproportionate time assembling monthly owner packets: export from one screen, paste into a spreadsheet, format in a PDF tool, email attachments, and hope numbers match the ledger. Competitors win retention on **owner reporting depth and polish**. M.P.A. already has operational financial truth (Phase 10 + API-005 inputs) but lacks a **dedicated, isolated reporting engine** that turns that truth into professional, vaulted artifacts in under a minute.

---

## Opportunity

Make monthly owner reporting **nearly effortless** without becoming a second accounting system:

- One Reports surface under Accounting  
- Six Phase 1 report types with interactive preview  
- Branded PDF output  
- Automatic versioned storage in Document Vault  
- Architecture ready for schedule, delivery, and AI summary later  

This strengthens the [MOAT-001](../63-moat-001-competitive-advantage-blueprint/README.md) retention story: once owner packets live in M.P.A., switching costs rise.

---

## Solution (design intent)

Introduce **ReportingService** as the sole reporting entry point. It reads accounting/operational data, builds typed report models via a Report Engine, renders PDFs via a PDF Renderer, and persists versioned documents via Document Vault.

```
Accounting (unchanged write paths)
        ↓  read
ReportingService
        ↓
Report Engine → PDF Renderer → Document Vault
```

Accounting modules continue to own create/update/archive of money records. They **do not** render PDFs.

---

## Success criteria

| # | Criterion | Measure |
| --- | --- | --- |
| S1 | Zero impact on accounting | Existing financial create/update/list/detail flows unchanged in behavior |
| S2 | Read-only architecture | ReportingService has no write APIs to money tables / ledger |
| S3 | Professional reporting | Preview + PDF meet [04 PDF Standard](./04-pdf-standard.md) |
| S4 | Vault integration | Path + version rules per [05](./05-document-vault-integration.md) |
| S5 | Future-ready | Schedule / delivery / AI document extension points only ([07](./07-future-roadmap.md)) |
| S6 | Speed target (post-Implement) | Typical single-property monthly report generate ≤ 60 seconds for Design Partner scale |

---

## Non-goals

FIN-001 will **not**:

1. Redesign or replace Phase 10 accounting workflows  
2. Introduce a general ledger, chart of accounts, or trust accounting  
3. Process payments, refunds, or provider webhooks  
4. Perform bookkeeping (journal entries, bank reconciliation engines)  
5. Modify `rent_charges`, `payments`, `expenses`, `financial_activity`, or reconciliation state as part of report generation  
6. Implement scheduled sends, AI summaries, tax packages, or portfolio rollups in Phase 1  
7. Ship any application code, migrations, APIs, or UI before **Approve**

---

## Audience

| Role | Value |
| --- | --- |
| Property manager | Generate / preview / download / vault monthly reports quickly |
| Owner (future) | Consume vaulted statements via Owner Portal (Phase 9) — not Phase 1 UI |
| Org admin | Branding, retention policy readiness |
| Design Partner (RC-001) | Professional packets without accounting risk |

---

## Relationship to existing foundations

| Foundation | Role in FIN-001 |
| --- | --- |
| Phase 10 | Source entities for P&L, owner statement, expenses, cash activity |
| API-005 | Settlement-accurate ledgers improve report fidelity |
| API-002A + Phase 12 vault | Binary + metadata home for PDFs |
| DX-003 / DX-004 | Single discoverable Reports path; optional Command Center deep links post-Implement |
| ADR-010 | Confirms we report on operational finance — we do not build full GL now |

---

## Gate reminder

This package completes **Design** and **Document** only.

| Stage | Status |
| --- | --- |
| Approve | Pending — see [10 Approval Checklist](./10-approval-checklist.md) |
| Implement | Blocked until Approve |
