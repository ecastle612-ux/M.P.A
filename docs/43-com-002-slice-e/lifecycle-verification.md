# Slice E — Lifecycle Verification

| Check | Result | Evidence |
|-------|--------|----------|
| Flag on / FO off | Pass | `COM_002_FLAGS` |
| Renewal success | Pass | `applyInvoicePaid` + webhook test |
| Payment failure → grace | Pass | `apply-lifecycle.test.ts` |
| Day 7 grace expire | Pass | `enforceGraceExpirations` |
| Recovery / restore | Pass | invoice.paid after past_due |
| Cancel at period end | Pass | `cancelAtPeriodEnd` |
| Reactivation | Pass | `reactivateSubscription` |
| Upgrade immediate | Pass | Pro→Business limits 25/150 |
| Downgrade period end | Pass | `pendingPlanTier` |
| Webhook duplicate | Pass | event id dedupe |
| Customer copy | Pass | no Stripe jargon in `customerStatusCopy` |
| Emails | Pass | lifecycle email kinds stubbed without Resend |

Customer-facing phases: Pending · Active · Grace · Past Due · Canceled · Expired · Reactivated.
