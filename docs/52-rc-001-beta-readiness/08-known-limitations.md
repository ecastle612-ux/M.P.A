# 08 — Known Limitations (Design Partner Pack)

**Package:** RC-001  
**Audience:** Design Partners (must acknowledge before onboarding)

---

## In scope for Design Partner beta

- Property manager web app: properties, units, tenants, leases, applicants  
- Background screening (sandbox/noop or Checkr sandbox)  
- Electronic signatures (sandbox/noop or Dropbox Sign test)  
- Maintenance + vendor assignment (from PM app)  
- Financial charges, manual + resident portal payments (Stripe test / noop)  
- Announcements, messaging, in-app notifications (optional push)  
- Migration Center imports  
- Operations Center + Command Center  
- Resident portal: payments, announcements, messages, preferences  

---

## Explicitly out of scope

| Limitation | Notes |
|------------|-------|
| Owner portal business workflows | Shell only |
| Vendor portal business workflows | Shell only — vendors managed from PM app |
| Offline field sync / upload queue | PWA caches static assets + offline page only |
| Full general ledger / trust accounting | Deferred (ADR-010) |
| Bank reconciliation / QuickBooks sync | Future |
| Listing syndication (Zillow, etc.) | Future |
| Native iOS/Android apps | Responsive web / PWA only |
| Production SMS / transactional email at scale | Limited; prefer in-app + optional push |
| AI autonomous financial or messaging actions | AI is human-gated only |
| Media DAM / library UI | Upload attached to entities |
| Multi-PSP failover | Stripe (or noop) only in Phase 1 |

---

## Provider defaults

Local/CI defaults use `noop` providers. Design Partner environments that need real rails must configure sandbox keys (see Administrator Guide). **Never use production PSP keys during Design Partner beta without written approval.**

---

## Scale guidance

Recommended: **&lt; 50 units** per Design Partner org during beta. Larger portfolios may work but are uncertified.

---

## Acknowledgment

Design Partner acknowledges these limitations and agrees beta feedback will prioritize workflow truth over feature parity with AppFolio/Buildium/DoorLoop.
