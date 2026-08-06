# Launch Readiness Audit — Customer #1

**Status:** Draft — awaiting approval  
**Date:** 2026-08-06  
**Companion:** [Revised CORE Roadmap](./revised-core-roadmap.md)

---

## Classification rules

| Class | Meaning |
|-------|---------|
| **BLOCKER** | Required before first production customer can be onboarded and run core operations without unacceptable risk or workaround |
| **REQUIRED BEFORE FIRST CUSTOMER** | Same as BLOCKER — used interchangeably in this audit for “must ship for Customer #1” |
| **POST-LAUNCH ENHANCEMENT** | Valuable; may be designed now; must not delay Customer #1 |

**Customer #1 success loop (minimum):**

```
Org setup → Property → Lease (SignWell) → Resident active
        → Rent collected → Maintenance executed → Vendor paid/coordinated
        → Owner informed enough to retain
        → Platform billed, monitored, legally covered
```

Facility plant stewardship **improves** that loop later. It is not required to close the first loop unless the signed customer contract says otherwise.

---

## Audit table

| Area | Class | Rationale | Canonical home | Notes |
|------|-------|-----------|----------------|-------|
| **Organization Setup** | BLOCKER | Cannot onboard without org | Identity / Master Admin | Certified foundation — verify production polish + empty states |
| **Role Invitations** | BLOCKER | Team cannot operate solo forever | Identity | Extend existing invite flow; no second invite system |
| **Property Setup** | BLOCKER | No ops without properties | Property Lifecycle | Certified — confirm production checklist completeness |
| **Onboarding Wizard** | BLOCKER | Zero-learning path for first PM org | Cross-cutting (extends Identity + Property) | Guided workflow setup, not feature tour (07) |
| **Demo Data** | BLOCKER | Sales + first-run understanding | Ops tooling / Master Admin | Disposable seed; never mix with prod tenant data |
| **Financial Operations** (rent collection) | BLOCKER | Cash flow is existential (04 P1) | Financial Operations | **Next phase (CORE-L1)** — ledger-ready per ADR-010 |
| **Stripe Production** (payments + Connect as needed) | BLOCKER | Live money | Financial + Billing | Test→live cutover, webhooks, idempotency |
| **Billing** (MPA SaaS subscription) | BLOCKER | We must charge Customer #1 | Platform Billing | Distinct from rent collection rails |
| **Vendor Operations** (minimum) | BLOCKER | Maintenance certified; vendor economic loop incomplete without assign/pay/compliance baseline | Vendor Marketplace | Extend ADR-004; do not fork vendors into Facility |
| **Communications** (contextual minimum) | BLOCKER | Multi-sided product fails silent | Communications | Threads on WO/lease/resident — not orphan inbox-only |
| **Notification Center** | BLOCKER | Attention outside active session | Communications / Ops Console | Feeds Console; no second priority engine |
| **Email Templates** | BLOCKER | Transactional mail for rent, invites, WO status | Communications | Versioned templates; extend > create |
| **Document Operations** | BLOCKER (minimum) | Leases already SignWell; need durable doc home | Document Operations | Consolidate around SignWell + storage; no second e-sign stack |
| **Reporting** (owner/ops minimum) | BLOCKER (thin) | Owner communication is P0 retention (04) | Executive / Owner Reporting | Narrative + status beats vanity analytics |
| **Legal — Privacy Policy** | BLOCKER | Production SaaS requirement | Legal / marketing site | Must be live before paid prod |
| **Legal — Terms** | BLOCKER | Contractual cover | Legal | Must be live before paid prod |
| **Monitoring** | BLOCKER | Blind prod is unacceptable | Platform Ops | Uptime + alerts |
| **Logging** | BLOCKER | Support + incident response | Platform Ops | Structured logs (Edge + app) |
| **Error Reporting** | BLOCKER | Sentry (or equiv.) before paid traffic | Platform Ops | Architecture Improvements #21 |
| **Backups** | BLOCKER | Data durability for paying customer | Platform Ops | Supabase backup policy verified |
| **Accessibility** (launch bar) | BLOCKER (bar) | Certified UX standards; no regression on critical paths | Cross-cutting | WCAG critical-path pass; full audit can deepen post-launch |
| **Performance** (launch bar) | BLOCKER (bar) | Meet **15** on critical PM paths | Cross-cutting | Full portfolio-scale polish can continue post-launch |
| **Customer Support** (minimum channel) | BLOCKER | First customer must reach humans | Support | Email/help alias + escalation path enough for #1 |
| **Executive Operations** | POST-LAUNCH (thin reporting is blocker) | Full exec workspace later | Executive Operations | Minimum owner/PM status reporting ships in Reporting thin slice |
| **Facility Operations** (full workspace) | POST-LAUNCH | First-class architecture; not required for first loop | Facility Operations | See exception below |
| **Inventory** | POST-LAUNCH | Facility-owned; Maintenance must not absorb | Facility | |
| **Asset Management** | POST-LAUNCH | Facility-owned | Facility | |
| **Parts** | POST-LAUNCH | Facility catalog; WO consume later | Facility | |
| **Preventive Maintenance** (programs) | POST-LAUNCH | Facility programs → WO; reactive WO already certified | Facility → Maintenance | |
| **Equipment / Building Systems** | POST-LAUNCH | Asset subtypes under Facility | Facility | |
| **Inspections** (ops programs) | POST-LAUNCH | Lease move-in/out may already exist via Leasing/Resident; ops programs wait | Facility / Move Out | |
| **Safety** (program) | POST-LAUNCH | P0 safety WOs can use Maintenance priority today | Facility | |
| **Compliance** (facility/plant) | POST-LAUNCH | Vendor insurance gates may ship with Vendor Ops | Facility + Vendor | |
| **Operational Readiness** (facility score) | POST-LAUNCH | Stewardship metric | Facility | |
| **Capital Projects** | POST-LAUNCH | Facility-owned; not ticket tags | Facility | |
| **Analytics** (deep) | POST-LAUNCH | Console ≠ analytics (06); deep charts later | Reports / Facility Analytics | |
| **Help Center** | POST-LAUNCH | In-product empty states + support channel enough for #1 | Support / Content | |
| **Search** (⌘K / NL) | POST-LAUNCH | Premium; not required to collect rent | Platform | Foundation may exist; depth later |
| **Mobile** (native) | POST-LAUNCH | Portals responsive; native per **19** | Mobile strategy | |
| **Offline / PWA** | POST-LAUNCH | Phase 10 legacy; not Customer #1 gate | PWA | |
| **M.P.A. Assistant** (depth) | POST-LAUNCH | Embedded AI where certified; assistant expansion later | AI | No chatbot-first |

