# Master Admin Verification — SaaS Checkout

**Surface:** `/admin/commercial/checkout`

| Check | Pass criteria |
|-------|---------------|
| Flags | sliceC true; foReady false; sliceD false |
| Offer table | 4 PM offers + env keys + validation |
| Purchases | Shows in-memory completed/created rows; provisioned=false |
| Webhooks | Lists SaaS events for this instance |
| Checklist | Success / cancel / webhook / duplicate / offer validation |

Nav: Commercial → Checkout (`MASTER_ADMIN_NAV`).
