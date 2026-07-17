# Phase 10 — Financial Operations Foundation

**Status:** Approved · Implemented  
**Registry:** FEH-801, FEH-802, FEH-805  
**Gate:** Design → Document → Approve → Implement (complete)

## Scope

Financial operations foundation for property managers:

- Rent charges (monthly rent, custom, security deposit)
- Payment recording with partial payment support
- Late fee tracking
- Property expenses (maintenance, vendor bills, utilities, etc.)
- Owner statement generation
- Property budgets (schema)
- Append-only financial activity ledger
- Property financial dashboard
- Operations Center financial widget
- Command Center search (charges, payments, expenses, statements)

## Out of scope (deferred)

- AI Operations, AI expense categorization
- Stripe, Plaid, ACH, payment gateways
- QuickBooks, Xero, AppFolio, Yardi integrations
- Marketplace
- Automated late fee application cron
- Trust accounting / full GL

## Product requirement IDs

| ID | Requirement |
|----|-------------|
| **FEH-801** | Rent ledger and charge lifecycle |
| **FEH-802** | Owner statement summaries |
| **FEH-805** | Late fee foundation |
| **MHF-002, MHF-003, MHF-005** | PM-first, workflow-first, enterprise RLS |
| **PMX-002, PMX-003** | Operations Center + Command Center |

## Database

- `rent_charges`
- `payments`
- `late_fees`
- `expenses`
- `owner_statements`
- `property_budgets`
- `financial_activity`

Capabilities: `financial:create|read|update|archive|delete`

Migration: `supabase/migrations/20260715040000_phase10_financial_operations_foundation.sql`

## Workflow

```
Lease activated → Rent charges generated
  → Payment recorded → Balance updated
  → Expense recorded → Owner statement generated
  → Operations Center updated
```
