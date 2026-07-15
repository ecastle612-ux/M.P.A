# Mobile Roadmap (MOB)

## Status

**Permanent — mobile and PWA requirements**

M.P.A. delivers mobile experiences through **PWA-first web** (current) and **future native apps** (Expo) sharing the same API-first backend (MHF-005).

Source: [19 Future Native Mobile Strategy](../19-future-native-mobile-strategy/index.md), MHF-001 QR enrollment

---

## Mobile Strategy Principles

| Principle | Requirement |
|-----------|-------------|
| Shared backend | Web and mobile use identical API contracts |
| Plane-aware apps | PM, vendor, and resident experiences respect four-plane auth |
| Offline where it matters | Field work (inspections, vendor jobs) — not all CRUD |
| PWA as foundation | Current `apps/web` PWA validates flows before native investment |
| QR as bridge | Physical enrollment connects to mobile push (MHF-001) |

---

## Application Surfaces

| App | Primary users | Priority | Strategy |
|-----|---------------|----------|----------|
| Property Manager (mobile web → native) | PM staff | HIGH | PWA now; native Phase 11+ |
| Resident / Tenant | Residents | CRITICAL | Required for MHF-001 push + QR |
| Vendor / Field | Vendors, inspectors | HIGH | Offline-capable jobs |
| Owner | Property owners | MEDIUM | Read-heavy; responsive web sufficient initially |

---

## Capability Requirements

### MOB-001 — PWA Install & Offline Shell

**Priority:** HIGH · **Status:** Foundation in `apps/web`

| Requirement | Detail |
|-------------|--------|
| Installable PWA | Add to home screen on iOS/Android |
| Offline shell | App loads with cached shell when network unavailable |
| Service worker | Cache strategy for static assets |
| Push registration | Web push where platform supports (resident enrollment) |

### MOB-002 — Resident Mobile Experience (MHF-001 Enabler)

**Priority:** CRITICAL · **Phase:** 10

| Requirement | Detail |
|-------------|--------|
| QR deep link | Scan → enroll → app open/install |
| Push notification receive | FCM/APNs via PWA or native |
| Announcement inbox | Read, acknowledge, filter |
| Bulletin board | Mobile-optimized community surface |
| Maintenance request | Photo upload, status tracking |
| Preference management | Channel, language, quiet hours |

### MOB-003 — Offline-Capable Inspections

**Priority:** HIGH · **Phase:** 6  
**Competitive anchor:** [CA-007 Offline-Capable Inspections](./competitive-advantages.md#ca-007-offline-capable-inspections)

| Requirement | Detail |
|-------------|--------|
| Offline form capture | Inspection checklist without connectivity |
| Photo queue | Capture locally; sync when online |
| Conflict resolution | Last-write-wins with audit on sync |
| GPS/timestamp metadata | Optional evidence attachment |

### MOB-004 — Vendor Field App

**Priority:** HIGH · **Phase:** 7

| Requirement | Detail |
|-------------|--------|
| Job list and acceptance | Vendor plane auth |
| Status updates from field | En route, on site, complete |
| Photo documentation | Work evidence |
| Offline job detail | Cached work order for basement/garage sites |
| Push for new assignments | Real-time dispatch |

### MOB-005 — Property Manager Mobile Actions

**Priority:** MEDIUM · **Phase:** 11+

| Requirement | Detail |
|-------------|--------|
| Action queue on mobile | Approve, assign, respond |
| Emergency announcement trigger | Fast path for MHF-001 emergency |
| Quick property/unit lookup | Search-first mobile UX |
| Biometric auth | Face/Touch ID where available |

### MOB-006 — Native App (Expo)

**Priority:** MEDIUM · **Phase:** Post-PWA validation

| Requirement | Detail |
|-------------|--------|
| Expo monorepo app | `apps/mobile` placeholder → production |
| Shared packages | `@mpa/ui`, `@mpa/shared`, Supabase client |
| App store distribution | iOS App Store, Google Play |
| Deep linking | QR codes open native app when installed |
| Unified push | Native push replaces/supplements web push |

Reference: [19 Future Native Mobile Strategy](../19-future-native-mobile-strategy/index.md)

---

## QR Code Mobile Flow (MHF-001)

```
┌─────────────┐     scan      ┌──────────────┐
│  QR poster  │ ────────────► │ Landing URL  │
│  (property) │               │ (org token)  │
└─────────────┘               └──────┬───────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
              PWA install       Native app       Web fallback
              prompt            deep link        responsive portal
                    │                │                │
                    └────────────────┼────────────────┘
                                     ▼
                            Resident enrollment
                            Push permission
                            Bulletin access
```

---

## Technical Requirements

| ID | Requirement |
|----|-------------|
| MOB-T01 | API-first — no mobile-only business logic in client |
| MOB-T02 | Org-scoped auth tokens; secure storage on device |
| MOB-T03 | Image compression before upload on mobile networks |
| MOB-T04 | Background sync for offline queues |
| MOB-T05 | Accessibility — touch targets, screen reader (PX-001) |

---

## Sequencing

| Stage | Deliverable |
|-------|-------------|
| Current | PWA shell, responsive PM/resident web |
| Phase 6 | Offline inspection prototype (PWA or native pilot) |
| Phase 7 | Vendor field mobile |
| Phase 10 | Resident PWA + push + QR (MHF-001) |
| Phase 11+ | Native Expo apps if PWA limits reached |
| Phase 12 | App store hardening, performance |

---

## Related Documents

- [Communication Platform](./communication-platform.md)
- [Must-Have Features](./must-have-features.md) — MHF-001, MHF-005
- [Competitive Advantages](./competitive-advantages.md) — CA-003, CA-007
- [19 Future Native Mobile Strategy](../19-future-native-mobile-strategy/index.md)
