# Phase 9 — Resident Communication Platform Foundation

**Status:** Approved · Implemented  
**Registry:** MHF-001 (signature feature)  
**Gate:** Design → Document → Approve → Implement (complete)

## Scope

Digital communication platform replacing paper notices:

- Property QR enrollment (auto-provisioned per property)
- Announcements with targeting, scheduling, publish lifecycle
- Delivery foundation (in-app + push/email/SMS placeholders)
- Read receipts and unread tracking
- Resident portal inbox and notification preferences
- Operations Center communication widget
- Command Center announcement search

## Out of scope (deferred)

- Financials, payment processing
- AI Operations
- Marketplace
- Actual push/SMS/email delivery (INT-301–303)
- Multi-language auto-translate (INT-304)
- Maintenance-linked auto-updates

## Product requirement IDs

| ID | Requirement |
|----|-------------|
| **MHF-001** | Resident Communication Platform (CRITICAL) |
| **CA-003** | Resident QR Enrollment |
| **CA-004** | Digital Announcement Platform |
| **MHF-002, MHF-003, MHF-005** | PM-first, workflow-first, enterprise RLS |
| **PMX-002, PMX-003** | Operations Center + Command Center |

## Database

- `building_qr_codes`
- `resident_communication_channels`
- `resident_devices`
- `notification_preferences`
- `announcements`
- `announcement_recipients`
- `announcement_reads`

Capabilities: `communication:create|read|update|archive|publish|delete`

Migration: `supabase/migrations/20260714230000_phase9_resident_communication_foundation.sql`

## Workflow

```
Property → QR auto-generated → Resident scans → Enrolls
  → PM creates announcement → Publish → In-app delivery
  → Read receipts → Operations Center updates
```
