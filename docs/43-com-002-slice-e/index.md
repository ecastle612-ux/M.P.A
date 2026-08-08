# 43 — COM-002 Slice E: Subscription Lifecycle

**Status:** Implemented (pending merge)  
**Parent:** [COM-002](../37-com-002-self-service-commercial/index.md) · ADR-018 Accepted  
**Depends on:** Slices A–D  
**Authorize:** AUTHORIZE COM-002 SLICE E IMPLEMENTATION  

---

## Scope

Self-serve subscription lifecycle for **Property Manager Professional / Business** only.

Renewal → billing success/failure → 7-day grace → recovery or cancellation → archive/expire → reactivation.

**No** Customer Billing Portal. **No** Capital Projects. **No** FO/Complete self-serve (`FO_READY` false).

## Reports

| Report | Path |
|--------|------|
| Implementation | [implementation-report.md](./implementation-report.md) |
| Lifecycle Verification | [lifecycle-verification.md](./lifecycle-verification.md) |
| Entitlement Verification | [entitlement-verification.md](./entitlement-verification.md) |
| Regression | [regression-report.md](./regression-report.md) |
| Master Admin | [master-admin-verification.md](./master-admin-verification.md) |

## STOP

```
STOP
Wait for AUTHORIZE COM-002 SLICE F before implementing the Customer Billing Portal.
```
