# 1. World-Class UX Audit

**Parent:** [Launch Stabilization](./index.md)  
**Lens:** Head of Product + UX Director  

---

## Standard

Every screen should feel intentional beside Notion, Linear, Stripe Dashboard, Slack, Shopify Admin: clear hierarchy, one job per view, calm density, trustworthy empty/loading/error states.

---

## Surface scores (staff Property Manager)

| Surface | First impression | Hierarchy | Clarity | Density | Empty/Load/Error | Mobile | Enterprise trust |
|---------|------------------|-----------|---------|---------|------------------|--------|------------------|
| Mission Control | Strong | Strong | Strong | Good | Good | Good | High |
| Properties / PCC | Strong | Strong | Strong | Good | Good (wizard-led empty) | Good | High |
| Residents / RCC | Strong | Strong | Strong | Good | Good | Good | High |
| Leasing | Strong | Strong | Good | Good | Good | Good | High |
| Maintenance CC | Strong | Strong | Good | Dense but operable | Strong | Fair | High |
| Vendors page | Fair | Fair | Honesty redirect | Light | Honesty copy | Good | Medium |
| Financial Operations | Strong | Good | Good | Dense tables | Mixed EmptyState vs `<p>` | Fair (scroll tables) | High if desktop |
| Documents | Strong | Strong | Strong | Good | Strong | Good | High |
| Communications | Strong | Strong | Strong | Good | Strong | Good | High |
| Settings Org / Team | Good | Good | Good | Light | Good | Good | High |
| Guided Setup | Strong | Strong | Strong | Calm | Good | Good | High |
| Launcher | Fair | Fair | OK | Sparse | OK | Good | Medium (utility) |

## Portals

| Portal | Impression | Notes |
|--------|------------|-------|
| Tenant | Good → Strong after copy fix | Clear jobs: billing, maintenance, documents |
| Vendor | Good → Strong after copy fix | Thin nav by design; assignment-driven |
| Owner | Strong | Portfolio + drill-down; honesty copy fixed |
| Manager portal | Fair | Largely superseded by `(app)` PM shell; keep for role switch |

## Master Admin

| Area | Impression | Notes |
|------|------------|-------|
| HQ shell | Strong after mobile menu | “Platform headquarters” framing |
| Launch Readiness | Strong | J0–J8 + Docs/Comms evidence |
| Commercial / Platform | Good | Operator tooling; denser than customer app |
| Testing | Good | Product matrix / impersonation present |

## Cross-cutting UX findings

1. **Scaffold language** eroded trust (metadata, portal subtitles, dashboard placeholder) — remediated.  
2. **Notification badge lag** implied a quiet system when unread existed — remediated.  
3. **Skip link absent** — remediated on primary shells.  
4. **Empty-state vocabulary** still mixed (`EmptyState` vs plain paragraphs) on FO/owner sublists — P2.  
5. **Route-level `loading.tsx` / `error.tsx`** sparse — P2 perception polish.  
6. **Vendors** as honesty redirect feels unfinished vs MCC vendor directory — P2 wording/path clarity (no new feature).  

## Verdict

Staff PM + portals are **launch-credible**. Remaining gaps are polish density and consistency, not missing Customer #1 workflows.
