# ADR-002: Single PostgreSQL Schema with Table Prefix Namespacing

## Status
Accepted

## Date
2026-07-11

## Context
The initial proposal used multiple PostgreSQL schemas (`property`, `leasing`, `maintenance`, `billing`, `integrations`, `ai`). M.P.A. workflows constantly join across domains. Multi-schema adds `search_path` friction and complicates Supabase type generation without providing service isolation (single database, single service).

## Decision
Use a **single `public` schema** with domain-prefixed table names (`property_properties`, `work_order_requests`, `marketplace_vendors`, etc.).

## Consequences
**Easier:** Simpler migrations, joins, type generation, local debugging.

**More difficult:** No schema-level permission separation. Must rely on RLS and naming discipline. May need schema separation at extreme scale (unlikely before 10K+ orgs).

## Alternatives Considered
- **Multi-schema from day one:** Rejected — premature; workflows are inherently cross-domain.
- **Schema per tenant:** Rejected — operational nightmare at scale.
