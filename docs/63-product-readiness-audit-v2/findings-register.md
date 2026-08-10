# Findings Register — Product Readiness v2

**Rule:** Collect only. Do not fix until Owner prioritizes.  
**Each finding:** Title · Area · Severity · Route · Screenshot · Root Cause · Recommendation · Smallest Safe Fix · Regression Risk

Screenshot column: `LIVE` = artifact under `/opt/cursor/artifacts/screenshots/product-readiness-v2/`; `CODE` = code evidence only; `AUTH` = needs Owner session.

---

### PRA-001 — Silent email success when Resend unset

- **Area:** Provisioning / Notifications / Owner Ops  
- **Severity:** P0 Critical  
- **Route:** Server: `apps/web/src/lib/saas-provisioning/emails.ts`, `saas-lifecycle/emails.ts`  
- **Screenshot:** CODE  
- **Root Cause:** Missing `RESEND_API_KEY` / `RESEND_FROM_EMAIL` returns `{ ok: true, stubbed: true }`  
- **Recommendation:** Never report success for customer-visible mail when stubbed in production  
- **Smallest Safe Fix:** In production, return `ok: false` (or require explicit `ALLOW_EMAIL_STUB`); surface Resend config on System Health  
- **Regression Risk:** Medium — local/dev email flows must keep an explicit stub mode  

### PRA-002 — FO sidebar links 9 Planned modules

- **Area:** Facility Operations  
- **Severity:** P1 Workflow  
- **Route:** `/facility/operations` … `/facility/building-systems` via `modules.ts` nav  
- **Screenshot:** AUTH  
- **Root Cause:** Commercial IA exposes `readiness: "planned"` in primary nav  
- **Recommendation:** Match Owner Ops rule — nav only if live  
- **Smallest Safe Fix:** Filter `planned` out of `navigationGroupsForSku` (keep routes for direct/entitlement)  
- **Regression Risk:** Medium — FO buyers lose discoverability (mitigate with Mission Control “Coming online” list)  

### PRA-003 — FO module pages “not implemented”

- **Area:** Facility Operations  
- **Severity:** P1 Workflow  
- **Route:** `facility-module-page.tsx`  
- **Screenshot:** AUTH  
- **Root Cause:** Honesty shells behind nav  
- **Recommendation:** Soften + unlink from primary nav  
- **Smallest Safe Fix:** After PRA-002, change copy to “Opens when this module goes live”  
- **Regression Risk:** Low  

### PRA-004 — Resident Packages “Coming soon”

- **Area:** Resident  
- **Severity:** P1 Workflow  
- **Route:** `/portal/tenant`  
- **Screenshot:** AUTH  
- **Root Cause:** Glance card reserved for unfinished feature  
- **Recommendation:** Remove until LIVE  
- **Smallest Safe Fix:** Drop Packages card from home glance  
- **Regression Risk:** Low  

### PRA-005 — Resident Community “Soon” rows

- **Area:** Resident  
- **Severity:** P2 UX  
- **Route:** `/portal/tenant`  
- **Screenshot:** AUTH  
- **Root Cause:** Placeholder community section  
- **Recommendation:** Single honest empty state  
- **Smallest Safe Fix:** Replace three Soon rows with one empty state  
- **Regression Risk:** Low  

### PRA-006 — Vendor/Technician portal too thin for field work

- **Area:** Facility Operations / Resident-adjacent portals  
- **Severity:** P1 Workflow  
- **Route:** `/portal/vendor`  
- **Screenshot:** AUTH  
- **Root Cause:** Nav = home + profile; no bottom actions pattern  
- **Recommendation:** Mobile-first job inbox  
- **Smallest Safe Fix:** Add bottom nav + primary job actions (accept/update/complete) without new domains  
- **Regression Risk:** Medium  

### PRA-007 — Missing route-level loading UI

- **Area:** Cross-app  
- **Severity:** P1 Workflow  
- **Route:** Most `/pm/*` `/facility/*` `/shared/*` `/admin/*`  
- **Screenshot:** CODE  
- **Root Cause:** Only dashboard + financial-operations have `loading.tsx`  
- **Recommendation:** Shared segment skeletons  
- **Smallest Safe Fix:** Add `(app)/loading.tsx` + `(admin)/loading.tsx` using Skeleton  
- **Regression Risk:** Low  

### PRA-008 — Missing shared error boundaries

- **Area:** Cross-app  
- **Severity:** P1 Workflow  
- **Route:** Only `dashboard/error.tsx`  
- **Screenshot:** CODE  
- **Root Cause:** Errors not productized  
- **Recommendation:** Friendly recovery UI  
- **Smallest Safe Fix:** `(app)/error.tsx` + `(admin)/error.tsx` + portal error  
- **Regression Risk:** Low  

