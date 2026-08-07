# Provisioning Audit — COM-002

## Strengths

- Clear happy path after Checkout.  
- Idempotency key `provision:org:{checkout_session_id}`.  
- Shared entitlement apply path for Enterprise operators.  
- Guided Setup handoff concept (pre-satisfy org/plan).  
- Reconciler for paid-but-missing-org.

---

## Race conditions (must design — A2)

| Race | Failure mode | Required control |
|------|--------------|------------------|
| Success redirect before webhook | User sees empty / error | Success page polls by `session_id`; show “preparing workspace” |
| Webhook before auth user exists | Owner bind pending | Explicit `pending_owner_email` state; claim with verified login |
| Double webhook | Duplicate org | Idempotency (stated) — add unique DB constraint on session id |
| User refreshes bind page | Duplicate auth attempts | Idempotent bind |
| Two Checkouts same email | Two orgs | Policy: allow multi-org **or** block second self-serve ownership |

---

## Rollback / compensation (A5 — blocking)

Retry-only is insufficient.

| Failed step | Compensating action |
|-------------|---------------------|
| Org created, entitlement apply fails | Retry apply; do not create second org |
| Entitlements on, email fails | Keep org; retry email; support resend |
| Stripe paid, org create permanently fails | Alert Sev-1; reconciler; manual repair tool |
| User abandons account bind | Retain org `unclaimed` N days; then suspend + notify; never leave entitled anonymous access |
| Wrong price metadata | Fail closed; do not guess entitlements |

Document **checkpointed job state machine**: `received → customer_linked → org_created → entitled → owner_pending → owner_bound → welcome_sent → ready`.

---

## Defaults missing

Provisioning should set:

- Timezone / locale defaults  
- Currency (platform + FO money if PM)  
- Notification defaults  
- Empty Mission Control attention rules still valid  
- Company name validation (abuse strings)

---

## Module activation challenge (A1)

“Automatic module activation” for FO/Complete is commercially dangerous while FO features are shells. Provisioning must activate **only certified self-serve offers**.

---

## Guided Setup / Mission Control

Handoff is right. Missing: what if customer never completes Guided Setup but subscription is active? (Allow MC with Setup banner — recommended.)

---

## Notifications / audit / email

Present at catalog level; need event list tied to provisioning checkpoints and failure pages.

---

## Verdict

Provisioning architecture is the right shape. **Approve only with** race+compensation state machine and FO offer constraints.
