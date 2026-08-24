# ADR-040 — Partner Command Center

**Status:** Accepted  
**Date:** 2026-08-24  
**Package:** PARTNER-003  
**Supersedes:** none  
**Related:** ADR-038 Partner Program Foundation, ADR-039 Branded Service Request Portals

## Decision

M.P.A. will ship an authenticated Partner Command Center at `/partner` for ordinary partner operations. Access uses existing M.P.A. Auth, organization membership, SKU entitlement `platform.partner_services`, and the receiving-organization binding on `platform_partners`. Master Admin remains authoritative for approval, rates, suspension, and PAID ledger marking. Command Center reads the PARTNER-001 commission ledger and does not move money.

## Consequences

- Partners retrieve their own service-request link, referral link, and QR without Master Admin.
- Cross-partner isolation is a P0 invariant.
- A future payout package requires separate Owner authorization.
- This package is in-repo only and must not be deployed from the implement package.