### PRA-009 — View As under `/admin/testing/impersonation`

- **Area:** Master Admin  
- **Severity:** P1 Workflow  
- **Route:** `/admin/testing/impersonation`  
- **Screenshot:** AUTH  
- **Root Cause:** Testing path retained after ops rename  
- **Recommendation:** Support-namespaced URL  
- **Smallest Safe Fix:** Add `/admin/support/view-as` + redirect old path; update nav href  
- **Regression Risk:** Medium (bookmarks/middleware)  

### PRA-010 — Support actions require org profile hop

- **Area:** Master Admin / Support  
- **Severity:** P1 Workflow  
- **Route:** `/admin/support` → org profile  
- **Screenshot:** AUTH  
- **Root Cause:** Actions mounted on org profile only  
- **Recommendation:** Deep-link actions from search hits  
- **Smallest Safe Fix:** Support search result → “Open actions” linking to org profile `#support`  
- **Regression Risk:** Low  

### PRA-011 — Finance inputs placeholder-as-label

- **Area:** Reporting / Financial Operations  
- **Severity:** P1 Workflow / A11y  
- **Route:** Finance desks  
- **Screenshot:** CODE  
- **Root Cause:** Placeholder used instead of `<label>`  
- **Recommendation:** Visible labels per Canopy  
- **Smallest Safe Fix:** Add `htmlFor` labels on amount/date fields  
- **Regression Risk:** Low  

### PRA-012 — Maintenance dual-pane desktop-only

- **Area:** Property Manager  
- **Severity:** P1 Workflow  
- **Route:** `/pm/maintenance`  
- **Screenshot:** AUTH  
- **Root Cause:** `xl:grid` side panel  
- **Recommendation:** Detail route below xl  
- **Smallest Safe Fix:** Navigate to work-order detail page on small screens  
- **Regression Risk:** Medium  

### PRA-013 — PM mobile menu is crude `<details>`

- **Area:** Property Manager / Mobile  
- **Severity:** P1 Workflow  
- **Route:** ApplicationShell responsive nav  
- **Screenshot:** CODE  
- **Root Cause:** Fast mobile shortcut  
- **Recommendation:** Drawer with close-on-navigate  
- **Smallest Safe Fix:** Controlled menu using existing Drawer primitive  
- **Regression Risk:** Medium  

### PRA-014 — Screening “Integration Planned” in ops UI

- **Area:** Leasing  
- **Severity:** P1 Workflow  
- **Route:** `/pm/leasing`, application service notes  
- **Screenshot:** CODE  
- **Root Cause:** Sprint 1 honesty leaked as unfinished theater  
- **Recommendation:** Manual screening language only  
- **Smallest Safe Fix:** Relabel to “Screening pending (manual)” — hide “Integration Planned” from primary UI  
- **Regression Risk:** Low  

### PRA-015 — Marketing CTAs bypass Button primitive

- **Area:** Commercial  
- **Severity:** P2 UX  
- **Route:** `/` `/modules` `/pricing`  
- **Screenshot:** LIVE `01-homepage.webp`  
- **Root Cause:** Class-string CTAs  
- **Recommendation:** `@mpa/ui` Button asChild  
- **Smallest Safe Fix:** Wrap primary/secondary links in Button variants  
- **Regression Risk:** Low  

### PRA-016 — Billing page raw buttons

- **Area:** Commercial / Provisioning  
- **Severity:** P2 UX  
- **Route:** `/billing`  
- **Screenshot:** AUTH  
- **Root Cause:** Unmigrated page  
- **Recommendation:** Use Button variants  
- **Smallest Safe Fix:** Swap raw `<button>` → Button  
- **Regression Risk:** Low  

### PRA-017 — Status badge implementations forked (3+)

- **Area:** Consistency  
- **Severity:** P2 UX  
- **Route:** PM / Admin / Resident shells  
- **Screenshot:** CODE  
- **Root Cause:** Local tone maps  
- **Recommendation:** One StatusBadge in `@mpa/ui`  
- **Smallest Safe Fix:** Extract shared mapper; leave colors identical initially  
- **Regression Risk:** Medium  

### PRA-018 — `@mpa/ui` Table unused

- **Area:** Consistency  
- **Severity:** P2 UX  
- **Route:** Admin/finance/marketing tables  
- **Screenshot:** CODE  
- **Root Cause:** Raw HTML tables copied  
- **Recommendation:** Migrate OpsDirectoryTable first  
- **Smallest Safe Fix:** Compose Table primitives inside OpsDirectoryTable  
- **Regression Risk:** Medium  

