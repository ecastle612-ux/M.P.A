# 05 — Business Workflows

## Principle

M.P.A. is organized around **business workflows**, not software modules. Users experience one connected operating system. Engineering may implement domain services underneath, but the product must never feel like separate applications stitched together.

Each workflow below defines: **trigger → stages → participants → artifacts → completion criteria**.

---

## Master Lifecycle

The canonical property management lifecycle:

```
Property Setup
      ↓
   Marketing
      ↓
  Application
      ↓
Tenant Screening
      ↓
 Lease Signing
      ↓
    Move In
      ↓
Rent Collection  ←──────────────────┐
      ↓                             │
 Maintenance                        │
      ↓                             │
Vendor Assignment                   │
      ↓                             │
Owner Reporting                     │
      ↓                             │
   Move Out ────────────────────────┘
      ↓
   (Repeat / Turnover)
```

Turnover reconnects to Marketing. Financial and maintenance workflows run continuously in parallel — not sequentially.

---

## Workflow 1: Property Setup

**Trigger:** PM company onboarded; new property under management.

| Stage | Actor | Output |
|-------|-------|--------|
| Create property record | PM | Property identity, address, type |
| Define units | PM | Unit inventory |
| Attach ownership | PM | Owner linkage and reporting preferences |
| Upload documents | PM | Management agreement, insurance, prior records |
| Configure financial rules | PM | Rent amounts, fee schedules, trust account mapping |
| Set maintenance defaults | PM | Preferred vendors, SLA preferences |

**Completion:** Property is `active` and eligible for leasing and operations.

**AI touchpoints:** Document extraction from uploaded agreements; setup checklist suggestions.

---

## Workflow 2: Marketing & Listing

**Trigger:** Unit becomes vacant or available.

| Stage | Actor | Output |
|-------|-------|--------|
| Prepare listing | Leasing | Photos, description, pricing |
| Syndicate | System | External listing distribution (integration) |
| Track inquiries | Leasing | Lead record per prospect |
| Schedule showings | Leasing | Calendar events |

**Completion:** Qualified applicant enters Application workflow.

**AI touchpoints:** Listing copy generation; pricing recommendations based on market signals.

---

## Workflow 3: Application → Screening → Lease

**Trigger:** Prospect applies for unit.

| Stage | Actor | Output |
|-------|-------|--------|
| Application intake | Prospect / Leasing | Completed application + documents |
| Screening | Leasing / System | Background/credit check results |
| Decision | Leasing / PM | Approve, deny, or conditional |
| Lease generation | Leasing | Lease document from template |
| Signing | Tenant / Owner / PM | Executed lease |
| Deposit collection | Tenant / System | Funds captured per policy |

**Completion:** Executed lease with `start_date` scheduled.

**AI touchpoints:** Screening risk summary; lease clause review; fair housing consistency checks.

---

## Workflow 4: Move In

**Trigger:** Lease executed; start date approaching.

| Stage | Actor | Output |
|-------|-------|--------|
| Move-in inspection | PM / Tenant | Condition report with photos |
| Key / access handoff | PM | Access credentials logged |
| Utility transfer verification | PM | Checklist complete |
| Tenant portal activation | Tenant | Self-service access live |

**Completion:** Tenant `active`; unit `occupied`.

---

## Workflow 5: Rent Collection (Continuous)

**Trigger:** Recurring rent schedule per lease.

| Stage | Actor | Output |
|-------|-------|--------|
| Invoice generation | System | Rent charge created |
| Payment collection | Tenant / System | Payment via Stripe |
| Late detection | System | Delinquency state |
| Reminder sequence | System / PM | Communication log |
| Escalation | PM | Formal notice workflow |
| Owner visibility | System | Owner sees collection status |

**Completion:** Rent period `settled` or escalated to formal delinquency workflow.

**AI touchpoints:** Delinquency risk prediction; communication draft personalization.

---

## Workflow 6: Maintenance (Continuous)

**Trigger:** Tenant request, PM inspection, preventive schedule, or owner directive.

