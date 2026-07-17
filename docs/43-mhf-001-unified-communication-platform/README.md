# MHF-001 — Unified Communication Platform (Extension)

**Status:** Approved (foundation extension)  
**Baseline:** [Phase 9](../29-phase-9-resident-communication-foundation/README.md) — announcements, QR, read receipts (implemented)

## This initiative adds

- Workflow-linked conversation threads (not standalone chat)
- Unified in-app notification center
- Community hub (extends announcements)
- Message read/delivery status, attachments via vault
- Notification provider abstraction (stub — no SMS/email/OneSignal yet)
- Ops Center + Command Center integration

## Follow-on (not part of this package)

Production OneSignal push is designed in **[API-001](../44-api-001-onesignal-notification-foundation/README.md)** (Draft — awaiting Approve) with [ADR-017](../18-decision-log/adr-017-onesignal-as-primary-push-provider.md) (Proposed). Until API-001 is Approved → Implemented, OneSignal remains out of scope for this foundation package.

## Out of scope

SMS, email, OneSignal (until API-001), AI auto-responses, OCR, video/voice

## PRR

MHF-001 (CRITICAL), MHF-003, MHF-008, CA-004, INT-301 (stub)
