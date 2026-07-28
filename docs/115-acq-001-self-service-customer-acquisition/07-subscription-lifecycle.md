# 07 — Subscription Lifecycle (Buyer-Facing)

**Package:** ACQ-001  
**Status:** Draft — Ready for Approval  
**SoT for money rail:** BILL-001 · **SoT for commercial states:** COM-001

ACQ-001 specifies **how buyers discover and enter** lifecycle actions; it does not duplicate Stripe portal logic.

---

## Upgrade flow

| Context | Path |
|---------|------|
| During public evaluation | Choose higher plan on `/pricing` before Checkout |
| After purchase | Settings → Billing → plan change / Checkout (existing) |
| At limit | Create blocked → message + Billing CTA (Phase C) |

Webhook rebinds entitlements; nav/modules update on next session load.

---

## Downgrade flow

| Rule | Detail |
|------|--------|
| UX | Billing Center confirmation (existing Founder leave / plan change confirms) |
| Entitlements | Rebound to lower plan; over-limit orgs keep existing resources but cannot create more |
| Modules | Newly removed modules hide/gate on next load |

---

## Cancellation flow

| Path | Behavior |
|------|----------|
| Self-serve | Stripe Customer Portal or Billing cancel-at-period-end (BILL-001) |
| After cancel | Creates blocked; data retention per COM offboarding |
| Win-back | COM / Finance playbook — not ACQ public site |

---

## Resume flow

| Situation | Resume |
|-----------|--------|
| Canceled Checkout | `/pricing` or `/acquire/canceled` → new session |
| Provision delayed | `/acquire/success` refresh / status poll |
| Setup incomplete | Login → `/setup` |
| Past due | Login → Billing update payment method |
| Trial ending | In-app trial banners + Billing convert (COM trial) |

---

## Public vs authenticated lifecycle

Public ACQ owns: explore → pay → success/cancel/error.  
Authenticated product owns: upgrade/downgrade/cancel/renew after Org Admin exists.
