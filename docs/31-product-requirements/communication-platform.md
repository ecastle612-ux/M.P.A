# Communication Platform (MHF-001 Detail)

## Status

**CRITICAL — signature M.P.A. feature (requirement, not implementation)**

**Registry ID:** MHF-001  
**Priority:** CRITICAL  
**Target phases:** 10 (Resident Portal), with foundation hooks in Phases 5–9  
**Competitive anchors:** CA-003, CA-004

---

## Problem Statement

Property managers today rely on:

- Printed paper posted in hallways and lobbies
- Ad-hoc mass texting without audit trails
- Email threads that residents never see
- Phone trees for emergencies
- No visibility into who received or read critical notices

This creates **communication debt** (04), erodes resident trust, and wastes PM time on repetitive broadcast labor.

### Product commitment

> Property managers should **never** have to physically post paper announcements for routine communication.

M.P.A. must become the **Digital Announcement Platform** — the default channel for property, building, and emergency resident communication.

---

## User Personas

| Persona | Needs |
|---------|-------|
| Property Manager | Compose, schedule, target, and audit announcements; emergency broadcast; analytics |
| Resident / Tenant | Receive timely notices; set preferences; access bulletin board; acknowledge critical messages |
| Organization Admin | Configure org-wide templates, languages, and integration credentials |
| Maintenance Coordinator | Trigger resident-facing status updates from work orders (workflow-connected) |

---

## Core Capabilities

### 1. Announcement Types

| Type | Scope | Urgency | Channels |
|------|-------|---------|----------|
| Property announcement | All units in property | Normal | Push, email, in-app, bulletin |
| Building announcement | Building/floor subset | Normal | Push, email, in-app, bulletin |
| Emergency notification | Configurable scope | Critical | Push, SMS, email — preference override allowed |
| Scheduled announcement | Any scope | Future-dated | Per schedule at publish time |
| Maintenance update | Unit/resident linked | Normal–High | Push, in-app (from WO workflow) |

### 2. Delivery Channels

| Channel | Requirement |
|---------|-------------|
| Push notifications | Primary for time-sensitive; requires enrollment (QR or portal) |
| In-app notification center | Persistent inbox with read state |
| Email | HTML + plain text; fallback when push unavailable |
| SMS | Emergency and opt-in transactional; Twilio-class integration (INT-302) |
| Community bulletin board | Persistent resident-visible board per property |

**Fallback rule:** If push fails or resident has no app, cascade to email/SMS per preferences (MHF-001).

### 3. Resident Enrollment via QR Code

QR codes are a **signature enrollment mechanism** — bridging physical properties to digital communication.

#### QR code actions (required)

When a resident scans a property QR code, the system must support:

1. **Join a property** — Associate resident identity with correct org/property/unit context
2. **Install or open the app** — PWA install prompt or native app deep link (MOB-*)
3. **Enable push notifications** — Permission flow with clear value proposition
4. **Access community information** — Bulletin board and property-specific content

#### QR code types (planned)

| QR Type | Placement | Resolves to |
|---------|-----------|-------------|
| Property enrollment | Lobby, leasing office | Property join + onboarding |
| Unit-specific | Unit door (optional) | Unit-scoped enrollment |
| Event / temporary | Posters, flyers | Campaign-specific landing |

#### Security requirements

- QR tokens must be org-scoped, optionally expiring, and revocable
- No PII in QR payload — opaque token resolved server-side
- Rate limiting on enrollment to prevent abuse

### 4. Resident Communication Preferences

Residents control:

| Preference | Options |
|------------|---------|
| Channel priority | Push, email, SMS (where enabled) |
| Category subscriptions | Announcements, maintenance, billing, emergencies |
| Language | Per MHF-001 multi-language |
| Quiet hours | Except emergency override |

PMs see aggregate preference coverage ("82% push-enabled") for targeting decisions.

### 5. Read Receipts & Analytics

