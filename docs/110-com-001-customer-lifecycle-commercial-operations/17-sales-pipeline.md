# 17 — Sales Pipeline

**Package:** COM-001  
**Amendment:** A01  
**Status:** Binding (Approved with Amendments)

---

## Purpose

Expand the customer lifecycle into a complete **CRM sales pipeline** from Lead through Won → Subscription Purchased → Organization Created → Customer Active.

This is the commercial opportunity record. It precedes and feeds AUTH-001 / BILL-001; it does not replace them.

---

## Pipeline stages

```
Lead
  → Marketing Qualified Lead (MQL)
  → Sales Qualified Lead (SQL)
  → Discovery
  → Demo
  → Proposal
  → Negotiation
  → Won
  → Subscription Purchased
  → Organization Created
  → Customer Active
```

Lost opportunities exit at any pre-Won stage with **Lost Reason** (and optional nurture).

### Stage definitions

| Stage | Entry | Exit |
|-------|-------|------|
| **Lead** | Contact captured | MQL or Disqualified |
| **MQL** | Marketing qualification criteria met | SQL accepted by Sales **or** recycle |
| **SQL** | Sales accepts ownership | Discovery booked **or** disqualify |
| **Discovery** | Needs/discovery call held or in progress | Demo scheduled |
| **Demo** | Demo completed (or explicitly waived) | Proposal |
| **Proposal** | Proposal/quote sent | Negotiation **or** Won/Lost |
| **Negotiation** | Terms under discussion | Won **or** Lost |
| **Won** | Verbal/written commit; Checkout imminent | Subscription Purchased |
| **Subscription Purchased** | Checkout started / order signed | Payment Successful (BILL-001) |
| **Organization Created** | AUTH-001 provision succeeded | Setup / Active path |
| **Customer Active** | Finish Setup (or Trial Active per policy) | Success motions ([06](./06-customer-success-model.md)) |

Mapping to original COM-001 spine ([01](./01-customer-lifecycle.md)): MQL/SQL refine “Qualified Prospect”; Discovery/Demo/Proposal/Negotiation refine demo→proposal; Won sits before Subscription Purchased.

---

## Opportunity tracking fields (required)

| Field | Description |
|-------|-------------|
| **Source** | Inbound, outbound, event, partner, website, etc. |
| **Sales Owner** | AE / SDR accountable |
| **Expected Close** | Forecast close date |
| **Probability** | 0–100% (stage-defaulted, owner-adjustable) |
| **Lost Reason** | Required on Lost (price, timing, competitor, no decision, …) |
| **Acquisition Cost** | Attributed CAC (media + sales cost allocation) |
| **Referral Source** | Partner / customer referrer if any |
| **Demo Completed** | Boolean + timestamp |

### Recommended additional fields

| Field | Description |
|-------|-------------|
| Company / portfolio size | Units, properties |
| Plan hypothesis | Target `plan_code` |
| Implementation preference | Professional / AI Guided |
| Competitor | If switching |
| Next step / next step date | Pipeline hygiene |
| CRM opportunity id | External system key |

---

## Probability defaults (design)

| Stage | Default probability |
|-------|---------------------|
| Lead | 5% |
| MQL | 10% |
| SQL | 20% |
| Discovery | 30% |
| Demo | 45% |
| Proposal | 60% |
| Negotiation | 75% |
| Won | 90% |
| Subscription Purchased → Active | 100% (closed-won commercial) |

---

## System of record

| Concern | Owner |
|---------|-------|
| Pipeline stages + fields | COM-001 (this doc) |
| CRM product (HubSpot/Salesforce/…) | Commercial ops ([15](./15-open-questions.md) Q6) |
| Payment / org facts | BILL-001 / AUTH-001 after Won |

CRM may host the UI; **stage semantics remain COM-001**.

---

## Acceptance (A01)

| ID | Criterion |
|----|-----------|
| SP-01 | Full MQL→SQL→…→Customer Active pipeline documented |
| SP-02 | Source, Sales Owner, Expected Close, Probability, Lost Reason, CAC, Referral, Demo Completed tracked |
| SP-03 | Lost requires Lost Reason |
| SP-04 | Won does not create org; Subscription Purchased / Payment Successful does |
