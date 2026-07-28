# 03 — Guided Setup Continuity

**Package:** UX-013  
**Status:** Draft — Ready for Approval  
**Related:** [ACQ-001 §06](../115-acq-001-self-service-customer-acquisition/06-guided-setup-and-activation.md) · AUTH SetupGate

---

## Binding rule

Post-payment customers use the **same** Guided Setup and SetupGate as today. UX-013 does **not** introduce a separate trial onboarding workflow, trial dashboard, or “evaluator mode” after Checkout.

```
Payment success → Provision → Welcome / first login → Guided Setup → Finish Setup → Production dashboard
```

---

## Continuity requirements

| Requirement | Detail |
|-------------|--------|
| Same Setup | Self-serve Professional / Business use existing `/setup` criteria |
| SetupGate | Productive paths during incomplete setup remain AUTH-defined; no trial fork |
| Resume | Refresh / revisit restores progress (existing persistence) |
| Activation | Org Admin completes Finish Setup → `commercial_status=active` |
| Module awareness | Setup copy may mention licensed modules; it must not invent a second setup tree per module choice |
| No Trial track | Removing public Trial messaging does **not** add a temporary sandbox org path |

---

## Welcome surface

After credentials and first login, the Welcome / first-run moment should:

1. Confirm organization created  
2. Reflect module selection in plain language (“Property Operations”, “Facility Operations”, or both)  
3. CTA into Guided Setup (primary)  
4. Avoid “your free trial has started” language

Exact Welcome UI is Implement-scope after Approve; semantics above are binding.

---

## Production dashboard

When setup complete + active:

- Land on role-assigned home (AUTH / UX-012)  
- Apply **contextual navigation matrix** for the surface ([04](./04-contextual-navigation-matrices.md))  
- Hide unentitled modules  
- Upgrade / add-module prompts route to Subscription / sales — not a second public Checkout for the same org

---

## Explicit non-goals

| Non-goal | Why |
|----------|-----|
| Trial-only Guided Setup variant | Conflicts with paid-first acquisition |
| Skipping Setup for “evaluator” orgs | Violates Finish Setup / commercial Active rules |
| Redesigning Setup steps in this package | Continuity only; Setup content changes need AUTH/COM scope if material |
