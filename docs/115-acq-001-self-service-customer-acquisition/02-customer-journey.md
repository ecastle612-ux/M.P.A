# 02 — Customer Journey

**Package:** ACQ-001  
**Status:** Draft — Ready for Approval

---

## Primary journey (self-serve)

| Step | Surface | Outcome |
|------|---------|---------|
| 1 | Landing page | Understand value; CTA to Tour or Pricing |
| 2 | Interactive product tour | See core workflows; CTA to Pricing |
| 3 | Pricing & plan comparison | Compare Trial / Pro / Business; Enterprise = Contact Sales |
| 4 | Select plan | Interval (monthly/annual) + plan code chosen |
| 5 | Checkout entry | Creates Stripe Checkout Session (BILL-001) with buyer metadata |
| 6 | Stripe Checkout | Payment / Trial PM collection hosted by Stripe |
| 7 | Payment success return | `/acquire/success` (or equivalent) — waiting / ready state |
| 8 | Automatic provisioning | COM activation + AUTH org + Org Admin (existing) |
| 9 | Credential delivery | Welcome email with username + first-login link |
| 10 | Email verification | If contact verification required by AUTH — complete before ops |
| 11 | First login | Password change / first-login gates |
| 12 | Guided Setup | Org profile, recovery contact, initial data as required |
| 13 | Organization activation | `commercial_status=active` (existing Finish Setup) |
| 14 | Production dashboard | Entitled modules visible; others gated/hidden |

---

## Alternate paths

### A — Payment failure

Stripe declines card → user remains on Checkout or returns with failure notice → retry Checkout with same plan selection → no org created.

### B — Checkout cancellation

User clicks back / cancel → `/acquire/canceled` → resume CTA to Pricing (same plan preselected if cookie/query allows).

### C — Abandoned Checkout

Session created, never completed → no org; optional abandoned-cart email only if email already captured in Checkout (Stripe) or pre-Checkout form (see open questions). Staff may see incomplete opportunity if one was created (optional).

### D — Expired Checkout Session

Return URL with expired session → message + “Start Checkout again” → new session; never reuse provision ledger for unpaid session.

### E — Resume onboarding (post-payment)

Org exists, Setup incomplete → login → SetupGate / `/setup` until Finish Setup criteria met → then dashboard. Browser refresh mid-setup must not lose progress (existing setup persistence).

### F — Existing email (buyer contact)

Checkout email matches existing Auth principal:

| Case | Behavior |
|------|----------|
| Principal already Org Admin of another org | Provision **new org** + membership (multi-org); welcome explains switcher |
| Principal is invitee/member only | Still create new org with them as Org Admin of **new** workspace (or block — see OQ-03) |
| Principal is Master Admin employee | Block self-serve purchase into customer org; Contact Sales / internal path |

### G — Existing organization

Buyer already has active SaaS subscription on an org → Checkout entry from **public** pricing should not create second open subscription for same org. Prefer “Log in → Settings → Billing” upgrade. Public page detects session (optional) and redirects.

### H — Duplicate organization detection

Same legal company name / tax id / normalized domain heuristics:

| Severity | Behavior |
|----------|----------|
| Soft | Warn at success page; allow continue; flag CS |
| Hard (exact Stripe customer + open sub) | Refuse second Checkout; resume existing |

Exact hard-match rules: see [18 — Open questions](./18-open-questions.md).

### I — Enterprise intent

User selects Enterprise → Contact Sales / Schedule Demo forms → COM-001 opportunity (Lead/SQL) — **no** self-serve Checkout.

---

## Timeboxes (design targets)

| Milestone | Target |
|-----------|--------|
| Landing → Pricing | ≤ 3 minutes typical |
| Pricing → Checkout start | ≤ 2 clicks after plan chosen |
| Payment success → credentials email | ≤ 2 minutes (p95) |
| First login → Active dashboard | Same session when Setup minimal path chosen |

---

## States the customer perceives

See [14 — State diagrams](./14-state-diagrams.md).

| Perceived state | Meaning |
|-----------------|---------|
| Exploring | Public pages |
| Checking out | Stripe hosted |
| Activating workspace | Provision in progress |
| First login | Credential gate |
| Setting up | Guided Setup |
| Ready | Active + dashboard |
