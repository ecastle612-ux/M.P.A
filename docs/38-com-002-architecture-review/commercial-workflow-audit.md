# Commercial Workflow Audit — COM-002

## Paths reviewed

| Persona / state | Covered in COM-002? | Gap |
|-----------------|---------------------|-----|
| Visitor | Yes (landing → choose) | Funnel length; see CX |
| Demo user | Yes (J2) | Scale/honesty; see Demo audit |
| Paying customer (new) | Yes (J1) | Bind race; FO honesty |
| Enterprise prospect | Yes (J3) | CRM/SLA thin |
| Returning customer | Partial (J4) | Team admin billing roles unclear |
| Failed payment / past_due | Partial | Dunning cadence not specified |
| Canceled (in period) | Partial | In-app “read-only until date” UX missing |
| Expired / access revoked | Weak | Dedicated expired-subscription journey missing |
| Reactivated | Mentioned | Data restore expectations unclear |
| Paused subscription | Mentioned once in status table | No customer journey |
| Chargeback / dispute | **Missing** | Must add |
| SCA / `invoice.payment_action_required` | **Missing** | Must add |
| Team invite after purchase | **Missing** | First buyer ≠ only user |
| Ownership transfer | **Missing** | Support/Enterprise need |
| Refund after provision | Thin | Entitlement impact policy incomplete |
| Multi-org operator | Open (O12 area) | Bind policy undecided |

---

## Missing journeys (required amendments — A4)

### M1 — Expired subscription wall

When access ends, customer needs:

1. Clear “subscription ended” state (not generic 403).  
2. Read-only or blocked mode policy.  
3. One CTA: Reactivate / Contact Enterprise.  
4. Data retention messaging.

### M2 — Chargeback / dispute

`charge.dispute.created` → freeze risky entitlements or flag org; support runbook; avoid silent continued access.

### M3 — Payment action required (3DS / SCA)

Customer must complete authentication; subscription incomplete until done; success page must handle pending action.

### M4 — Pause

If pause is in scope, define who can pause (customer vs ops), access during pause, resume billing. If out of scope for v1, **explicitly forbid** pause rather than listing `paused` vaguely.

### M5 — Invite team

Post-Mission-Control: invite seats within plan limits; role assignment; billing admin vs operator roles.

---

## Workflow strengths

- Clear Pro/Business vs Enterprise fork.  
- Lifecycle upgrade/downgrade/cancel defaults are sensible (period-end downgrade/cancel).  
- Audit events concept is present.

---

## Workflow weaknesses

| Issue | Impact |
|-------|--------|
| Diagram shows “Enterprise?” after Start Subscription | Confusing — Enterprise should fork **before** Checkout CTA |
| FO/Complete immediate activation | Honesty risk |
| No chargeback path | Revenue/risk ops blind spot |
| Returning customer assumes Portal competence | Need in-app Billing as primary, Portal secondary |

---

## Recommendation

Amend journeys before Approve. Reorder IA so Enterprise never appears as a Checkout variant.
