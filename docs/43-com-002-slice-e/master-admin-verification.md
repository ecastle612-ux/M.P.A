# Slice E — Master Admin Verification

| Surface | Path | Verifies |
|---------|------|----------|
| Lifecycle console | `/admin/commercial/lifecycle` | Renewals, grace, failures, recovery, cancel, reactivate, audit, payments |
| Grace sweeper | `POST /api/admin/commerce/lifecycle/enforce-grace` | Day-7 expiration |
| Nav | Commercial → Lifecycle | `MASTER_ADMIN_NAV` |
| Webhook list | Lifecycle filtered SaaS events | Processing observability |

## Checklist

- Renewals observed on payment history / audit
- Grace phase + module access flag
- Failures + dunning email keys
- Recovery to active
- Cancellation (`cancelAtPeriodEnd`) + reactivation
- Webhook processed markers
- Entitlement / limit fields on subscription rows
