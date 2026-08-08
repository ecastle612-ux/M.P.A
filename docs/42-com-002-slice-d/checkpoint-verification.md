# Slice D — Checkpoint Verification

Binding machine (A5):

```
received → customer_linked → org_created → entitled
  → owner_pending → owner_bound → welcome_sent → ready
```

| Checkpoint | Work performed | Audit |
|------------|----------------|-------|
| received | Validate paid purchase; create/link auth identity; upsert saas_customers | Yes |
| customer_linked | Create organization (idempotent); progress email | Yes |
| org_created | Activate purchased SKU + default setup state | Yes |
| entitled | Issue bind token; move to owner_pending | Yes |
| owner_pending | Verification / claim email; wait for owner | Yes |
| owner_bound | Assign Organization Admin membership | Yes |
| welcome_sent | Welcome email | Yes |
| ready | Mark purchase provisioned; continue_setup email; Guided Setup ready | Yes |

Each transition records: `from`, `to`, `at`, `attempt`, optional `reason` / failure.

Operator 9-step checklist maps onto these checkpoints for Master Admin visibility.