| Stage | Actor | Output |
|-------|-------|--------|
| Intake | Tenant / PM | Work order created |
| Triage & prioritize | PM / AI | Priority, category, SLA |
| Owner approval (if required) | Owner | Approval or rejection |
| Vendor matching | PM / AI / Marketplace | Vendor assigned or bid requested |
| Execution | Vendor | Work completed with evidence |
| Verification | PM / Tenant | Completion confirmed |
| Invoicing | Vendor | Invoice submitted |
| Payment | PM / System | Vendor paid via marketplace rails |

**Completion:** Work order `closed`; financial records updated; owner notified if required.

**AI touchpoints:** Priority scoring; vendor match ranking; scope summarization; photo analysis (future).

**Marketplace connection:** This workflow is the primary integration point between operations and the Vendor Marketplace.

---

## Workflow 7: Vendor Marketplace Operations (Continuous)

**Trigger:** PM needs external service; vendor seeks work.

| Stage | Actor | Output |
|-------|-------|--------|
| Vendor onboarding | Vendor / Platform | Verified marketplace profile |
| Compliance verification | Platform / System | Insurance, license valid |
| Job posting / match | PM / AI | Job available to qualified vendors |
| Bid or accept | Vendor / PM | Scope and price agreed |
| Performance tracking | System | Rating, SLA metrics updated |
| Payment settlement | System | Stripe Connect payout |

**Completion:** Job cycle closed; vendor reputation updated.

**This is a core system** — see **02 Product Philosophy** and **09 Database Architecture**.

---

## Workflow 8: Owner Reporting (Recurring)

**Trigger:** Scheduled report period (monthly default) or owner request.

| Stage | Actor | Output |
|-------|-------|--------|
| Data aggregation | System | Financial + operational data compiled |
| Summary generation | AI / System | Narrative owner summary |
| PM review | PM | Edits and approval |
| Delivery | System | Report published to owner portal |
| Owner review | Owner | Viewed, questions, approvals |

**Completion:** Report `published` for period.

**AI touchpoints:** Narrative drafting, anomaly highlighting, expense context.

---

## Workflow 9: Move Out & Turnover

**Trigger:** Lease end or early termination.

| Stage | Actor | Output |
|-------|-------|--------|
| Notice period | Tenant / PM | Move-out date confirmed |
| Move-out inspection | PM / Tenant | Condition report vs move-in |
| Deposit accounting | PM / System | Deductions calculated |
| Unit turn | PM / Vendor | Repairs, cleaning, make-ready |
| Re-list | Leasing | Returns to Marketing workflow |

**Completion:** Unit `vacant-ready` or `marketing`.

---

## Workflow Interconnection Model

Workflows share entities — they do not copy data:

```
                    ┌──────────────┐
                    │   Property   │
                    └──────┬───────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
      ┌─────────┐    ┌──────────┐   ┌──────────┐
      │  Lease  │    │ Work Ord │   │  Owner   │
      └────┬────┘    └────┬─────┘   └────┬─────┘
           │              │              │
           ▼              ▼              ▼
      ┌─────────┐    ┌──────────┐   ┌──────────┐
      │ Tenant  │    │  Vendor  │   │ Report   │
      └─────────┘    └──────────┘   └──────────┘
```

### Event-Driven Handoffs

Workflow transitions emit **domain events** (see **08 Software Architecture**):

| Event | Downstream Effect |
|-------|-------------------|
| `lease.signed` | Schedule move-in tasks; activate rent schedule |
| `work_order.created` | Notify PM; enqueue prioritization |
| `vendor.assigned` | Notify vendor; start SLA clock |
| `payment.received` | Update owner ledger visibility |
| `move_out.completed` | Trigger turnover workflow |

---

## Workflow-First Engineering Rule

Before implementing any capability:

1. Name the workflow and stage
2. List actors and permissions
3. Define artifacts created/modified
4. Define completion criteria
5. Map AI touchpoints (if any)
6. Only then design schema and API

No "orphan CRUD" — every table and endpoint serves a workflow stage.
