# 08 — Provider Comparison

**Package:** API-003  
**Status:** Draft — Ready for Approval

---

## Recommendation

**First production adapter: Checkr** — strong API/webhook model, developer experience, identity + background products, fits `ScreeningProvider` cleanly. TransUnion SmartMove, RentPrep, and Equifax remain first-class **future adapters** behind the same interface.

Final vendor lock is an **Approve** decision (commercial + coverage + counsel).

---

## Comparison matrix

| Criterion | Checkr | TransUnion SmartMove | RentPrep | Equifax |
|-----------|--------|----------------------|----------|---------|
| API maturity | Strong REST + webhooks | Mature rental product; integration varies | Often portal-heavy; API varies | Enterprise credit strength |
| Rental-specific packaging | Good via product config | Purpose-built for rental | Purpose-built for rental | Credit-centric; bundle partners |
| Credit | Via products / partners | Native TU | Via partners/bureaus | Native strength |
| Criminal / eviction | Available | Available | Available | Partner-dependent |
| Identity | Strong | Available | Available | Available |
| Webhook / async | Excellent fit | Supported (confirm per plan) | Confirm per plan | Confirm per plan |
| FCRA tooling | Provider processes + docs | Strong consumer-report heritage | Provider docs | Strong |
| Dev sandbox | Generally good | Varies | Varies | Enterprise onboarding |
| Lock-in risk if called directly | High | High | High | High |
| Fit to M.P.A. abstraction | **Best Phase 1** | Strong Phase 2 | Phase 2/3 | Phase 2/3 |

---

## Selection rationale (Checkr first)

1. Cleaner async webhook lifecycle for Ops “provider failures / turnaround” widgets.  
2. Easier noop→live swap in CI using recorded fixtures.  
3. Avoids forcing TU portal UX into M.P.A. applicant consent flow on day one.  
4. Still leaves SmartMove as the natural alternative for PM brands that require TU branding/data.

---

## Package mapping (design)

Org configures logical packages:

| M.P.A. package | Typical components |
|----------------|--------------------|
| `standard_rental` | ID + credit + criminal + eviction + SOR |
| `guarantor_credit` | ID + credit |
| `occupant_criminal` | ID + criminal + eviction + SOR |

Each maps to provider product IDs in adapter config — **not** in React components.

---

## Failover (future)

- Primary Checkr; secondary SmartMove for designated orgs  
- Never dual-bill without explicit PM action  
- Normalization layer required before any failover UI

---

## Commercial / ops open points (Approve)

- [ ] Fee passthrough vs absorb  
- [ ] Who is “end user” under FCRA for each flow  
- [ ] State coverage gaps for criminal/eviction  
- [ ] SLA for turnaround targets shown in UI
