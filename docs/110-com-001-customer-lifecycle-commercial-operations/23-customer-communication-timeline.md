# 23 — Customer Communication Timeline

**Package:** COM-001  
**Amendment:** A09  
**Status:** Binding (Approved with Amendments)  
**Related:** EML-001 · in-app notifications · CS tools

---

## Purpose

Every commercial communication becomes part of a **unified customer timeline** per organization (and linked opportunity pre-org where applicable).

Operators (CS, Support, Master Admin) and automation must be able to answer: *What did we send, when, why, and what happened next?*

---

## Timeline entry types (examples)

| Type | Examples |
|------|----------|
| **Welcome Email** | Org Admin credentials welcome |
| **Implementation Reminder** | Setup nudge; progress stall |
| **Invoice** | SaaS invoice / receipt |
| **Renewal Notice** | T-90 / T-30 / T-7 |
| **Past Due** | Dunning sequence |
| **Cancellation Warning** | Pre-cancel / freeze warnings |
| **Feature Announcement** | Entitled feature news |
| **Support Follow-up** | Ticket updates |
| **Customer Success Check-in** | 30/90-day, health outreach |
| **Trial reminder / convert** | Trial sequence ([24](./24-trial-experience.md)) |
| **Feature discovery** | In-app prompts ([20](./20-feature-discovery.md)) |
| **Offboarding** | Export ready, archive notice ([21](./21-customer-offboarding.md)) |

---

## Minimum fields per entry

| Field | Required |
|-------|----------|
| Timestamp (UTC) | ✔ |
| Organization id (or Opportunity id pre-org) | ✔ |
| Channel (email, in-app, SMS, call note, push) | ✔ |
| Template / campaign key | ✔ |
| Direction (outbound / inbound note) | ✔ |
| Actor (system / CS user / AI) | ✔ |
| Related object (invoice id, ticket id, …) | If any |
| Delivery status (queued / sent / delivered / bounced / opened / clicked) | Best effort |
| Body redaction policy | No secrets / temp passwords in timeline storage |

Temporary passwords must **not** be persisted on the timeline (AUTH-001).

---

## Unification rule

```
If M.P.A. sends a commercial or success communication
  → it MUST appear on the customer timeline
```

Exceptions: pure marketing to never-converted leads may live in CRM only until Won; after Organization Created, org timeline is SoT for customer comms.

---

## Consumers

| Consumer | Use |
|----------|-----|
| Customer Success | Context before outreach |
| Support | Avoid duplicate asks |
| AI Assistant (staff) | Summarize recent comms |
| Commercial dashboard | Volume / bounce widgets |
| Audit / compliance | Evidence of notices |

Customer-facing “message center” may show a subset; full commercial timeline is staff-visible by default.

---

## Acceptance (A09)

| ID | Criterion |
|----|-----------|
| CT-01 | Unified per-org timeline for commercial communications |
| CT-02 | Types cover welcome, implementation, invoice, renewal, past due, cancel, features, support, CS |
| CT-03 | No credential secrets stored on timeline |
| CT-04 | Pre-org opportunity comms linkable through Won → org |
