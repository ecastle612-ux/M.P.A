# 51 — Commercial Schema Reconciliation (BILL-001 ↔ COM-002)

Authorized Design + Implementation package to complete Production COM-002 Slice D/E without data loss or hand patches.

## Documents

| Doc | Purpose |
|-----|---------|
| [00-architecture-review.md](./00-architecture-review.md) | Decision: one `saas_customers` table, dual subscription rails |
| [01-compatibility-matrix.md](./01-compatibility-matrix.md) | Field-by-field BILL-001 vs COM-002 |
| [02-authoritative-schema.md](./02-authoritative-schema.md) | Target Production shape |
| [03-migration-strategy.md](./03-migration-strategy.md) | Recon → Slice D → Slice E |
| [04-data-preservation-plan.md](./04-data-preservation-plan.md) | No deletes / derived backfill rules |
| [05-rollback-plan.md](./05-rollback-plan.md) | Forward-fix first; controlled reverse |
| [06-risk-assessment.md](./06-risk-assessment.md) | Risks and residual dual-rail note |
| [07-execution-report.md](./07-execution-report.md) | PASS/FAIL after Production apply + E2E |

## Migration

`supabase/migrations/20260808015000_com_002_bill001_saas_customers_reconciliation.sql`
