# 22 — Edge Cases

**Package:** AUTH-001  
**Status:** Draft — Awaiting Approval

---

## Provisioning

| Case | Expected behavior |
|------|-------------------|
| Billing webhook retries | Idempotent; one org; one Org Admin |
| Payment succeeds, email provider down | Org exists; email retries; Level 0 can resend |
| Username collision storm | Suffix/entropy; alert on exhaustion |
| Buyer abandons before first login | Org stays `pending_activation`; temp TTL may expire; Level 0 re-issue |
| Duplicate checkout for same company | BILL-001 one-subscription invariant; no second org from same active sub |

## First login

| Case | Expected behavior |
|------|-------------------|
| Temp password expired | Cannot enter product; Level 0 (Org Admin) or Org Admin (subaccount) re-issues |
| User closes browser mid-gate | Gate resumes; no bypass |
| Terms declined | Access denied; account remains non-activated |

## Email

| Case | Expected behavior |
|------|-------------------|
| Email changed then old inbox used for “reset” | Org Admin still cannot self-reset; subaccount resets still Org-Admin-driven |
| Two principals share contact email in different orgs | Allowed; login still username-based |
| Typo in invite email | Org Admin edits contact + resends |

## Authorization

| Case | Expected behavior |
|------|-------------------|
| User disabled mid-session | Subsequent requests fail closed; sessions revoked |
| Property assignment removed | Immediate loss of that property’s data |
| Entitlement module removed | Dashboard family unchanged; module routes blocked |
| Deep link to wrong portal family | Redirect to assigned home |

## Recovery

| Case | Expected behavior |
|------|-------------------|
| Attacker requests Org Admin reset | Fail verification; no temp issued; security alert |
| Secondary contact unverified | Block org activation; limit emergency path |
| Primary vs secondary dispute | Suspend elevation; formal verification |
| Org Admin tries self-serve forgot password | UX explains contact M.P.A.; no email reset link |

## Multi-org

| Case | Expected behavior |
|------|-------------------|
| Principal removed from active org | Must switch or see empty-state picker |
| Org Admin of A, tenant of B | Dashboards differ per active org; no bleed |

## Suspension / deletion

| Case | Expected behavior |
|------|-------------------|
| Past_due billing | Default: entitlements restricted; optional auto-suspend policy coordinated with BILL-001 |
| Org deleted, username reuse attempt | Denied via tombstone |
| Specialist access after go-live | Grant expired; further access needs new audited grant |

## AI onboarding

| Case | Expected behavior |
|------|-------------------|
| AI suggests wrong lease matches | Human confirm required; no silent commit |
| AI unavailable | Manual wizard continues |
| Malicious prompt injection | Org scope + tool allowlist; no cross-tenant tools |

---

## Design defaults for open product choices

See [24 — Open questions](./24-open-questions.md). Where unanswered at Approve, implementers must not invent cross-org or email-identity behavior.
