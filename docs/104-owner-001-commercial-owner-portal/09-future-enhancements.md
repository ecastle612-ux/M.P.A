# 09 — Future Enhancements

**Package:** OWNER-001  
**Status:** Approved package · Phase 1 ✅ COMPLETE  
**Section:** §12 Future Enhancements

Distinguish carefully:

- **Deferred to Phase 2+** — still OWNER-001 MVP; tracked in [README progress](./README.md) and [13 Completion](./13-phase-1-completion.md).  
- **Future Release** (below) — **not** OWNER-001 MVP; must not ship under this initiative without a new Design → Document → Approve cycle (or an explicit Approve amendment).

---

## Deferred by explicit MVP exclusion

| Item | Target track | Notes |
|------|--------------|-------|
| Stripe Connect Express onboarding for owners | FIN-003 / Blocker 4 | ADR-023 Accepted |
| ACH / live owner payouts | FIN-003 | `OwnerPayoutService` |
| Completed payout history (live) | FIN-003 | Replaces MVP placeholders |
| Pending payout calculation (live) | FIN-003 | Replaces placeholder |
| Owner maintenance approvals | Future Owner Ops | AUT-502 / Phase 9 ideas; excluded from MVP |
| Investment analytics (IRR, cap rate, forecasts) | Future Analytics | Not commercial blocker |
| AI forecasting for owners | Future AI | AI assistive nav only in MVP |
| Tax automation / 1099 exports | Future Tax | Out of scope |

---

## Likely post-MVP portal enhancements

| Item | Why deferred |
|------|--------------|
| Owner document upload | MVP is consume/read; PM/system publish remains source |
| Full owner CRM / contact management | Scope creep risk called out in CORE-001 |
| Multi-owner split visualization beyond statement totals | Depends on FIN-003 allocation model |
| Owner-facing budgeting / reserves management | Accounting depth deferred (ADR-010) |
| Native mobile apps | PWA/shell first; native strategy separate |
| SMS as primary owner channel | SMS commercially constrained; notifications foundation first |
| Advanced report generation by owners | MVP consumes published/owner-safe outputs |
| Marketplace / owner vendor directory | Not an owner portal job |

---

## Roadmap relationships

```
OWNER-001 Approved
  → Phase 1 Foundation ✅ COMPLETE
  → Phases 2–8 (Deferred to Phase 2+ until authorized)
      → CORE-002 Blocker 3 commercial PASS
          → FIN-003 / Blocker 4 (payouts) plugs into placeholders
          → PUSH-001 / Blocker 5 may harden owner push delivery
```

OWNER-001 success includes being a stable host for FIN-003 UI, not implementing FIN-003.
