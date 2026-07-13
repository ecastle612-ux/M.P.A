# 19 — Future Native Mobile Strategy

## Principle

Mobile apps share the **same backend** as the web PWA. No backend rewrite. No mobile-specific business logic. The API-first architecture (Edge Functions + RLS-guarded Supabase client) exists specifically to make this possible.

---

## Platform Choice (Recommended)

| Platform | Technology | Rationale |
|----------|------------|-----------|
| iOS + Android | **Expo (React Native)** | TypeScript continuity, shared validation schemas, team skill match |
| Alternative | Flutter | Only if team has strong Dart expertise |

**Decision gate:** Choose at mobile development start (est. 6–12 months post-launch). ADR required.

---

## What Mobile Shares with Web

| Shared | Not Shared |
|--------|------------|
| Supabase Auth (same identities) | UI components (platform-native) |
| Edge Function API contracts | Navigation patterns |
| Zod validation schemas | Layout / responsive design |
| Domain types (generated DB types) | Service worker / PWA |
| RLS policies (same security) | Server Components / SSR |
| Stripe SDK (mobile-native) | Next.js middleware |
| Domain event consumers | |

---

## Monorepo Migration (Pre-Mobile)

When mobile development begins, extract to Turborepo:

```
mpa/
├── apps/
│   ├── web/              # Existing Next.js app (moved from root)
│   └── mobile/           # Expo app
├── packages/
│   ├── shared/           # Zod schemas, types, constants, utils
│   ├── supabase/         # Typed client helpers, generated types
│   └── ui-tokens/        # Design tokens (platform-agnostic values)
├── supabase/             # Unchanged
└── docs/                 # Unchanged
```

**Migration effort:** 1–2 weeks. Folder boundaries established in Phase 1 make this clean.

---

## Portal → Mobile App Mapping

| Web Portal | Mobile App | Priority |
|------------|------------|----------|
| Vendor portal | Vendor app | P0 — vendors are mobile-first |
| Tenant portal | Tenant app | P0 — maintenance + payments |
| Owner portal | Owner app | P1 — report viewing, approvals |
| PM portal | PM app (limited) | P2 — approvals, notifications, emergency triage |

**PM desktop remains primary.** PM mobile is for on-the-go approvals and emergencies — not full operations.

---

## Mobile-Specific Architecture

### Authentication
- Supabase Auth with deep link callbacks
- Biometric unlock (Face ID / fingerprint) for returning sessions
- Secure token storage (Expo SecureStore)

### Offline Strategy
| Portal | Offline Capability |
|--------|-------------------|
| Vendor | View assigned jobs, capture photos (sync on reconnect) |
| Tenant | View lease info, draft maintenance request (sync on reconnect) |
| Owner | View cached reports |
| PM | View cached queue (read-only) |

No offline mutations with financial impact.

### Push Notifications
- Expo Notifications
- Triggered by domain event consumers (same events as web Realtime)
- Notification → deep link to relevant entity

### Payments
- Stripe mobile SDK for tenant rent payments
- Stripe Connect dashboard deep links for vendors

### Camera / Documents
- Expo Camera for maintenance photos
- Expo DocumentPicker for vendor invoices
- Upload to Supabase Storage (same paths, same RLS)

---

## API Contract Stability

Mobile development is the forcing function for API stability. Before mobile begins:

1. All Edge Functions documented in OpenAPI spec
2. Versioning policy enforced (ADR-007)
3. Contract tests between web and API
4. No breaking changes without version bump

---

## Design Adaptation

| Web Token | Mobile Adaptation |
|-----------|-------------------|
| Color tokens | React Native StyleSheet values from `ui-tokens` |
| Typography scale | Platform-appropriate sizing |
| Spacing rhythm | Same 4px base unit |
| Component patterns | Native equivalents (not web component reuse) |

**Not a port of web UI.** Native feel with M.P.A. identity (colors, typography, patterns).

---

## Timeline

| Milestone | Timing |
|-----------|--------|
| Web PWA commercial launch | Phase 10 (~9 months) |
| Monorepo extraction | Pre-mobile (1–2 weeks) |
| Vendor mobile app | +2–3 months |
| Tenant mobile app | +1–2 months |
| Owner mobile app | +1–2 months |
| PM mobile (limited) | +2–3 months |

---

## Related Documents

- **08** Software Architecture — API-first principle
- **10** API Standards — contracts mobile will consume
- **17** Development Roadmap — phasing
- **ADR-001** — single repo now, monorepo later
