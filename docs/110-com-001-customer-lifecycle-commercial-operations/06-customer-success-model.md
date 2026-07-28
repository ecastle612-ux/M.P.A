# 06 — Customer Success Model

**Package:** COM-001  
**Status:** ✅ Approved with Amendments · Implement 🔒 Locked  
**Prioritization engine:** [19 — Customer health score](./19-customer-health-score.md) · **Adoption:** [20](./20-feature-discovery.md)

---

## Purpose

Define **post-sale** workflows that keep Active Customers healthy, expanding, and renewing — owned primarily by Customer Success (L2), with AI (L0) assistance and Technical (L3) for defects. CS prioritizes by health band (Healthy → Critical).

---

## Success motions

### 30-day check-in

| Field | Definition |
|-------|------------|
| **Trigger** | 30 days after Active Customer |
| **Owner** | Customer Success |
| **Goals** | Confirm login, setup completeness, first workflows working, open blockers |
| **Actions** | Meeting or structured async questionnaire; ticket backlog review |
| **Exit** | Healthy / At-risk flag + next actions |

### 90-day review

| Field | Definition |
|-------|------------|
| **Trigger** | 90 days after Active |
| **Owner** | CS (+ AE for Enterprise) |
| **Goals** | Adoption depth, ROI narrative, expansion hypothesis, support themes |
| **Actions** | QBR-lite; usage report; plan fit check |
| **Exit** | Expansion opportunity **or** save plan **or** healthy renew track |

### Renewal reminders

Owned jointly with [07](./07-renewal-workflows.md). CS ensures human touch on Business/Enterprise; automation covers standard reminders.

### Usage alerts

| Signal | Example | Response |
|--------|---------|----------|
| Approaching seat limit | ≥80% users | Upsell seats / cleanup inactive |
| Approaching property/unit limit | ≥80% | Expansion pack / upgrade |
| Storage high | ≥80% | Cleanup guidance / upgrade |
| AI quota high | ≥80% | AI boost / upgrade |

Notifications to Org Admin; CS notified on Business/Enterprise.

### Low adoption alerts

| Signal | Example | Response |
|--------|---------|----------|
| Few weekly active users | Below plan baseline | CS outreach + training |
| Modules entitled but unused | e.g. maintenance unused 30d | In-app tips + CS playbook |
| Setup deferred items stale | Deferred > 30d | Nudge to complete |

### Inactive organization alerts

| Signal | Example | Response |
|--------|---------|----------|
| No Org Admin login N days | e.g. 14/30 | Email + CS call |
| No operational events N days | Portfolio silent | Health check |
| Past Due + silent | Billing risk | Billing + CS joint |

### Expansion opportunities

| Signal | Play |
|--------|------|
| Limit pressure | Upgrade / add-on |
| Owner portal unused but owners exist | Enable + train |
| Marketplace off but vendors active offline | Enable marketplace |
| Multi-org need | Future multi-org SKU conversation |

---

## Health scores (design)

| Component | Inputs (examples) |
|-----------|-------------------|
| Login health | Org Admin + staff activity |
| Workflow health | WO / lease / payment events |
| Billing health | Active vs Past Due |
| Support health | Open P0/P1 tickets |
| Adoption health | Entitled modules used |

At-risk threshold triggers CS save playbook.

---

## Cadence by support tier

| Tier | CS motion |
|------|-----------|
| Standard | Automated 30/90 + alert-driven outreach |
| Priority | Named CS; proactive 30/90 |
| Dedicated (Enterprise) | Named CSM; QBR; executive sponsor path |

---

## Handoff from Implementation

On Finish Setup:

1. Implementation closes  
2. CS becomes primary relationship owner  
3. 30-day check-in scheduled  
4. Success metrics baseline captured  

---

## Acceptance

| ID | Criterion |
|----|-----------|
| CS-01 | 30-day and 90-day motions defined |
| CS-02 | Usage, low adoption, inactive alerts defined |
| CS-03 | Expansion signals defined |
| CS-04 | Implementation → CS handoff is explicit |