---

## Facility Operations — explicit call

| Question | Answer |
|----------|--------|
| Architecturally first-class? | **Yes** — not a Maintenance screen (24 / ADR-015) |
| Launch blocker for Customer #1? | **No** (default) |
| Next implementation phase? | **No** |
| When to implement? | After CORE-L1…L7 launch path (see roadmap) as **CORE-L8 Facility Foundation** |

**Contract exception:** If Customer #1’s signed scope **requires** asset registry or PM schedules, ship a **thin Facility Launch Slice** only:

- Asset registry (property → unit → asset)  
- Optional simple PM schedule → existing Maintenance work orders  
- **No** CapEx, no deep inventory/parts, no Facility Analytics, no Safety program module  

That slice still lives under **Facility** nav/home (one capability, one home) — never nested under Maintenance.

---

## Duplicate-system prevention

| Risk | Rule |
|------|------|
| Second e-signature | Forbidden — extend SignWell |
| Vendors inside Facility or Maintenance contacts | Forbidden — Vendor Marketplace home (ADR-004) |
| Inventory under Maintenance | Forbidden — Facility home |
| Parallel notification engines | Forbidden — one Notification Center feeding Ops Console |
| Parallel financial ledgers | Forbidden — `financial_*` append-only (ADR-010) |
| Facility as UDF skin of Maintenance | Forbidden — STD-001 presentation ≠ product ownership |
| Help Center as second docs product before launch | Defer — support channel first |

---

## Blocker list (Customer #1) — condensed

1. Onboarding Wizard + Org Setup polish + Role Invitations verified  
2. Property Setup production checklist (certified — verify)  
3. Demo Data path for sales/onboarding  
4. **Financial Operations — rent collection**  
5. **Stripe Production** (rent + Connect as needed)  
6. **Platform Billing** (MPA subscription)  
7. **Vendor Operations minimum** (assign, compliance gate, pay/invoice baseline)  
8. Communications + Notification Center + Email Templates (transactional)  
9. Document Operations minimum (SignWell + storage consolidation)  
10. Reporting thin slice (owner/PM status)  
11. Legal: Privacy Policy + Terms  
12. Monitoring + Logging + Error Reporting + Backups  
13. Accessibility + Performance launch bars on critical paths  
14. Customer Support minimum channel  

**Not on the blocker list:** full Facility Operations, Inventory, PM programs, CapEx, deep Analytics, Help Center, Search depth, Mobile native, Offline/PWA, Assistant depth.

---

## Related

- [Package index](./index.md)
- [Revised CORE Roadmap](./revised-core-roadmap.md)
- [24 Facility Architecture](../24-facility-operations-architecture/index.md)
