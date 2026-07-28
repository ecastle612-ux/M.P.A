# 19 — Customer Health Score

**Package:** COM-001  
**Amendment:** A03  
**Status:** Binding (Approved with Amendments)

---

## Purpose

Every organization receives an **automatically calculated health score** so Customer Success prioritizes outreach by risk — not intuition alone.

---

## Score bands

| Band | Meaning | CS posture |
|------|---------|------------|
| **Healthy** | Stable adoption + billing | Automated nurture; light touch |
| **Needs Attention** | Early warning signals | Scheduled outreach |
| **At Risk** | Multiple negative signals | Priority save playbook |
| **Critical** | Imminent churn / access / billing failure | Same-day CS + Billing / Support |

Underlying numeric score (e.g. 0–100) maps to bands; exact thresholds set at Implement with Product sign-off.

---

## Input factors

| Factor | Healthy signal | Risk signal |
|--------|----------------|-------------|
| **Login frequency** | Org Admin + staff regular | No Org Admin login N days |
| **Feature adoption** | Entitled modules used | Modules unused |
| **AI usage** | Within expected band for plan | Never used when entitled / abuse spikes |
| **Property setup completion** | Implementation score high ([18](./18-implementation-progress.md)) | Stalled before Production Ready |
| **Payment status** | Active / Trial current | Past Due / Grace / Suspended |
| **Support requests** | Normal volume, resolved | Rising P0/P1 or reopen rate |
| **Outstanding onboarding tasks** | None / deferred with plan | Aging deferred items |
| **Notification engagement** | Opens/clicks within norms | Hard bounces / zero engagement |

Factors are weighted; **payment status** and **login silence** are high-weight (fail-closed toward At Risk / Critical).

---

## Calculation principles

1. Org-scoped only (no cross-org bleed)  
2. Recalculated on a schedule + on material events (payment fail, Finish Setup, etc.)  
3. Explainable: CS sees top drivers (“Past Due”, “No login 21d”)  
4. AI Assistant may explain score to entitled CS/Support; customers may see a simplified status if Product Approves customer-facing copy  

---

## CS prioritization

| Band | Cadence |
|------|---------|
| Healthy | Standard 30/90 motions |
| Needs Attention | Outreach within 5 business days |
| At Risk | Outreach within 1–2 business days |
| Critical | Same day; involve Billing/Tech as needed |

Expansion plays pause while Critical/At Risk billing issues are open.

---

## Coupling

| System | Relationship |
|--------|--------------|
| Implementation progress | Strong input until 100% |
| Feature discovery ([20](./20-feature-discovery.md)) | Adoption gaps feed score |
| Communication timeline ([23](./23-customer-communication-timeline.md)) | Outreach logged |
| Commercial dashboard ([22](./22-commercial-dashboard.md)) | Aggregate health views |

---

## Acceptance (A03)

| ID | Criterion |
|----|-----------|
| HS-01 | Automatic score with Healthy→Critical bands |
| HS-02 | Factors include login, adoption, AI, setup, payment, support, onboarding, notifications |
| HS-03 | CS prioritization rules defined |
| HS-04 | Drivers are explainable to operators |
