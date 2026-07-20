# 07 — Future Roadmap

**Package:** FIN-001  
**Status:** Design ✔ · Document ✔ · Approve Pending · Implement Blocked  

**Rule:** Everything in this document is **documented only**. Do **not** implement in FIN-001 Phase 1.

---

## Extension law

All future features **plug into ReportingService**. Forbidden: parallel PDF pipelines inside Accounting, Owner Portal, or AI modules.

```
Future feature → ReportingService (generate / list / deliver hooks)
                      ↓
                 existing Report Engine / PDF / Vault path
```

---

## Roadmap items

### 1. Scheduled monthly generation

- Org/property cron: “Generate Owner Statement + P&L on the 1st”  
- Uses same `generateReport` job contract  
- Failure alerts to manager  

### 2. Owner delivery

- Email or Owner Portal publish of vault version  
- Delivery receipt + audit  
- Depends on Phase 9 Owner Portal readiness  

### 3. Manager delivery

- Internal distribution lists / “send packet to accounting”  
- Not a substitute for vault system of record  

### 4. Portfolio reports

- Multi-property rollups for org admins  
- Same PDF standard with portfolio header  

### 5. Budget vs Actual

- Consumes `property_budgets` (Phase 10 schema) + actuals from Report Engine  
- Variance columns and narrative hooks  

### 6. Tax reports / year-end packages

- Annual expense summaries, 1099 handoff packs  
- Explicitly not bookkeeping software  

### 7. AI financial summary

- IA-001 L0/L1: summarize vaulted report / preview model  
- Never auto-send to owner without human approval  
- Never mutate accounting to “fix” numbers  

### 8. Custom templates

- Org logo already Phase 1; later section order, cover letter, custom disclaimer  
- Template id becomes input to PDF Renderer  

### 9. Approval workflows

- Manager prepares → owner/approver reviews → mark published  
- Versions remain immutable; publish is a status on a version  

### 10. Digital signatures on packets

- API-004 reserved block becomes live signing of owner packets if product requires  
- Separate Approve package when pursued  

---

## Suggested sequencing (non-binding)

| Wave | Items | Dependency |
| --- | --- | --- |
| A | Schedule + manager notify | FIN-001 Phase 1 shipped |
| B | Owner delivery / portal | Phase 9 |
| C | Portfolio + Budget vs Actual | Stable single-property reports |
| D | AI summary | IA-001 + FIN-001 artifacts |
| E | Tax / year-end / custom templates | Partner demand |

---

## Out of future-roadmap (still non-goals)

- Replacing QuickBooks/Xero as system of record  
- Full trust accounting GL inside ReportingService  
- Letting AI silently adjust ledgers  
