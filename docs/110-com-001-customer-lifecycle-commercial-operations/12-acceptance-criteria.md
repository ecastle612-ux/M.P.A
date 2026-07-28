# 12 — Acceptance Criteria

**Package:** COM-001  
**Status:** ✅ Approved with Amendments · Implement 🔒 Locked

---

## A) Design package acceptance (Approve gate)

| ID | Criterion | Status |
|----|-----------|--------|
| D-01 | Docs 00–27 present and consistent | ✔ |
| D-02 | Full customer lifecycle documented | ✔ |
| D-03 | Sales pipeline + sales-to-customer → AUTH handoff | ✔ |
| D-04 | Subscription architecture complete | ✔ |
| D-05 | Billing state machine + trial experience | ✔ |
| D-06 | Professional / AI / marketplace architecture | ✔ |
| D-07 | CS motions + health score + feature discovery | ✔ |
| D-08 | Renewal, cancellation, offboarding, reactivation | ✔ |
| D-09 | Handoffs, support, communication timeline, staff dashboard | ✔ |
| D-10 | ADR-027 Accepted; slices A–E defined; implement locked | ✔ |
| D-11 | Amendments A01–A09 incorporated | ✔ |
| D-12 | Amendment A10 (self-service acquisition) drafted with ACQ-001 | ☐ Pending Accept |

---

## B) Product / ops acceptance (post-implement)

| ID | Criterion |
|----|-----------|
| P-01 | No production org created before Payment Successful (except audited exception) |
| P-02 | Activation event always carries COM-001 handoff packet |
| P-03 | Every entitled feature maps to plan/add-on |
| P-04 | Past Due allows payment recovery login; Suspended blocks tenant login |
| P-05 | Setup requires Professional or AI Guided choice |
| P-06 | Finish Setup hands off to CS with 30-day scheduled |
| P-07 | Renewal sequence fires; failures enter Past Due machine |
| P-08 | Cancel preserves data for retention; Archive is terminal |
| P-09 | Reactivation does not duplicate org on win-back |
| P-10 | Every commercial issue routes on L0–L4 ladder |
| P-11 | Self-serve Trial/Pro/Business Checkout may create customers without sales (A10) |
| P-12 | Enterprise remains sales-assisted; no public Enterprise Checkout |

---

## Explicit fail conditions

- Auth creating customer orgs without COM-001 activation  
- **Free** public self-registration / “create free account” without payment or Trial Checkout success  
- Features shipping outside plan catalog  
- Billing states without defined login/feature behavior  
- Handoffs that exist only in Slack tribal knowledge  
- Implementation of COM-001 without Approve + unlock  
- Public Enterprise or Founder Checkout bypassing sales / Master Admin grant rules 