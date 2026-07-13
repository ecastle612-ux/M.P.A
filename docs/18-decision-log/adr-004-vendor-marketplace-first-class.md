# ADR-004: Vendor Marketplace as First-Class Domain

## Status
Accepted

## Date
2026-07-11

## Context
The initial architecture treated vendors as contacts on work orders. The product philosophy defines the Vendor Marketplace as core infrastructure. Vendors have cross-organization identity, compliance requirements, reputation, bidding, and Stripe Connect payouts — a fundamentally different data shape than PM org records.

## Decision
Vendor marketplace is a **first-class domain** with global vendor identity (`marketplace_vendors`), separate from any single PM organization. PM orgs link to vendors via `marketplace_org_vendor_links`. Dedicated vendor portal route group.

## Consequences
**Easier:** Marketplace scales independently, vendor reputation works cross-org, Stripe Connect payouts are clean.

**More difficult:** Cross-org RLS policies are more complex. Vendor data governance requires platform-level administration.

## Alternatives Considered
- **Vendor as org sub-record:** Rejected — prevents marketplace economics and cross-org reputation.
- **Separate vendor application:** Rejected — fragments the operating system UX.