### PRA-019 — Modal/Drawer unused

- **Area:** Consistency / A11y  
- **Severity:** P2 UX  
- **Route:** Cross-app confirms  
- **Screenshot:** CODE  
- **Root Cause:** Ad hoc overlays  
- **Recommendation:** Use Modal for destructive confirms  
- **Smallest Safe Fix:** Cancel-subscription + assign-WO confirms  
- **Regression Risk:** Medium  

### PRA-020 — Button missing Subtle + loading

- **Area:** Design system  
- **Severity:** P2 UX  
- **Route:** `packages/ui` Button  
- **Screenshot:** CODE  
- **Root Cause:** Primitive incomplete vs Canopy docs  
- **Recommendation:** Add variants  
- **Smallest Safe Fix:** `subtle` + `loading` prop with stable width  
- **Regression Risk:** Medium  

### PRA-021 — Dual search (GlobalSearch + CommandPalette)

- **Area:** Property Manager  
- **Severity:** P2 UX  
- **Route:** App shell  
- **Screenshot:** AUTH  
- **Root Cause:** Two search UIs  
- **Recommendation:** One command palette grammar  
- **Smallest Safe Fix:** Top search opens palette / focuses ⌘K  
- **Regression Risk:** Medium  

### PRA-022 — Marketing tables min-width horizontal scroll

- **Area:** Commercial / Mobile  
- **Severity:** P2 UX  
- **Route:** `/` `/pricing`  
- **Screenshot:** LIVE  
- **Root Cause:** `min-w-[40rem]` comparison tables  
- **Recommendation:** Stacked cards on small screens  
- **Smallest Safe Fix:** `md:hidden` card comparison  
- **Regression Risk:** Low  

### PRA-023 — Flat CTA hierarchy on marketing

- **Area:** Commercial  
- **Severity:** P2 UX  
- **Route:** `/` `/pricing` `/enterprise`  
- **Screenshot:** LIVE `01-homepage.webp` `02-pricing.webp`  
- **Root Cause:** Same visual weight for all actions  
- **Recommendation:** Primary vs secondary elevation  
- **Smallest Safe Fix:** Tokenized shadow/size for primary only  
- **Regression Risk:** Low  

### PRA-024 — Weak trust chrome (logos/testimonials)

- **Area:** Commercial  
- **Severity:** P2 UX  
- **Route:** `/` `/enterprise`  
- **Screenshot:** LIVE  
- **Root Cause:** Marketing sparse by design; competitors lead with proof  
- **Recommendation:** Add proof row without cluttering hero budget  
- **Smallest Safe Fix:** Below-fold logo/testimonial strip (not in first viewport)  
- **Regression Risk:** Low  

### PRA-025 — Pricing lacks “most popular” / savings badge

- **Area:** Commercial  
- **Severity:** P2 UX  
- **Route:** `/pricing`  
- **Screenshot:** LIVE `02-pricing.webp`  
- **Root Cause:** Toggle without savings callout  
- **Recommendation:** Annual save badge  
- **Smallest Safe Fix:** Compute + show save % on annual  
- **Regression Risk:** Low  

### PRA-026 — Inconsistent Confirm CTA labels

- **Area:** Commercial  
- **Severity:** P2 UX  
- **Route:** `/modules` `/pricing`  
- **Screenshot:** LIVE `06-modules.webp`  
- **Root Cause:** “Confirm Plan” vs “Confirm Property Manager”  
- **Recommendation:** One pattern: Confirm {Product}  
- **Smallest Safe Fix:** Copy pass on buttons  
- **Regression Risk:** Low  

### PRA-027 — Login helper copy mechanical

- **Area:** Auth  
- **Severity:** P2 UX  
- **Route:** `/login`  
- **Screenshot:** LIVE `04-login.webp`  
- **Root Cause:** System wording  
- **Recommendation:** Human welcome line  
- **Smallest Safe Fix:** Rewrite one sentence under Sign in  
- **Regression Risk:** Low  

### PRA-028 — Demo page lacks product visuals

- **Area:** Commercial  
- **Severity:** P2 UX  
- **Route:** `/demo`  
- **Screenshot:** LIVE `05-demo.webp`  
- **Root Cause:** Text-only chooser  
- **Recommendation:** Static product stills beside CTAs  
- **Smallest Safe Fix:** Add approved screenshots (no new features)  
- **Regression Risk:** Low  

### PRA-029 — Orphan admin URLs outside slim nav

