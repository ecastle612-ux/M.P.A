# Phase 12 — Definition of Done

Mandatory closeout checklist per [Definition of Done](../00-governance/definition-of-done.md).

---

## Gate & documentation

- [ ] README status = **Approved**
- [ ] ADR RX-001 accepted
- [ ] PRR index lists satisfied IDs
- [ ] Roadmap amended (Phase 13 or RX-001)
- [ ] Implementation checklist completed

---

## Architecture

- [ ] No duplicate document or messaging systems
- [ ] Applicant → resident uses single `person_record` (no second record)
- [ ] All tables org-scoped with RLS tests
- [ ] Provider abstractions — no hardcoded vendor SDK in UI
- [ ] Domain events emitted for timeline-worthy actions

---

## Capabilities (all twelve)

- [ ] 1 — Digital applicant/resident file with full history domains
- [ ] 2 — Universal document vault (multi-entity, version, audit)
- [ ] 3 — E-sign workflows (stub provider minimum)
- [ ] 4 — Background screening workflow (stub provider minimum)
- [ ] 5 — Resident ↔ PM messaging
- [ ] 6 — Maintenance WO messaging with photos
- [ ] 7 — Community hub (extends announcements)
- [ ] 8 — Push foundation + preferences + quiet hours
- [ ] 9 — Offline queue + sync status
- [ ] 10 — Universal timeline on person, lease, WO records
- [ ] 11 — Operations Center resident ops widgets
- [ ] 12 — Command Center resident-domain search

---

## Verification commands

- [ ] `pnpm check:boundaries` — 0 errors
- [ ] `pnpm check:circular` — 0 errors
- [ ] `pnpm deps:validate` — pass
- [ ] `pnpm lint` — pass
- [ ] `pnpm typecheck` — pass
- [ ] `pnpm build` — pass
- [ ] `pnpm test` — pass
- [ ] Playwright resident flows — pass
- [ ] Screenshots: mobile, tablet, 1440, 1920

---

## Known issues / debt (template)

| Item | Severity | Follow-up |
|------|----------|-----------|
| Real e-sign vendor | Medium | INT-202 integration phase |
| Real screening vendor | Medium | INT-201 integration phase |
| Native mobile push | Low | MOB roadmap |
| OCR / AI doc analysis | Low | AI roadmap post-MVP |

---

## Closeout deliverables

- Executive summary
- Requirement IDs satisfied (with deferred list)
- Files created / modified manifest
- Database, API, UI, workflow summaries
- Provider abstraction summary
- Verification results + Playwright screenshots
- This checklist signed off