| Metric | Visibility |
|--------|------------|
| Sent / delivered / failed | PM announcement detail |
| Opened / read | Per channel where technically feasible |
| Acknowledged | Required for select emergency notices |
| Engagement over time | Property and org dashboards |

**Accountability:** PMs must answer "did residents see this?" without manual follow-up.

### 6. Multi-Language Support

| Requirement | Detail |
|-------------|--------|
| Compose once | PM writes in primary language |
| Auto-translate | Integration-assisted translation (INT-304) with human review option |
| Deliver in locale | Resident receives in preferred language |
| Bulletin board | Show locale-appropriate content |

### 7. Scheduled Announcements

- Draft → schedule → auto-publish at datetime
- Timezone-aware per property
- Edit/cancel before publish
- Audit log of schedule changes

---

## Workflow Integration (MHF-003)

Communication is **not a standalone module**. It connects to:

| Workflow | Communication touchpoint |
|----------|-------------------------|
| Move In | Welcome sequence; QR enrollment; lease reminders |
| Rent Collection | Payment reminders; late notices |
| Maintenance | WO status updates to affected residents |
| Move Out | Move-out instructions; deposit timeline |
| Emergency | Weather, safety, building system outages |
| Lease Renewal | Renewal offer notices |

Domain events (ADR-005) trigger automated resident messages where appropriate (AUT-4xx).

---

## Architecture Considerations (Requirements Only)

These are **requirements for future design** — not implementation authorization.

| Concern | Requirement |
|---------|-------------|
| Multi-tenant | All announcements, enrollments, and preferences org-scoped with RLS |
| API-first | Announcement CRUD, delivery, and analytics via API for mobile |
| Event-driven | `announcement.published`, `announcement.read`, `resident.enrolled` events |
| Idempotent delivery | No duplicate sends on retry |
| Edge functions | Delivery orchestration and webhooks in Edge Functions (ADR-007) |
| Storage | Attachments via Supabase Storage (INT-901) |

---

## UX Requirements (Canopy + PX-001)

| Surface | Requirement |
|---------|-------------|
| PM compose | Minimal clicks; templates; preview per channel |
| PM analytics | Read rates visible on announcement detail — not buried report |
| Resident inbox | Clean, mobile-first; clear unread state |
| Bulletin board | Scannable cards; search/filter; pinned notices |
| Emergency mode | Distinct visual treatment; confirmation before send |

---

## Integration Dependencies

| Integration | ID | Purpose |
|-------------|-----|---------|
| Push (FCM/APNs) | INT-301 | Primary delivery |
| SMS (Twilio) | INT-302 | Emergency + fallback |
| Email (SendGrid/Resend) | INT-303 | Fallback + formal notices |
| Translation API | INT-304 | Multi-language |

See [Integration Roadmap](./integration-roadmap.md).

---

## Phased Delivery (Suggested — Requires Gate Approval)

| Stage | Scope |
|-------|-------|
| Foundation | Domain models, event hooks, preference schema design |
| Phase 10A | Resident portal, push enrollment, basic announcements |
| Phase 10B | QR enrollment, bulletin board, scheduling |
| Phase 10C | SMS fallback, multi-language, analytics dashboard |
| Phase 10D | Emergency mode, read receipts, maintenance-linked auto-updates |

Each stage requires its own Design → Document → Approve → Implement cycle.

---

## Success Criteria

| Metric | Target |
|--------|--------|
| PM paper postings for routine comms | Zero |
| Resident enrollment via QR | Primary onboarding path |
| Emergency reach | >95% delivery within 5 minutes |
| Read visibility | PM can see read status without external tools |

---

## Related Documents

- [Must-Have Features](./must-have-features.md) — MHF-001
- [Mobile Roadmap](./mobile-roadmap.md)
- [Automation Roadmap](./automation-roadmap.md) — AUT-4xx
- [Competitive Advantages](./competitive-advantages.md) — CA-003, CA-004
- [04 Communication Pain Points](../04-property-manager-pain-points/index.md)
