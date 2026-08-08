# Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Slice D still fails after recon | Low | High | Recon adds exact missing columns + indexes before D |
| BILL-001 insert fails without `stripe_customer_id` | Medium without trigger | High | BEFORE INSERT/UPDATE sync trigger |
| COM-002 upsert fails on `external_customer_id` NOT NULL | High without trigger | High | Trigger fills from `stripe_customer_id` |
| `organization_id` null breaks BILL-001 composite FK inserts | Low | Medium | BILL-001 always supplies org id; existing FKs unchanged |
| Dual subscription rails confuse operators | Medium | Low | Documented; Master Admin must show both COM-002 org sub + optional BILL-001 sub |
| Unique `organization_id` blocks linking COM-002 customer to org that already has BILL-001 customer | Low (new orgs for Checkout) | Medium | New Checkout creates new org; conflict would surface as upsert error — monitor |
| Null `checkout_session_id` on legacy rows | Certain for 4 rows | None | Expected; not used by BILL-001 |
| Trigger masks divergent Stripe ids | Low | Medium | Trigger only fills **empty** side; does not overwrite both when set |

## Residual risk accepted

BILL-001 `saas_subscriptions` and COM-002 `organization_subscriptions` remain separate. Full commercial unification of subscription rows is **out of scope** for this package.
