# 02 — Navigation

**Package:** OWNER-001  
**Status:** Approved · Phase 1 ✅ COMPLETE  
**Section:** §5 Navigation

---

## Principles

1. Owner Portal is the **primary destination** after owner login (role-aware resolver already routes `property_owner` → `/portal/owner`).  
2. Navigation must feel complete for commercial owners without copying the full PM Operations Center.  
3. Align with UX principles target IA (`Properties → Reports → Approvals → Messages`) while adapting Approvals to **out of scope** for MVP (no owner maintenance approvals).  
4. Reuse portal shell chassis (`RolePortalFrame` / approved mobile drawer patterns from UX-008). Do **not** invent a separate design system.  
5. Mobile prioritizes Financial Summary, Messages, Documents, Statements.

---

## Desktop navigation

Primary nav items (order binding for Draft):

| Order | Label | Destination (logical) | Job |
|------:|-------|----------------------|-----|
| 1 | **Dashboard** | Owner Home | Portfolio performance + attention |
| 2 | **Properties** | Properties list → Property View | Asset drill-down |
| 3 | **Financials** | Financial Summary (default) | Income / expenses / net / payouts placeholders |
| 4 | **Documents** | Document library | Vault-backed files |
| 5 | **Messages** | Inbox / threads | Read + reply |
| 6 | **Reports** | Owner-facing report list / statement reports | ReportingService outputs |
| 7 | **Settings** | Profile + notification preferences | Identity / prefs only |

### Desktop secondary affordances

- **Notifications** — shell notification center (not a primary nav peer unless badge density requires it).  
- **Organization switcher** — existing multi-org switch when the owner belongs to multiple orgs.  
- **Command / search** — reuse existing shell search if available; do not invent owner-only search architecture.  
- **Announcements** — surfaced on Dashboard and optionally under Messages or a Communications subsection; not required as a seventh top-level peer if Messages + Home cover discovery.

### Desktop IA notes

- **Financials** contains tabs or sub-nav: Summary · Statements · Receipts / Payment History · Payouts (placeholder).  
- **Reports** must not fork a second PDF pipeline; it is a consumer of FIN-001 / Phase 10 outputs.  
- **Settings** excludes PM org admin, billing SaaS, team invites, and Stripe Connect onboarding.

---

## Mobile navigation

### Priority (binding)

| Priority | Surface | Rationale |
|----------|---------|-----------|
| **P0** | Financial Summary | Owners check money first |
| **P0** | Messages | Two-way communication |
| **P0** | Documents | Self-serve files |
| **P0** | Statements | Most common financial document (may live under Financials or Documents with a pinned entry) |
| **P1** | Dashboard (condensed) | Orientation; may share home with financial strip |
| **P2** | Properties / Property View | Secondary drill-down |
| **P2** | Reports (full catalog) | Secondary to Statements |
| **P2** | Settings | Infrequent |

### Mobile presentation

**Approve amendment (2026-07-22):** Mobile uses **bottom navigation**:

| Tab | Destination |
|-----|-------------|
| Home | Dashboard |
| Properties | Properties list |
| Financials | Financial summary |
| Messages | Messages inbox |
| More | Documents · Reports · Settings |

- Desktop retains the seven-item side navigation.  
- First mobile viewport after login: Dashboard with stacked metric + activity widgets.  
- Avoid dense multi-card dashboards; one composition, clear hierarchy (DPX-003 / Canopy).  
- Thumb-reachable primary actions via bottom tabs.  

---

## Route philosophy (design-level, not implementation)

Logical destinations under the owner portal root (illustrative; **no routes are created by this Draft**):

```
/portal/owner                     → Dashboard (Home)
/portal/owner/properties          → Properties list
/portal/owner/properties/:id      → Property View
/portal/owner/financials          → Financial Summary
/portal/owner/financials/statements
/portal/owner/documents
/portal/owner/messages
/portal/owner/reports
/portal/owner/settings
```

Implementation may map these to existing shared surfaces with owner framing **only after Approve**. Until then, these paths are design contracts only.

---

## Navigation non-goals

| Forbidden | Why |
|-----------|-----|
| Full PM Operations Center mirrored for owners | Cognitive overload; wrong role |
| Owner Approvals nav item in MVP | Maintenance approvals = Future Release |
| Payouts as live money movement entry | FIN-003 |
| Expanding global app sidebar for owners outside portal shell | Keep owner IA inside Owner Portal |
