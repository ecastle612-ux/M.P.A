# Phase 12 — Implementation Slices

**Status:** Planned — execute only after gate approval and migration reconciliation (DEV-004).

Estimated total: **8–12 weeks** across slices (team of 1–2).

---

## Slice 0 — Gate & infrastructure (prerequisite)

| Item | Deliverable |
|------|-------------|
| ADR RX-001 | Resident experience architecture accepted |
| Migration reconcile | DEV-004 Option B complete |
| Storage bucket | `org-documents` + RLS policies designed |
| Provider stubs | No-op implementations registered |

**Risk:** Low | **Effort:** 3–5 days

---

## Slice 1 — Person record + timeline foundation

- `person_records` schema + applicant → resident promotion API
- Extended profile sub-domains (contacts, pets, vehicles, employment)
- `entity_timeline_events` projection + subscriber skeleton
- PM UI: person file shell with timeline tab

**Satisfies:** Req 1 (partial), Req 10 (foundation)  
**Risk:** Low | **Effort:** 1–1.5 weeks

---

## Slice 2 — Universal document vault

- `documents` + versions + audit
- Upload/preview/download UI (reuse `@mpa/ui` patterns)
- Entity attach from property, unit, person, lease, WO, vendor
- Permissions via capability model

**Satisfies:** Req 2  
**Risk:** Medium (storage RLS) | **Effort:** 1.5–2 weeks

---

## Slice 3 — Provider abstractions (stubs)

- `SignatureProvider`, `ScreeningProvider`, `PushProvider` interfaces
- In-memory / noop providers for local dev
- Provider registry in `packages/shared` or `apps/web/src/lib/integrations`

**Satisfies:** Req 3–4, 8 (interfaces)  
**Risk:** Low | **Effort:** 3–5 days

---

## Slice 4 — Electronic signatures workflow

- `signature_requests` lifecycle
- PM initiate → resident sign (stub provider) → document vault link
- Lease, renewal, addendum, pet, ACH, rules, inspection templates

**Satisfies:** Req 3  
**Risk:** Medium | **Effort:** 1–1.5 weeks

---

## Slice 5 — Background screening workflow

- Application → authorization → checks → AI summary (existing AI ops) → PM decision
- Results stored on person file; documents in vault

**Satisfies:** Req 4  
**Risk:** Medium (compliance) | **Effort:** 1.5–2 weeks

---

## Slice 6 — Messaging (resident + maintenance)

- Unified `conversation_threads` + `messages`
- Resident ↔ PM, Resident ↔ maintenance (WO-scoped), PM ↔ vendor
- Attachments via document vault; read receipts

**Satisfies:** Req 5, 6  
**Risk:** Medium | **Effort:** 2 weeks

---

## Slice 7 — Community hub + push foundation

- Extend announcements for events, emergencies, office hours
- Web push registration (service worker); quiet hours from preferences
- Delivery abstraction (INT-301 stub)

**Satisfies:** Req 7, 8  
**Risk:** Medium | **Effort:** 1.5 weeks

---

## Slice 8 — Offline operations

- IndexedDB queue, background sync API
- Offline inspection + WO photo capture
- Sync status UI (PM + resident portal)

**Satisfies:** Req 9  
**Risk:** Medium–High | **Effort:** 1.5–2 weeks

---

## Slice 9 — Operations Center + Command Center

- Dashboard widgets: unread messages, pending signatures, screening queue, sync status
- Command Center search providers for persons, messages, documents, screenings

**Satisfies:** Req 11, 12  
**Risk:** Low | **Effort:** 1 week

---

## Slice 10 — Verification & closeout

- Playwright flows: applicant → screening → sign → resident messaging → offline sync
- PRR closeout report, DoD checklist, screenshots

**Risk:** Low | **Effort:** 3–5 days

---

## Rollback strategy (per slice)

- Migrations are forward-only; each slice is independently deployable behind feature flags
- Provider stubs allow disabling external integrations
- Slice N rollback = revert slice N migration + code (prior slices remain)

---

## Verification plan (post-implementation)

```bash
pnpm check:boundaries
pnpm check:circular
pnpm deps:validate
pnpm lint && pnpm typecheck && pnpm build && pnpm test
# Playwright: resident-applicant-flow.spec.ts (to be authored)
```

Responsive: mobile 390, tablet 768, desktop 1440/1920.
