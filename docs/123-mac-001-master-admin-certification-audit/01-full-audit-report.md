# 01 — Master Admin Full Certification Audit

**Package:** MAC-001  
**Status:** Draft — Audit  
**Date:** 2026-08-05  
**Method:** Code + standards evidence (skeptical). No runtime authenticated walkthrough in this session.  
**Branch context:** Includes NAV-001 Workspace Launcher. Does **not** include unmerged STD-001 Class D remount (PR #12).

---

## Section 1 — Master Admin responsibilities

Vision: operate, support, test, monitor, certify, and troubleshoot the entire platform from one hub.

| Responsibility | Reachable? | How | Gap |
|----------------|------------|-----|-----|
| Access every platform dashboard | ⚠ Partial | Workspace Launcher + workspaces; many cards alias same routes | No distinct Regional / Executive / Applicant surfaces |
| Access every operational workspace | ⚠ Partial | Platform · Customers · Operations · Support · Sales · Development · Analytics | HQ-only shell hides Operations workspace |
| Access every portal | ⚠ Partial | Resident / Owner / Manager Test Mode + Open | Vendor Portal retired (by design); Manager portal is stub-ish |
| View every organization | ⚠ Partial | Impersonation Center directory | No dedicated Organizations explorer; scoped to what directory loads |
| View every property | ⚠ Partial | `/properties`, search, Impersonation | Active-org biased; cross-org property browse not first-class |
| View every user | ⚠ Partial | Impersonation people + `/settings/team` | Team is org-scoped; no global user directory |
| View every role | ⚠ Partial | Inside Team settings | No Roles home |
| View every document | ⚠ Partial | `/settings/documents` | Missing from MA-only nav / hub |
| View every audit record | ❌ Fail | Impersonation alias + Recovery privileged audit preview | **No Audit Explorer**; launcher “Audit Explorer” is a mislabel |
| View platform health | ✅ | `/master-admin/health` | Table counts only — not deep SLO/incident HQ |
| View integrations | ✅ | `/settings/integrations` | OK |
| View billing | ⚠ Split | SaaS `/settings/billing` vs ops `/financials` | Two concepts; easy to confuse |
| View support | ⚠ Fragmented | Recovery · inbox · push diagnostics | No Support Dashboard composition |
| View feature flags | ✅ | `/master-admin/flags` | Env presence only |
| View analytics | ⚠ Partial | Insights + ops metrics links | No Analytics hub |
| View reports | ⚠ Partial | `/financials/reports`, facility reports | No MA reports home |
| View migration | ✅ (Class D) | `/migration` | Divergent dashboard on this branch |
| View commercial | ✅ (Class D) | `/master-admin/commercial` | Divergent dashboard on this branch |
| View financial operations | ✅ (Class D) | `/financials` | Divergent dashboard on this branch |

**Missing / weak:** dedicated Audit Explorer, global user/org/property browse, Documents in MA IA, Analytics/Reports hubs, true role-specific dashboards beyond aliases.

---

## Section 2 — Workspace Launcher

### Status vs deprecated launchers

| Deprecated entry | Status |
|------------------|--------|
| MA `/portal` launcher | ✅ Redirect → `#workspace-launcher` |
| `/master-admin/dashboards` | ✅ Redirect |
| Surface Switcher / Portal Testing nav | ✅ Removed for MA |
| Non-MA `/portal` availability | ✅ Preserved |

**Verdict:** NAV-001 largely succeeds at replacing duplicate *pages*. It does **not** yet make every card a truthful role destination.

### Card audit (summary)

| Finding | Severity |
|---------|----------|
| Open / View As / Test Mode wired for all cards | Pass (behavior exists) |
| Test Mode API only for `resident` \| `owner` \| `manager` | Expected |
| Cards with `testModePortal: null` still label button **Test Mode** but silently `Open` live route | **High** — misleading |
| Multiple roles Open to same href (`/dashboard`×3, `/leases`×3, `/financials`×3, `/maintenance`×2, `/master-admin`×2) | Medium — catalog honesty |
| Applicant → `/leases` (likely should be `/applicants`) | Medium |
| Audit Explorer → Impersonation Center | **High** — false capability claim |
| Organization Admin → `/settings` (redirect hub; HQ-only may land Preferences) | Medium |
| Internal Mission Control / Platform Operations duplicate hub Open | Low |
| Grouping matches UX-016 inventory (incl. Accounting + Internal) | Pass |
| Redundant nav mostly cleared for MA | Pass (subnav synonyms remain) |

### Role testing expectation (Section 6 cross-link)

Without authenticated E2E in this session: **code-path likelihood** documented in §6. Several “launches” are aliases, not distinct role canvases.

---

## Section 3 — Authorization

### How MA works today

| Mechanism | Behavior |
|-----------|----------|
| App metadata `dev_master_admin` | Primary grant; middleware **only** checks this for `/master-admin/*` pages |
| `organization_permission_overrides` allow `master_admin` | Accepted by `userHasMasterAdminCapability()` / API gates; **not** by middleware page gate |
| `evaluatePermission` | If `master_admin` in permissions → **all capabilities true** |
| RLS `has_org_capability` | Short-circuits for JWT MA app metadata (ADMIN-003) |
| Impersonation | Real target user membership; cookie session; self-block; audit events |
| Test Mode | Synthetic portal role session; not a separate auth identity |

### Platform vs organization roles

- `master_admin` is a **capability**, not a membership role (AUTH-001).  
- Org roles: organization_admin, property_manager, leasing_agent, facility_technician, tenant, property_owner, vendor.  
- Org Admin inherits PM grants via templates; overrides allow/deny per org.

### A vs B — unrestricted vs always View As

| Option | Meaning |
|--------|---------|
| **A** Unrestricted everywhere | Matches much of current API/RLS for app-metadata MA |
| **B** Always View As | Safer for customer UX; worse for HQ ops (flags, recovery, commercial) |

**Recommendation: Hybrid C (long-term)** — see [03](./03-architecture-recommendation.md):

1. **HQ Operator mode** (unrestricted, heavily audited): Mission Control tools, health, flags, commercial, recovery, directory.  
2. **Customer Surface mode** (View As / Test Mode required): portals and role-product canvases that imply “being” a user.  
3. Never grant MA via ordinary org-manager override writes without platform-breakglass controls.

### Critical auth findings

1. **Middleware ≠ API grant path** — override-granted MA can hit APIs but be bounced from pages (or inverse confusion).  
2. **Org managers can write permission overrides** including `master_admin` capability key → privilege escalation path.  
3. MA permission short-circuit is powerful; acceptable only with breakglass + audit discipline.

---

## Section 4 — Navigation

### Authoritative homes (ARCH-001)

| Capability | Authoritative home today | Duplicate / obsolete |
|------------|--------------------------|----------------------|
| Mission Control | ✅ `/master-admin` | — |
| Workspace Launcher | ✅ section on Mission Control | Deprecated pages redirect |
| Commercial | `/master-admin/commercial` | Class D composition |
| Migration | `/migration` | Class D |
| Financial | `/financials` | Class D |
| Support | Fragmented (Recovery / inbox / push) | No single Support home |
| Portal access | Workspace Launcher + destinations | MA `/portal` deprecated ✅ |
| Surface switching | Workspace Launcher | dashboards redirect ✅ |
| Impersonation | `/master-admin/impersonation` | Subnav “Customers” synonym |

### Remaining friction

- Master Admin **subnav** + **sidebar** duplicate labels (Platform/Health, Providers/Integrations, Demo/Seed).  
- MA-only sidebar uses metaphorical labels (“Waiting on Me”, “High Priority”, “Assigned Today”) mapped to Impersonation / Recovery / Commercial — confusing vs STD-001 Waiting sections.  
- Extra clicks: Mission Control → Class D commercial/financials/migration still feel like separate “apps.”  
- Search sits **above** Greeting (extra chrome before five-second test).

---

## Section 5 — Mission Control as Platform HQ

| Element | Present? | Notes |
|---------|----------|-------|
| Greeting | ✅ | Via UDF |
| M.P.A. Assistant | ✅ | Via UDF |
| Waiting on Me / Others | ✅ | Omit when empty |
| Immediate Attention | ✅ | From operations snapshot |
| Today’s Mission | ✅ | |
| Recommended / Quick Actions | ✅ | Plus duplicate “More Quick Actions” |
| Timeline | ✅ | When activity present |
| Insights | ✅ | Below fold |
| Workspace Launcher | ✅ | After Insights (NAV-001) |
| Platform Health | ⚠ | Insight link + separate tool page |
| Notifications | ⚠ | Shell alerts + push diagnostics tool — not HQ incident feed |
| Universal Search | ⚠ | Useful but **above** STD-001 Greeting |
| Operational Workspaces | ✅ | Supportive catalog |

**Missing for true HQ:** incident/SLO board, global audit stream, cross-org queue, certification checklist surface, honest role canvases, consolidated Support home.

---

## Section 6 — Role testing (code-path audit)

| Role card | Open destination | Distinct canvas? | Test Mode | Likely failure mode |
|-----------|------------------|------------------|-----------|---------------------|
| Organization Admin | `/settings` | No | Fallback Open | Redirect land; not Org Admin UDF home |
| Property Manager | `/dashboard` | Shared | `manager` | HQ-only may bounce to `/master-admin` |
| Regional Manager | `/dashboard` | Alias of PM | Fallback Open | No regional product |
| Maintenance Manager | `/maintenance` | Shared list | Fallback Open | No manager-specific home |
| Technician | `/maintenance` | Shared list | Fallback Open | No tech home |
| Vendor | `/vendors` | Directory | Fallback Open | No vendor portal (by design) |
| Resident | `/portal/tenant` | Yes | ✅ | Demo vs live tenancy branching |
| Owner | `/portal/owner` | Yes | ✅ | **May expose real org properties** (interim scope) |
| Leasing Manager/Agent | `/leases` | Shared | Fallback Open | Alias |
| Applicant | `/leases` | Wrong semantic | Fallback Open | Should likely be `/applicants` |
| Accounting * | `/financials` | Shared Class D | Fallback Open | Alias |
| Support Dashboard | `/master-admin/recovery` | Tool | Fallback Open | Recovery ≠ support inbox HQ |
| Customer Success | `/master-admin/commercial` | Class D | Fallback Open | OK as CS entry if remounted |
| Executive / Portfolio | `/dashboard` / `/properties` | Partial | Fallback Open | No executive product |
| Platform Operations / Mission Control | `/master-admin` | Self | Fallback Open | Redundant |

**Documented failures (design-level):** many roles do not launch distinct experiences; Test Mode label lies for most cards; Owner Test Mode isolation is not certified safe.

---

## Section 7 — Test Mode / sandbox / demo / emergency

| Capability | Status | Production-safe? |
|------------|--------|------------------|
| Portal Test Mode (`resident`/`owner`/`manager`) | Implemented | ⚠ **Not fully** — banner claims simulation; loaders often hit live services; owner interim scope can show all org properties |
| Impersonation | Implemented | ⚠ Powerful but audited; cookie 8h; DB row no hard expiry |
| Demo seed (`/master-admin/testing`) | Implemented | ⚠ Destructive utilities — MA-gated |
| Emergency recovery | Implemented | ⚠ Intended breakglass; service-role mutations + privileged audit |
| Sandbox org isolation | Unclear / incomplete | ❌ No certified sandbox boundary separate from production org data |

**Verdict:** Test Mode is an **operator preview aid**, not a certified production-safe sandbox. Do not market as “simulated only” until data isolation is proven.

---

## Section 8 — Security

| Control | Status | Notes |
|---------|--------|-------|
| RBAC | ⚠ | MA short-circuit bypasses fine-grained checks when capability present |
| Organization isolation | ⚠ | Active-org model + MA cross-tooling; recovery can target orgs |
| Tenant isolation | ⚠ | Owner Test Mode interim scope risk |
| Audit trails | ⚠ | Session start/end/page_visit; insert errors not checked; not all sensitive actions guaranteed logged |
| Impersonation logging | ✅ Baseline | Start/end + banner page visits |
| Session security | ⚠ | HttpOnly cookie; Secure in prod; SameSite=Lax; no DB TTL enforcement |
| API authorization | ⚠ | Middleware/API grant mismatch; MA API access is broad |

**Critical security items:** override escalation path; middleware inconsistency; Test Mode data leakage risk.

---

## Section 9 — User experience

| Dimension | Assessment |
|-----------|------------|
| Clicks to Test Mode (Resident) | Improved by NAV-001 (~2 from hub) |
| Navigation clarity | Still dual chrome (sidebar + HQ subnav) |
| Redundant pages | Launchers largely gone; Class D homes remain |
| Context switching | High when leaving hub into Class D / settings tools |
| Search | Valuable; placement competes with Greeting |
| Quick actions | Duplicated (UDF + More) |
| Assistant usefulness | Present; quality depends on snapshot signal richness |
| Workspace Launcher usability | Good structure; honesty problems on Test Mode + aliases |
| Recommendations | Present via Assistant |

**Operator efficiency:** workable for an expert who knows aliases; **not** yet a calm Platform OS for a new operator.

---

## Section 10 — Compliance

| Standard | Verdict | Notes |
|----------|---------|-------|
| STD-001 | ⚠ Warning | Mission Control UDF OK; Search-before-Greeting deviation; Class D commercial/financials/migration on this branch |
| ADR-033 | ⚠ | Inheritance law OK; residual parallel dashboard debt exists |
| ARCH-001 | ⚠ | Hub consolidation advanced; synonym subnav + false capability labels remain |
| NAV-001 | ✅ Pass (core) | Redirects + embed shipped; honesty of cards incomplete |
| UX-016 | ⚠ | Certified closed; Mission Control search placement contradicts Slice B “below framework” note |
| AUTH-001 | ⚠ | Role surfaces + recovery exist; MA grant/escalation posture needs hardening |
| OPS-001 | ⚠ | Command Center vision for role homes; Master Admin HQ is adjacent, not fully the Universal Command Center for platform ops |

---

## Certification conclusion

Master Admin is **directionally correct** (one hub, launcher embedded, impersonation/recovery real) but **not certification-ready** as the definitive operational headquarters until Critical/High issues in [02](./02-issues-register.md) are remediated under gate.
