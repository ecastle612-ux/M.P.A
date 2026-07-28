# 13 — Handoffs

**Package:** COM-001  
**Status:** Draft — Awaiting Approval

---

## Principle

**No workflow should rely on tribal knowledge.**

Every transition between Sales, Billing, Authentication, Organization Provisioning, Implementation, Customer Success, Support, and Renewals has:

1. Trigger  
2. Artifact / event  
3. From owner → To owner  
4. SLA  
5. Failure path  

---

## Handoff catalog

### H1 — Sales → Billing

| Field | Definition |
|-------|------------|
| **Trigger** | Proposal accepted / Checkout link issued |
| **Artifact** | Quote id, plan_code, term, coupon, buyer contacts, implementation preference |
| **From → To** | AE → Billing Ops / BILL-001 Checkout |
| **SLA** | Checkout link within same business day |
| **Failure** | Stale quote; regenerate proposal |

### H2 — Billing → Organization Provisioning (AUTH-001)

| Field | Definition |
|-------|------------|
| **Trigger** | Payment Successful |
| **Artifact** | `SubscriptionActivated` event (idempotent) — see [02](./02-sales-to-customer-workflow.md) packet |
| **From → To** | BILL-001 → AUTH-001 Provisioning Service |
| **SLA** | Near real-time (minutes); alert if > threshold |
| **Failure** | Dead-letter + Technical L3 + Billing verify Stripe state |

**Critical:** AUTH must not invent customers without this handoff (or audited Master Admin commercial exception that still emits the event).

### H3 — Provisioning → Implementation

| Field | Definition |
|-------|------------|
| **Trigger** | Welcome email sent; Org Admin first-login capable |
| **Artifact** | Org id, Org Admin username, plan, implementation preference |
| **From → To** | Provisioning → Implementation (Professional queue) **or** AI Guided (self-serve) |
| **SLA** | Professional kickoff ≤ 5 business days; AI immediate |
| **Failure** | CS owns stalled Pending Setup |

### H4 — Implementation → Customer Success

| Field | Definition |
|-------|------------|
| **Trigger** | Finish Setup / Active Customer |
| **Artifact** | Go-live checklist, deferred items, health baseline |
| **From → To** | Implementation → CS |
| **SLA** | CS intro ≤ 2 business days; 30-day scheduled immediately |
| **Failure** | CS manager escalation |

### H5 — Customer Success → Renewals

| Field | Definition |
|-------|------------|
| **Trigger** | T-90 renewal window |
| **Artifact** | Health score, usage, risk flags, expansion hypothesis |
| **From → To** | CS → Renewals motion (may be same team with different playbook) |
| **SLA** | Forecast updated weekly in window |
| **Failure** | At-risk executive sponsor path (Enterprise) |

### H6 — Renewals / Billing → Support

| Field | Definition |
|-------|------------|
| **Trigger** | Past Due / Grace / Suspended |
| **Artifact** | Invoice ids, dunning step, org status |
| **From → To** | Billing → CS (save) + Technical if access bugs |
| **SLA** | First outreach within 1 business day of Past Due |
| **Failure** | Suspended → Master Admin if ownership/credential blocked |

### H7 — Support → Master Administrator

| Field | Definition |
|-------|------------|
| **Trigger** | Org Admin recovery, suspend/reactivate, ownership dispute |
| **Artifact** | Verification package + ticket |
| **From → To** | Technical Support / CS → Master Admin (AUTH L3 / COM L4) |
| **SLA** | Per severity (P0 same day) |
| **Failure** | Security incident process |

### H8 — CS → Sales (Expansion)

| Field | Definition |
|-------|------------|
| **Trigger** | Expansion opportunity qualified |
| **Artifact** | Usage proof, target plan/add-on |
| **From → To** | CS → AE |
| **SLA** | Contact ≤ 3 business days |
| **Failure** | Remains CS-owned nurture |

### H9 — Cancel → Billing → Archive clock

| Field | Definition |
|-------|------------|
| **Trigger** | Confirmed cancellation |
| **Artifact** | Effective date, refund decision, export offer |
| **From → To** | CS → Billing → system retention job |
| **SLA** | Billing cancel same day as confirm |
| **Failure** | Finance exception queue |

---

## RACI (summary)

| Activity | Sales | Billing | Auth/Prov | Impl | CS | Tech Support | Master Admin |
|----------|-------|---------|-----------|------|----|--------------|--------------|
| Qualify/close | A | C | I | I | I | I | I |
| Checkout/charge | C | A | I | I | I | I | I |
| Provision org | I | C | A | I | I | C | I |
| Setup | I | I | C | A | C | C | I |
| Adoption | I | I | I | C | A | C | I |
| Renewal | C | A/C | I | I | A | I | I |
| Suspend/recover ownership | I | C | C | I | C | C | A |

A=Accountable, C=Consulted, I=Informed

---

## Acceptance

| ID | Criterion |
|----|-----------|
| HO-01 | H1–H9 defined with trigger, artifact, owners, SLA, failure |
| HO-02 | AUTH provision requires Billing activation event |
| HO-03 | Implementation → CS handoff is mandatory at Active |
