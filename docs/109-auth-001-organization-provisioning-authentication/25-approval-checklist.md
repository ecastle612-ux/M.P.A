# 25 — Approval Checklist

**Package:** AUTH-001 — Organization Provisioning, Authentication & Account Hierarchy  
**Status:** ✅ **APPROVED WITH AMENDMENTS** (2026-07-23)  
**Gate:** Design → Document → **Approve** → Implement  
**Binding record:** [32 — Approval record](./32-approval-record.md)

> Package approval is complete.  
> Implementation remains **LOCKED** until `AUTHORIZE AUTH-001 SLICE …` for a specific slice.

---

## Preconditions

| Check | Status |
|-------|--------|
| Document package complete (README + 00–32) | ✔ |
| ADR-026 Accepted | ✔ |
| Amendments A01–A08 incorporated | ✔ |
| No implementation performed under this package | ✔ |
| BILL-001 separation invariant respected | ✔ |
| ADR-003 four-plane model preserved | ✔ |

---

## Approve scope (accepted)

1. Subscriber becomes Organization Administrator of a private Organization workspace.  
2. Username is permanent login identity; email is contact only.  
3. M.P.A. generates usernames; never change; never reuse.  
4. Invitation-only — no public self-registration.  
5. Subscription capability chain controls visible features and limits.  
6. Org Admin recovers only via Master Admin (+ emergency contact path); subaccounts via Org Admin.  
7. Dashboards are assigned, never user-selected.  
8. Mandatory Setup Wizard with Professional Implementation **or** AI Guided Setup.  
9. Commercial org lifecycle per [28](./28-organization-status-lifecycle.md).  
10. Multi-org switching architecture reserved now.  
11. Offboarding transfers work; data retained.  
12. Support escalation L0 AI → L1 Org Admin → L2 Support → L3 Master Admin.  
13. Privileged actions permanently audited.  
14. Implementation slice-gated (A–E).

---

## Decision acceptance (D1–D16)

| # | Decision | Accept? |
|---|----------|---------|
| D1 | Subscriber = Organization Administrator | ✔ |
| D2 | Username identity / email contact | ✔ |
| D3 | MPA-generated immutable usernames | ✔ |
| D4 | Subaccounts only via Org Admin / Level 3 provision | ✔ |
| D5 | Org Admin recovery via Master Admin only | ✔ |
| D6 | Subaccount recovery via Org Admin | ✔ |
| D7 | Dashboard assignment rules | ✔ |
| D8 | Mandatory wizard + Professional/AI paths | ✔ |
| D9 | Hard org isolation | ✔ |
| D10 | Multi-org architecture + switching | ✔ |
| D11 | Supabase retained behind Identity Adapter | ✔ |
| D12 | Entitlements post-AuthZ (BILL-001) | ✔ |
| D13 | Invitation-only platform | ✔ |
| D14 | See only purchased capabilities | ✔ |
| D15 | Organization commercial lifecycle | ✔ |
| D16 | Permanent privileged audit | ✔ |

---

## Sign-off table

| Role | Name | Date | Decision |
|------|------|------|----------|
| Product Owner / Design Review | Design Review | 2026-07-23 | **Approved with Amendments** |
| Lead Architect | Lead Architect | 2026-07-23 | **Accepted** (amendments incorporated) |
| Security | Security | 2026-07-23 | **Accepted** |
| Commercial / Support Ops | — | 2026-07-23 | Covered by Design Review approval |

---

## Slice unlock (not yet issued)

```
AUTHORIZE AUTH-001 SLICE A
```

See [31 — Implementation slices](./31-implementation-slices.md).
