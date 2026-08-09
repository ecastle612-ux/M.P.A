# Sprint 1 — Issue Register (Command Center)

| ID | Finding | Severity | Disposition |
| --- | --- | --- | --- |
| MA-CC-001 | `/admin` home is a nav card grid — no platform health pulse | High | Replace with Command Center visibility |
| MA-CC-002 | No org aggregate (active / trial / suspended / pending) | High | Derive from subscriptions + setup + provisioning |
| MA-CC-003 | No MRR / ARR operator view | High | Compute from live Stripe prices × active/trialing subs |
| MA-CC-004 | No users-by-role rollup | Medium | Aggregate `organization_memberships.roles` + operators |
| MA-CC-005 | System health scattered across consoles | Medium | Single System strip (Stripe / Supabase / Email / Demo / Jobs) |
| MA-CC-006 | No recent activity feed on home | Medium | Latest orgs, purchases, provisioning, lifecycle, support-adjacent |
| MA-CC-007 | Org “suspended” is not a first-class org column | Low | Map subscription unpaid/expired/canceled/dispute_hold (+ provisioning `suspended_unclaimed`) — documented mapping |
| MA-CC-008 | Support ticket feed does not exist | Low | Show honest empty / webhook+lifecycle as support-adjacent until Support sprint |
| MA-CC-009 | Must not change customer Mission Control / commercial flow | Critical | Regression gate — read-only `/admin` only |

## Mapping notes

- **Active orgs:** subscription `active`
- **Trial orgs:** subscription `trialing`
- **Suspended:** subscription in `unpaid` \| `expired` \| `canceled` \| `dispute_hold` OR latest provisioning `suspended_unclaimed`
- **Pending provisioning:** subscription `pending` OR setup incomplete OR provisioning job in-flight (non-terminal)