- **Area:** Master Admin  
- **Severity:** P2 UX  
- **Route:** launch-readiness, catalog, products/*, testing/demo  
- **Screenshot:** CODE  
- **Root Cause:** Historical pages retained  
- **Recommendation:** Internal banner or operator gate  
- **Smallest Safe Fix:** Banner “Internal reference — not in Operations nav”  
- **Regression Risk:** Low  

### PRA-030 — Exit Owner Ops → `/launcher`

- **Area:** Master Admin  
- **Severity:** P2 UX  
- **Route:** MasterAdminShell  
- **Screenshot:** AUTH  
- **Root Cause:** Generic exit target  
- **Recommendation:** Context-aware exit  
- **Smallest Safe Fix:** Exit to `/dashboard` resolver or stay in admin  
- **Regression Risk:** Low  

### PRA-031 — Impersonation banner off-token colors

- **Area:** Master Admin  
- **Severity:** P2 UX  
- **Route:** Global banner  
- **Screenshot:** AUTH  
- **Root Cause:** High-vis warm palette hardcoded  
- **Recommendation:** Tokenized danger/warning strip  
- **Smallest Safe Fix:** CSS variables for impersonation  
- **Regression Risk:** Low  

### PRA-032 — CAD/video placeholder in Documents

- **Area:** Documents  
- **Severity:** P2 UX  
- **Route:** `/shared/documents`  
- **Screenshot:** AUTH  
- **Root Cause:** Format support incomplete  
- **Recommendation:** Disable or “preview later”  
- **Smallest Safe Fix:** Remove CAD/video from upload chooser until ready  
- **Regression Risk:** Low  

### PRA-033 — Vendors hub without directory

- **Area:** Property Manager  
- **Severity:** P2 UX  
- **Route:** `/pm/vendors`  
- **Screenshot:** AUTH  
- **Root Cause:** Intentional thin hub  
- **Recommendation:** Clarify as launchpad, not empty app  
- **Smallest Safe Fix:** Stronger empty/hub copy + links only  
- **Regression Risk:** Low  

### PRA-034 — Module Alignment “not implemented” page exposure

- **Area:** Commercial / Setup  
- **Severity:** P2 UX  
- **Route:** module-alignment page  
- **Screenshot:** CODE  
- **Root Cause:** Architecture page in product chrome  
- **Recommendation:** Gate to setup/docs  
- **Smallest Safe Fix:** Remove from daily paths if linked  
- **Regression Risk:** Low  

### PRA-035 — Mission Control / FO naming overlap

- **Area:** UX wording  
- **Severity:** P2 UX  
- **Route:** Nav labels  
- **Screenshot:** CODE  
- **Root Cause:** Shared “Mission Control” name  
- **Recommendation:** Always prefix product  
- **Smallest Safe Fix:** “PM Mission Control” label  
- **Regression Risk:** Low  

### PRA-036 — Billing loading text only

- **Area:** Commercial  
- **Severity:** P2 UX  
- **Route:** `/billing`  
- **Screenshot:** AUTH  
- **Root Cause:** No Skeleton  
- **Recommendation:** Skeleton + EmptyState on error  
- **Smallest Safe Fix:** Use `@mpa/ui` Skeleton  
- **Regression Risk:** Low  

### PRA-037 — Large client islands (maintainability/perf)

- **Area:** Performance  
- **Severity:** P1 Workflow (perceived)  
- **Route:** mission-control, ops-workspaces, documents  
- **Screenshot:** CODE  
- **Root Cause:** Entire workspace `"use client"`  
- **Recommendation:** Split server shell + islands  
- **Smallest Safe Fix:** Extract one form/queue island at a time  
- **Regression Risk:** High if rushed — **Owner prioritize carefully**  

### PRA-038 — Hardcoded status/urgency hex

- **Area:** Visual Polish  
- **Severity:** P3  
- **Route:** Cross shells  
- **Screenshot:** CODE  
- **Root Cause:** Tokens never for urgency  
- **Recommendation:** `--mpa-color-urgency-*`  
- **Smallest Safe Fix:** Add tokens; replace hex in MC first  
- **Regression Risk:** Low  

### PRA-039 — Tailwind emerald/gray in primitives

- **Area:** Visual Polish  
- **Severity:** P3  
- **Route:** `packages/ui` + desks  
- **Screenshot:** CODE  
- **Root Cause:** Default Tailwind palette  
- **Recommendation:** Map to Mist/Canopy neutrals  
- **Smallest Safe Fix:** Replace gray-50/100 hover with bg-subtle token  
- **Regression Risk:** Low  

### PRA-040 — Avatar forced pill circle

- **Area:** Visual Polish  
- **Severity:** P3  
- **Route:** Avatar primitive  
- **Screenshot:** CODE  
- **Root Cause:** `rounded-full`  
- **Recommendation:** Token radius unless photo exception documented  
- **Smallest Safe Fix:** `rounded-md` default  
- **Regression Risk:** Low  

### PRA-041 — Resident card radius vs ops

- **Area:** Visual Polish  
- **Severity:** P3  
- **Route:** `/portal/tenant`  
- **Screenshot:** AUTH  
- **Root Cause:** Soft portal aesthetic drift  
- **Recommendation:** Align to radius scale  
- **Smallest Safe Fix:** Use token radius classes  
- **Regression Risk:** Low  

### PRA-042 — PlanBadge hidden on small screens

- **Area:** Mobile  
- **Severity:** P3  
- **Route:** Shell  
- **Screenshot:** CODE  
- **Root Cause:** Space saving  
- **Recommendation:** Show in mobile menu  
- **Smallest Safe Fix:** Duplicate plan line in Menu panel  
- **Regression Risk:** Low  

### PRA-043 — Dashboard “Work plane / Attention” jargon

- **Area:** Product Polish  
- **Severity:** P3  
- **Route:** dashboard-shell  
- **Screenshot:** CODE  
- **Root Cause:** Internal language  
- **Recommendation:** Customer words  
- **Smallest Safe Fix:** “Today” / “Needs you”  
- **Regression Risk:** Low  

### PRA-044 — DashboardShellPlaceholder naming

- **Area:** Product Polish  
- **Severity:** P3  
- **Route:** dashboard-shell  
- **Screenshot:** CODE  
- **Root Cause:** Scaffold name  
- **Recommendation:** Rename  
- **Smallest Safe Fix:** Rename component only  
- **Regression Risk:** Low  

### PRA-045 — Thin marketing footer

- **Area:** Commercial  
- **Severity:** P3  
- **Route:** `/`  
- **Screenshot:** LIVE  
- **Root Cause:** Minimal chrome  
- **Recommendation:** Contact + legal denser footer (below fold)  
- **Smallest Safe Fix:** Add support email + privacy links row  
- **Regression Risk:** Low  

### PRA-046 — Enterprise lacks credibility badges

- **Area:** Commercial  
- **Severity:** P3  
- **Route:** `/enterprise`  
- **Screenshot:** LIVE `03-enterprise.webp`  
- **Root Cause:** Copy-only sales path  
- **Recommendation:** Security/process bullets (truthful only)  
- **Smallest Safe Fix:** Add factual trust bullets Owner approves  
- **Regression Risk:** Low  

### PRA-047 — UPPERCASE “INCLUDES (N)” marketing headings

- **Area:** Visual Polish  
- **Severity:** P3  
- **Route:** `/modules`  
- **Screenshot:** LIVE `06-modules.webp`  
- **Root Cause:** Tracking style  
- **Recommendation:** Sentence case  
- **Smallest Safe Fix:** Copy/CSS case change  
- **Regression Risk:** Low  

### PRA-048 — Notification/command raw gray hover buttons

- **Area:** Visual Polish / A11y  
- **Severity:** P3  
- **Route:** Shell chrome  
- **Screenshot:** CODE  
- **Root Cause:** Raw buttons  
- **Recommendation:** Ghost Button + aria-label  
- **Smallest Safe Fix:** Swap components  
- **Regression Risk:** Low  

### PRA-049 — Owner global search vs PM search grammar differ

- **Area:** Consistency  
- **Severity:** P2 UX  
- **Route:** Admin vs App shell  
- **Screenshot:** CODE  
- **Root Cause:** Parallel products  
- **Recommendation:** Same interaction grammar, different datasets  
- **Smallest Safe Fix:** Shared SearchField chrome  
- **Regression Risk:** Low  

### PRA-050 — Complete Platform purchase → FO Planned shock

- **Area:** Workflow / Commercial honesty after login  
- **Severity:** P1 Workflow  
- **Route:** Post-setup FO nav for Complete Platform  
- **Screenshot:** AUTH  
- **Root Cause:** Sell included modules that open “not implemented”  
- **Recommendation:** Sell/nav only live FO depth; list roadmap separately  
- **Smallest Safe Fix:** Combine with PRA-002; Mission Control roadmap panel  
- **Regression Risk:** Medium — messaging must stay constitution-honest  

---

## Counts

| Severity | Count |
|----------|------:|
| P0 | 1 |
| P1 | 14 |
| P2 | 22 |
| P3 | 13 |
| **Total** | **50** |
