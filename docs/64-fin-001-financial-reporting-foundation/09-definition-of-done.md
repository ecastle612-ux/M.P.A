# 09 — Definition of Done

**Package:** FIN-001  
**Status:** Design ✔ · Document ✔ · Approve Pending · Implement Blocked  

This DoD applies to **post-Approve Implementation Phase 1**. It is not authorization to implement now.

---

## Gate prerequisite

- [ ] FIN-001 README status is **Approved**  
- [ ] [10 Approval Checklist](./10-approval-checklist.md) signed by gate owners  
- [ ] Open Approve questions (Q1–Q4) recorded with decisions  

---

## Architecture DoD

- [ ] `ReportingService` exists as single entry point for financial report preview/generate/download/versions  
- [ ] Accounting mutation modules do **not** import PDF renderer  
- [ ] Report generation performs **no writes** to charges, payments, expenses, ledger, reconciliation  
- [ ] Layering matches: ReportingService → Report Engine → PDF Renderer → Document Vault  

---

## Product / UX DoD

- [ ] Accounting nav includes **Reports** additively; Dashboard / Transactions / Expenses / Rent / Vendors behavior unchanged  
- [ ] Reports page presents six Phase 1 cards with property selector, period, preview, generate, download, previous versions, saved count  
- [ ] Loading / empty / error / success / generating states implemented  
- [ ] Interactive preview shows professional formatting before download  
- [ ] Future actions (Send to Owner, AI Summary) absent or clearly non-functional placeholders — not fake-complete  

---

## PDF DoD

- [ ] PDFs include org, logo (or fallback), property, address, manager, period, generated timestamp, page numbers  
- [ ] Totals / subtotals present per catalog  
- [ ] Basis disclaimer present where cash vs accrual could confuse  
- [ ] Signature placeholder region reserved (non-functional)  

---

## Vault DoD

- [ ] Auto-save on successful generate  
- [ ] Path taxonomy: Properties → Financial Reports → Year → Month  
- [ ] Versions never overwrite  
- [ ] Previous versions list works  

---

## Performance DoD

- [ ] Generation is async with progress indicator  
- [ ] Fingerprint cache prevents redundant renders when data unchanged  
- [ ] Design Partner scale single-property monthly report typically ≤ 60s  
- [ ] No measured regression on core accounting write paths in smoke checks  

---

## Verification DoD (Implement phase)

- [ ] TypeScript clean for touched packages  
- [ ] ESLint clean for touched files  
- [ ] Targeted browser verification of Reports flow (authenticated)  
- [ ] **Do not** require full-repo verification suite for FIN-001 merge unless CI already mandates  

---

## Explicitly not DoD for Phase 1

- Scheduled generation  
- Owner / manager delivery  
- Portfolio / tax / year-end / budget vs actual  
- AI financial summary  
- Custom templates  
- Approval workflows  
- Live digital signature on packets  
- GL / bookkeeping / payment processing changes  

---

## Success narrative

> A property manager opens Accounting → Reports, picks a property and month, previews an Owner Statement, generates a branded PDF, finds it versioned in Document Vault, and downloads it — in under a minute — while rent charge and payment workflows continue to behave exactly as before.
