# 08 — Cancellation Workflows

**Package:** COM-001  
**Status:** ✅ Approved with Amendments · Implement 🔒 Locked  
**Full offboarding sequence:** [21 — Customer offboarding](./21-customer-offboarding.md)

---

## Purpose

End the commercial relationship cleanly: stop charges (except legally owed), preserve data for retention/export, and leave a path to reactivation or archive.

---

## Cancellation sources

| Source | Example |
|--------|---------|
| Customer-initiated | Portal cancel / written notice |
| Non-renewal | Term ends without renew |
| Dunning exhaustion | Unpaid → Suspended → Cancelled |
| Company-initiated | Abuse, ToS, fraud |
| Trial expiry | No convert |

---

## Workflow

```
Cancel request validated
  → Save attempt (CS) when appropriate
  → Confirm cancellation terms (effective date, refund policy)
  → BILL-001 cancel subscription
  → AUTH org → Cancelled
  → Revoke tenant operational access (export window optional)
  → Exit survey / interview
  → Retention clock → Archived
```

---

## Save attempt (optional but default for paid)

| Step | Owner |
|------|-------|
| Understand reason | CS |
| Offer down-renew / pause guidance | CS + Sales |
| Offer implementation help if setup pain | CS + Implementation |
| If billing dispute | Billing |

If customer confirms cancel → proceed.

---

## Effective behaviors

| Dimension | Behavior |
|-----------|----------|
| **Billing** | No new charges after effective date; finalize open invoices |
| **Login** | Blocked or export-only per policy window |
| **Features** | No operational mutations |
| **Data** | Retained for retention period; export offered |
| **Users** | Memberships disabled; usernames not reused (AUTH-001) |
| **Notifications** | Cancel confirm; export deadline; win-back optional |

---

## Refunds

| Case | Treatment |
|------|-----------|
| Cooling-off / goodwill | Finance approves → `Refunded` annotation |
| Dispute / chargeback | Billing + Finance runbook |
| Partial period | Proration policy |

Refund does not by itself delete the org; it annotates commercial state.

---

## Exit criteria to Archived

Retention window elapsed **and** no legal hold → Archived ([01](./01-customer-lifecycle.md)).

---

## Acceptance

| ID | Criterion |
|----|-----------|
| CAN-01 | Cancel sources and workflow documented |
| CAN-02 | Save attempt ownership defined |
| CAN-03 | Billing stop + access revoke + retention explicit |
| CAN-04 | Path to Archive or Reactivation exists |
