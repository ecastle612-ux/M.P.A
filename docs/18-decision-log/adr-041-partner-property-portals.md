# ADR-041 — Partner Property-Specific Service Portals

**Status:** Accepted  
**Date:** 2026-08-24  
**Package:** PARTNER-004  
**Supersedes:** none  
**Related:** ADR-038 Partner Program Foundation, ADR-039 Branded Service Request Portals, ADR-040 Partner Command Center

## Decision

M.P.A. will add property-specific public service-request URLs as a second path beside the certified generic partner portal. The relationship is a junction (`platform_partner_property_portals`) from a Partner Program record to a canonical `property_properties` row in the receiving organization. Public URLs use partner slug + property slug only. Conversion of property-portal requests uses the stored canonical property id. Master Admin can disable a property link immediately.

## Consequences

- PM, FO, and Complete reuse the same property table; surface at conversion follows existing entitlement preference.
- Generic `/request/<partnerSlug>` is preserved.
- Public unit selectors that would enumerate residents are out of scope.
- This package is in-repo only and must not be deployed from the implement package.
