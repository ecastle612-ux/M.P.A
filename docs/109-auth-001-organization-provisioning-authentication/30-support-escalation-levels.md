# 30 — Support Escalation Levels

**Package:** AUTH-001  
**Amendment:** A06  
**Status:** Binding (Approved with Amendments)

---

## Ownership ladder

```
Level 0 — AI Assistant
    ↓
Level 1 — Organization Administrator
    ↓
Level 2 — M.P.A. Support
    ↓
Level 3 — Master Administrator
```

> Note: “Level 0” here means **first-line support automation**, not the AUTH-001 control-plane “Level 0 Master Admin” in [03](./03-organization-hierarchy.md).  
> To avoid collision in ops docs, use these labels:

| Escalation label | Actor |
|------------------|-------|
| **L0 — AI Assistant** | In-product / help AI |
| **L1 — Organization Administrator** | Customer owner of the workspace |
| **L2 — M.P.A. Support** | Human support agents |
| **L3 — Master Administrator** | Platform operators with `master_admin` |

Control-plane hierarchy remains: Master Admin (platform) → Organization Administrator (tenant).

---

## Issue routing (authentication)

| Issue type | First owner | Escalate when |
|------------|-------------|-----------------|
| How to log in / where is username | L0 AI | Unresolved after guided steps |
| Subaccount forgot password / locked | **L1 Org Admin** | Org Admin unavailable |
| Subaccount permission / dashboard confusion | L1 Org Admin | Suspected product defect |
| Org Admin forgot password / locked | **L2 Support** → identity verify → **L3** credential re-issue | Always involves L3 for secret issue |
| Org ownership dispute / Org Admin transfer | L2 → **L3** + recovery contact | Immediate L3 for ownership |
| Suspected account takeover | L2 freeze request → **L3 suspend/recover** | Immediate |
| Cross-org data exposure | **L3** + Security | P0 |
| Billing login vs entitlement confusion | L0/L1 → BILL-001 / L2 | Payment failures |
| Invitation not received | L1 resend → L2 email deliverability | Provider outage |

---

## Authority by escalation level

| Action | L0 AI | L1 Org Admin | L2 Support | L3 Master Admin |
|--------|-------|--------------|------------|-----------------|
| Explain login / username policy | ✔ | ✔ | ✔ | ✔ |
| Reset subaccount password | ✖ | ✔ | ✖ (must route to L1 unless emergency) | ✔ (audited exception) |
| Reset Org Admin password | ✖ | ✖ | Propose / verify only | ✔ |
| Suspend organization | ✖ | ✖ | Request | ✔ |
| Impersonate (ADMIN-001) | ✖ | ✖ | ✖ | ✔ audited |
| Create day-to-day users in customer org | ✖ | ✔ | ✖ | Exception only + audit |
| View plaintext password | ✖ | ✖ | ✖ | ✖ |

---

## AI Assistant (L0) constraints

- Org-scoped answers only  
- Cannot issue credentials  
- Cannot bypass invitation-only rules  
- Must escalate Org Admin lockouts to “Contact M.P.A. Support” (never fake a reset)  
- Must tell subaccounts to contact their Organization Administrator  

---

## Documented path requirement

Every authentication runbook must state:

1. Who owns the first response  
2. What evidence is required to escalate  
3. Who may mutate credentials or org state  
4. Which audit events must be written  

---

## Acceptance (A06)

| ID | Criterion |
|----|-----------|
| SUP-01 | Auth issues map to L0→L1→L2→L3 |
| SUP-02 | Org Admin reset cannot be completed below L3 |
| SUP-03 | Subaccount reset owned by L1 by default |
| SUP-04 | AI cannot issue or reveal credentials |
