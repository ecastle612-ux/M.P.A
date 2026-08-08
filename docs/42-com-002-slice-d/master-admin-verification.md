# Slice D — Master Admin Verification

| Surface | Path | Verifies |
|---------|------|----------|
| Provisioning console | `/admin/commercial/provisioning` | Jobs, checkpoints, 9-step progress, audit, customers, provisioned purchases |
| Retry | `POST /api/admin/commerce/provisioning/retry` | Operator resume for `failed_retryable` / `failed_dead` |
| Nav | Commercial → Provisioning | `MASTER_ADMIN_NAV` aligned |
| Checkout console | `/admin/commercial/checkout` | Still shows purchases/webhooks; points to Slice D for provisioning |

## Checklist coverage

- Stripe purchase linkage (session / customer / subscription ids on job)
- Identity (`ownerUserId` / saas_customers)
- Organization id
- Activation via entitled checkpoint
- Checkpoint progress + operator steps
- Retries / attempt count
- Compensation via forward repair (no destructive paid-org delete)
- Audit trail
- Failure recovery messaging
