# Customer Journey Verification — BUG-003 / BUG-004

**Date:** 2026-08-07  

---

## Happy path

```
Landing (/)
  → Choose Modules (/modules)
  → Pricing (/pricing?intent=…)
  → Checkout confirm (/checkout?intent=…)
  → Create account (/login?mode=sign_up&intent=…)
  → Sign in
  → /dashboard → Guided Setup (/setup)
  → Create organization (Property Manager provisioned)
  → Billing acknowledgment
  → Finish → Mission Control
```

---

## Checks

| Check | Result |
|-------|--------|
| Pre-auth module selection | Pass |
| Pre-auth pricing comparison | Pass |
| Pre-auth checkout confirmation | Pass |
| Intent visible on signup | Pass |
| Acquisition cookie → Guided Setup banner | Pass |
| Org provisioning via existing API | Pass (unchanged) |
| Role-aware MC landing | Pass (unchanged `resolvePostAuthHome`) |
| Capital never offered | Pass |

---

## Verdict

**Pass** for the honest certified journey.
