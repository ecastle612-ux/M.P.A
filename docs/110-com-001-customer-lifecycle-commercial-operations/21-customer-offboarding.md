# 21 — Customer Offboarding

**Package:** COM-001  
**Amendment:** A06  
**Status:** Binding (Approved with Amendments)  
**Related:** [08 Cancellation](./08-cancellation-workflows.md) · [09 Reactivation](./09-reactivation-workflows.md)

---

## Principle

**No customer should lose data unexpectedly.**

Offboarding is a controlled sequence with export, retention, freeze, archive, and a defined recovery window — not an immediate hard delete on cancel click.

---

## Offboarding sequence

```
Cancellation
  → Retention Offers (save)
  → Final Billing
  → Export Data
  → Final Reports
  → Account Freeze
  → Archive
  → Deletion Schedule
  → Recovery Window (ends)
```

---

## Stage detail

### Cancellation

Confirmed cancel intent (Org Admin / contracting authority). Enter save attempt per [08](./08-cancellation-workflows.md).

### Retention offers

| Offer examples | Owner |
|----------------|-------|
| Down-renew | CS + Sales |
| Pause guidance (if policy) | CS |
| Implementation rescue | CS |
| Term discount (Finance-approved) | Finance |

### Final billing

- Finalize open invoices  
- Stop future charges at effective date  
- Process refunds only per Finance policy → `Refunded` annotation  

### Export data

| Export | Notes |
|--------|-------|
| Properties / units / tenants / leases | Structured export |
| Documents | Vault package or inventory + signed URLs window |
| Financial summaries | Final reports |
| User list | For customer records |

Default export window: **30 days** ([15](./15-open-questions.md) Q4).

### Final reports

Generate last owner/PM summaries available under entitlements before freeze completes.

### Account freeze

- Tenant logins blocked (or export-only mode)  
- Mutations blocked  
- Billing portal may remain for final invoice view  

Maps to AUTH **Cancelled** with export window.

### Archive

After retention clock ([15](./15-open-questions.md) Q5 default **180 days**): commercial **Archived**; operational restore not routine.

### Deletion schedule

| Data class | Schedule |
|------------|----------|
| Operational tenant data | Per retention → delete/anonymize job |
| Billing invoices / tax | Finance retention (longer) |
| Audit / username tombstones | AUTH permanent rules |
| Legal hold | Pause deletion |

### Recovery window

| Window | Path |
|--------|------|
| During export / pre-Archive | Win-back reactivation ([09](./09-reactivation-workflows.md)) — same org |
| After Archive | New customer lifecycle / new org (default) |
| Legal exception | Master Admin + Legal |

---

## Notifications (timeline)

All steps emit entries on [23 Communication timeline](./23-customer-communication-timeline.md): cancel confirm, export ready, freeze warning, archive notice.

---

## Acceptance (A06)

| ID | Criterion |
|----|-----------|
| OB-01 | Full offboarding sequence documented |
| OB-02 | Export + final billing + freeze before archive |
| OB-03 | Deletion schedule + recovery window explicit |
| OB-04 | No surprise immediate purge on cancel |
