# S1 Resident Billing Verification

| Requirement | Status | Surface |
|-------------|--------|---------|
| Current balance | Pass | `/portal/tenant/billing` |
| Upcoming charges | Pass | Portal |
| Payment history | Pass | Portal |
| Pay Now | Pass | Checkout redirect (when Stripe configured) |
| Receipts | Pass | Portal list |
| Recent transactions | Pass | Ledger excerpt |
| Financial notifications | Pass | Written on charge/payment; FO notification center cue |
| Simple language | Pass | No GL/accounting jargon |
| Mobile friendly | Pass | Single-column max-width layout |

Residents without a linked `lease_residents.user_id` see an empty “No billing account yet” state.
