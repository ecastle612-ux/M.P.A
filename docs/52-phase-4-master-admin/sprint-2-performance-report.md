# Sprint 2 — Performance Report

**Date:** 2026-08-09  
**Surfaces:** Platform Operations workspaces (Master Admin only)

| Topic | Notes |
| --- | --- |
| Data load | Single `loadOpsDirectories()` per page; parallel org/membership/invite/subscription queries; capped lists (orgs ≤200, memberships ≤300 via query patterns + purchase/webhook limits) |
| Client filtering | Search/filter run in-browser over already-loaded rows — no extra network round-trips |
| Bundle | New client island: `ops-directory-table` + workspace views; shared with server-loaded props |
| Caching | No new cache layers; service-role preferred when available (same pattern as Sprint 1) |
| Customer impact | None — admin-only routes behind existing operator gate |

**Result:** Acceptable for operator scanning; no customer-path performance risk.
