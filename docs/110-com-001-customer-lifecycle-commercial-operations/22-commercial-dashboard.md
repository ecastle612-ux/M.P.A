# 22 — Commercial Dashboard

**Package:** COM-001  
**Amendment:** A08  
**Status:** Binding (Approved with Amendments)  
**Audience:** **M.P.A. staff only** (Master Admin / CS / Support / Finance as entitled)

---

## Purpose

Design the future **internal M.P.A. operations dashboard** for commercial health. This surface is **not** a customer product. Customers never see aggregate cross-org commercial metrics.

Aligns with ADMIN-003 mission-control patterns; COM-001 defines the commercial widgets and data contracts.

---

## Binding rule

```
Commercial Dashboard ⊆ M.P.A. control plane
Customer orgs ⊆ tenant plane
Never mix: no customer user may access this dashboard
```

---

## Widget catalog (design)

| Widget | Shows |
|--------|-------|
| **New Customers** | Orgs activated in period |
| **Trials** | Active trials; ending soon |
| **Active Organizations** | Count + trend |
| **Implementation Queue** | Orgs below 100% progress ([18](./18-implementation-progress.md)); Professional vs AI |
| **AI Setup Progress** | AI Guided path distribution / stalled |
| **Support Tickets** | Open volume by severity (linked system) |
| **Past Due Accounts** | Billing risk list |
| **Customer Health** | Band distribution + Critical list ([19](./19-customer-health-score.md)) |
| **Revenue** | MRR/ARR / new / churn (BILL-001 metrics) |
| **Renewals** | T-90 pipeline; at-risk renewals |

### Secondary (recommended)

| Widget | Shows |
|--------|-------|
| Sales pipeline funnel | [17](./17-sales-pipeline.md) stage counts |
| Offboarding / cancels | In-flight export windows |
| Feature discovery CTR | Adoption program health |
| Partner implementation load | [25](./25-implementation-marketplace.md) future |

---

## Access control

| Role | Access |
|------|--------|
| Master Admin | Full |
| Customer Success | Health, implementation, renewals, trials (no unnecessary raw Stripe secrets) |
| Technical Support | Implementation queue, tickets, past due (ops) |
| Finance | Revenue, past due, refunds |
| Sales | Pipeline widgets (CRM) — may be separate CRM; dashboard may deep-link |
| Customers / Org Admins | **None** |

All views audited on open for sensitive lists (optional harden).

---

## Non-goals (this package)

- Building the UI now (Implement locked)  
- Replacing ADMIN-003 entirely — compose widgets into HQ  
- Customer-facing analytics product  

---

## Acceptance (A08)

| ID | Criterion |
|----|-----------|
| CD-01 | Staff-only commercial dashboard designed |
| CD-02 | Widgets cover new/trial/active/implementation/AI/support/past due/health/revenue/renewals |
| CD-03 | No customer access path |
| CD-04 | Integrates conceptually with ADMIN-003 + BILL-001 metrics |
