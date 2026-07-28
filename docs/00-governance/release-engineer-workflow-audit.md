# Release Engineer Workflow Audit

**Type:** Read-only diagnosis + release safety plan (no code changes performed)  
**Date:** 2026-07-24  
**Role:** Release Engineer  
**Scope:** Stabilize development/deployment workflow; preserve existing functionality  
**Policy:** [Implementation Gate](./implementation-gate.md) · no feature work · no architecture merge · no deploy

---

## 1. Executive Summary

Local development and Production diverge because **the production ship branch (`checkpoint/pre-phase5`) is also the mega WIP sandbox**. At audit time:

| Signal | Value |
|--------|-------|
| Working tree dirty paths | **176** (71 modified, 105 untracked, **0 staged**) |
| HEAD / origin / Production SHA | **`c0e1a0d`** (aligned with each other) |
| Production branch | `checkpoint/pre-phase5` → Vercel project `m-p-a-web` |
| Local architecture | **ShellProviders + `@mpa/ui/shell`** (uncommitted) |
| Production architecture | **Root `AppProviders` + `@mpa/ui`** (committed) |
| Clean SHA gate | `pnpm install` ✅ · `typecheck` ✅ · `build` ✅ · `lint` ❌ (28 pre-existing errors) |
| CI coverage on ship branch | **None** (CI runs on `main` + PRs only) |

**Verdict:** Production *committed* code is shippable for hotfixes **if** taken from a **clean checkout** of `origin/checkpoint/pre-phase5`. The **local working tree is not a safe source of truth** and will keep creating “hidden issues” until WIP is parked off the ship lane.

**Single source of truth for providers (until an approved package lands):**  
**Production / ship lane = root `apps/web/src/app/providers.tsx` (`AppProviders`) + `ThemeProvider` / `useTheme` from `@mpa/ui`.**  
The ShellProviders / `@mpa/ui/shell` split is **WIP only** and must not be mixed into hotfixes.

---

## 2. Current Risks

### R1 — Mega WIP on the ship branch (Critical)

- **71** modified + **105** untracked files on `checkpoint/pre-phase5`.
- Untracked clusters include AUTH-001, OPS-001, COM-001, owner-portal expansions, shell provider split, and **8 uncommitted Supabase migrations**.
- Agents/humans editing “what’s open in the editor” often touch WIP, then cherry-pick or deploy against HEAD → **local ≠ prod**.

### R2 — Dual provider architectures (Critical)

| Layer | Production (`c0e1a0d`) | Local working tree |
|-------|------------------------|--------------------|
| Root layout | Wraps children in `AppProviders` + SW | SSR theme only; **no** root providers |
| App / portals | No `ShellProviders` | `(app)` + `(portals)` use `ShellProviders` |
| Theme import | `@mpa/ui` | WIP `app-providers.tsx` uses `@mpa/ui/shell` |
| Package exports | `"."` only | Adds `./shell`, `./auth`, `./cn`, `./tokens` |
| Duplicate modules | `app/providers.tsx` only | Also untracked `shell/app-providers.tsx`, `shell/shell-providers.tsx`, `packages/ui/src/shell.ts` |

**Risk:** Theme toggle / settings / auth chrome can “work” locally and fail (or no-op) in Production, or the reverse.

### R3 — CI does not guard the Production branch (High)

`.github/workflows/ci.yml` triggers on:

- `pull_request`
- `push` to **`main` only**

Production ships from **`checkpoint/pre-phase5`** via Vercel (often API/manual). **No automated typecheck/build gate** on the ship branch.

### R4 — Lint fails on the production SHA (Medium)

Clean worktree at `c0e1a0d`:

- `pnpm install --frozen-lockfile` → **pass**
- `pnpm --filter @mpa/web typecheck` → **pass**
- `pnpm --filter @mpa/web build` → **pass**
- `pnpm --filter @mpa/web lint` → **fail** (28 errors; e.g. react-hooks/set-state-in-effect, brand path rules in tests, unused vars)

Vercel build does **not** run lint, so Production can ship while lint is red. That weakens “green before ship” discipline.

### R5 — Package manager / Node mismatch (Medium)

- Repo is **pnpm** (`packageManager: pnpm@11.12.0`), not npm. (`npm install` is the wrong gate.)
- Vercel project settings show **Node 24.x**; local audit node was **v26.5.0**; engines say `>=22`.
- Dual `vercel.json` (repo root + `apps/web`) + Vercel `rootDirectory: apps/web` can confuse which install/build command is authoritative.

### R6 — Uncommitted migrations vs Production DB (High if WIP applied locally)

Eight local-only migrations (AUTH-001 / OPS-001 / COM-001 dated 2026-07-24/25). If any were applied to a shared remote DB without being in git HEAD, **schema drift** can make “works on my machine” diverge from Production app code.

### R7 — Stashes + single long-lived branch (Medium)

- Stashes: `wip-before-prod-hotfix`, `push001-temp-wip`, `push001-temp`
- Only two local branches: `checkpoint/pre-phase5`, `main` (`main` is **76 commits behind** checkpoint; no ahead commits)
- No dedicated `hotfix/*` or `wip/*` branches — everything compresses onto the ship branch

### R8 — Hard-to-verify surfaces (Medium)

PWA / service worker / Master Admin–only nav paths have repeatedly produced “shipped but user sees nothing” failures. Role-path validation is not part of the current deploy habit.

---

## 3. Phase 1 Audit Detail

### 3.1 Git

| Item | Finding |
|------|---------|
| Current branch | `checkpoint/pre-phase5` |
| Upstream | `origin/checkpoint/pre-phase5` (in sync at `c0e1a0d`) |
| Modified | **71** |
| Untracked | **105** |
| Staged | **0** |
| Recent HEAD | Theme/settings hotfix chain: `e3fd81a` → `c0e1a0d`; prior branding: `0a64145` → `7752fb5` → `2c61ad7` |
| WIP-looking content | Untracked AUTH/OPS/COM/owner-portal/shell-split/docs packages; stashes above |
| Is Production branch safe to ship? | **Committed tip yes** (matches live SHA; clean typecheck+build pass). **Working tree no.** |

**Branches:**

- `checkpoint/pre-phase5` — **de facto Production + WIP sandbox**
- `main` — older foundation tip (`329c77b`); **not** what Vercel Production tracks

### 3.2 Architecture — providers

**Production SoT (keep for ship lane):**

1. `apps/web/src/app/providers.tsx` → `AppProviders`
2. Root `apps/web/src/app/layout.tsx` mounts `AppProviders` + `RegisterServiceWorker`
3. `ThemeProvider` / `useTheme` / `ToastProvider` from **`@mpa/ui`**
4. `packages/ui` exports only `"."` on HEAD

**Local WIP (sandbox only — do not ship piecemeal):**

1. Untracked `shell/shell-providers.tsx` + `shell/app-providers.tsx`
2. Modified `(app)/layout.tsx` and untracked `(portals)/layout.tsx` mount `ShellProviders`
3. Root layout comment/code assumes Option B (providers **not** at root)
4. WIP `app-providers` imports `@mpa/ui/shell`
5. Working-tree `packages/ui/package.json` adds subpath exports (not on HEAD)

**Duplicate implementations:** Yes — two `AppProviders` definitions (committed `app/providers.tsx` vs untracked `shell/app-providers.tsx`), two theme entrypoints (`@mpa/ui` vs `@mpa/ui/shell`).

**Recommendation for SoT until approved merge:**  
Ship lane stays on **root AppProviders + `@mpa/ui`**. Finish or abandon ShellProviders as a **single approved package**, never half-applied.

### 3.3 Build (clean worktree at `c0e1a0d`)

| Gate | Command | Result |
|------|---------|--------|
| Install | `pnpm install --frozen-lockfile` | **Pass** |
| Typecheck | `pnpm --filter @mpa/web typecheck` | **Pass** |
| Lint | `pnpm --filter @mpa/web lint` | **Fail** (28 errors) |
| Production build | `pnpm --filter @mpa/web build` | **Pass** |

**Note:** User brief said `npm install`; this monorepo’s authoritative install is **`pnpm install`**.

**Blockers for a strict “all green” gate:** lint debt on the production SHA.  
**Not blockers for current Vercel path:** lint (not in `vercel.json` buildCommand).  
**Dead / duplicate / unfinished (local only):** ShellProviders stack; owner-mobile-bottom-nav; AUTH/OPS/COM routes; 8 untracked migrations.

### 3.4 Deployment

| Item | Location / behavior |
|------|---------------------|
| Vercel project | `m-p-a-web` / `prj_pZn4nRYNDeN4AlVz1RZqY4L8tfjL` / team `team_Dh1s7cYC7PuAc0PioeJqS80q` |
| Production ref | `checkpoint/pre-phase5` @ `c0e1a0d…` |
| Root `vercel.json` | `pnpm install` · `pnpm --filter @mpa/web build` · `apps/web/.next` |
| `apps/web/vercel.json` | `cd ../.. && pnpm install` · same filter build · `.next` |
| Linked settings | `rootDirectory: apps/web`, Node **24.x** |
| CI | `.github/workflows/ci.yml` (+ e2e smoke/nightly/rc) — **not** on ship branch pushes |
| Deploy habit risk | Manual/API deploy of a SHA without clean local gate; dirty-tree cherry-picks |

**Local ≠ Production behavior risks:**

1. Editing WIP providers while Production uses root providers  
2. Uncommitted package export subpaths (`@mpa/ui/cn`, `@mpa/ui/shell`) — already caused a failed deploy historically  
3. Env/secrets differ (`.env.local` vs Vercel env) — not audited secret-by-secret here  
4. PWA/SW cache after icon/SW bumps  
5. Role-specific nav not present on Production for a given role  

---

## 4. Recommended Workflow

### 4.1 Ship Lane (production hotfixes)

**Goal:** Every Production change comes from a **completely clean** tree at a known SHA.

```bash
# From a clean machine state (or after parking WIP — see Sandbox)
git fetch origin
git worktree add --detach /tmp/mpa-ship origin/checkpoint/pre-phase5
cd /tmp/mpa-ship
# optional: git switch -c hotfix/<short-name>

# Implement ONLY the hotfix files
pnpm install --frozen-lockfile
pnpm --filter @mpa/web typecheck
pnpm --filter @mpa/web build
# lint: track debt; do not introduce new lint errors in touched files

git add <explicit paths>
git commit -m "…"
git push origin HEAD:checkpoint/pre-phase5   # or push hotfix branch + merge

# Deploy the exact SHA (Vercel gitSource or CLI from THIS clean tree)
# Then verify Production meta SHA matches
```

**Rules:**

- Never commit hotfix files from the dirty primary checkout.
- Never stage “nearby” WIP (portal refactors, shell split, migrations).
- Prefer `hotfix/<name>` branch → merge to `checkpoint/pre-phase5` after gate.

### 4.2 Sandbox Lane (ongoing M.P.A. development)

**Recommendation: Git worktree + dedicated WIP branch** (preferred over stash).

| Option | Verdict |
|--------|---------|
| **Git worktree + `wip/<package>` branch** | **Preferred** — durable, reviewable, isolatable from ship lane |
| Dedicated WIP branch only (same worktree) | Acceptable if discipline is high; easy to contaminate |
| Named stash workflow | **Emergency only** — stashes already proliferating and hard to reason about |

**Why worktree:**

- Keeps ship checkout clean by construction  
- Allows AUTH-001 / OPS-001 / owner polish to continue without blocking hotfixes  
- Avoids “stash pop destroyed my provider story” failures  

**Suggested sandbox branches (examples, not created in this audit):**

- `wip/auth-001`
- `wip/ops-001`
- `wip/shell-providers-option-b`
- `wip/owner-portal-chrome`

### 4.3 Pre-Deploy Gate (checklist)

Copy into every hotfix / Production deploy:

- [ ] **Clean git status** in the ship worktree (`git status` empty aside from intentional hotfix files)
- [ ] **Install** — `pnpm install --frozen-lockfile` (not npm)
- [ ] **Typecheck** — `pnpm --filter @mpa/web typecheck` (or root `pnpm typecheck` for full monorepo)
- [ ] **Lint** — `pnpm --filter @mpa/web lint` on touched files at minimum; full lint tracked as debt
- [ ] **Production build** — `pnpm --filter @mpa/web build`
- [ ] **Smoke test** — login + one critical path for touched surface
- [ ] **Role validation** — see §4.4 for roles affected by the change
- [ ] **Verify correct SHA** — `git rev-parse HEAD` recorded; matches Vercel deployment `githubCommitSha`
- [ ] **Deploy** — only after above; then re-query Production SHA

### 4.4 Role Validation (lightweight)

Before deploy, list **which roles the change can affect**. For each affected role, one human or scripted pass:

| Role | Minimum check |
|------|----------------|
| Master Admin | HQ loads; Appearance / Light mode reachable; no PM-only dead ends |
| Owner | Portal home + one secondary tab (e.g. documents/settings) |
| Property Manager | Ops shell dashboard + one nav item |
| Technician | Assigned work-order path (or documented N/A) |
| Vendor | Vendor portal queue + settings if present |
| Tenant | Tenant home + preferences/settings |

**Process:**

1. Author fills “Roles touched: …” in the commit/PR body.  
2. For shell/theme/nav/PWA changes: **Master Admin–only** is mandatory even if the bug was reported elsewhere.  
3. Optional later: Playwright smoke per role on preview URL (not required to stabilize today).

---

## 5. Cleanup Candidates (DO NOT PERFORM YET)

| ID | Candidate | Risk | Impact | Effort |
|----|-----------|------|--------|--------|
| C1 | Park/commit WIP onto `wip/*` branches via worktree; leave ship tree clean | Low if no force-delete | Unblocks reliable hotfixes | M (½–1 day) |
| C2 | Decide ShellProviders vs root AppProviders; keep only one SoT | **High** if half-merged | Ends theme/provider divergence | L (needs Approve) |
| C3 | Remove or never commit duplicate `shell/app-providers.tsx` until C2 approved | Medium if deleted while WT depends on it | Clarity | S |
| C4 | Align `packages/ui` exports: either land subpaths as one PR or revert WT export edits | High if `@mpa/ui/cn` ships alone | Prevents Vercel module-not-found | S–M |
| C5 | Untracked migrations: branch + apply policy vs Production DB | **High** if DB already applied | Prevents schema drift | M |
| C6 | Enable CI on `checkpoint/pre-phase5` (or require PR into it) | Low–Med (noise / time) | Catches build breaks pre-deploy | S |
| C7 | Lint debt burn-down on production SHA (28 errors) | Low per fix; Med as batch | Makes lint a real gate | M |
| C8 | Document single authoritative `vercel.json` / rootDirectory | Low | Fewer deploy surprises | S |
| C9 | Pin Node (22 or 24) across local + Vercel | Low | Reproducible builds | S |
| C10 | Stash hygiene: drop/apply/name or convert to branches | Low | Less lost work | S |
| C11 | Dead nav to unreleased `/activity` (if still linked without page on SHA) | Low | Avoid 404s | S |
| C12 | Dual BrandSurfaceTone / providers comments drift | Low | Doc clarity only | S |

**No deletions, renames, merges, or deploys were performed in this audit.**

---

## 6. Immediate Next Actions (highest ROI first)

1. **P0 — Park the dirty tree**  
   Create a worktree/branch for current WIP (`wip/auth-ops-com-shell` or split by package). Restore primary checkout to clean `origin/checkpoint/pre-phase5`.  
   *Authorization needed before any file moves/commits.*

2. **P0 — Declare ship SoT**  
   Write a one-line rule in team process: **Hotfixes = root AppProviders + `@mpa/ui` only.** Shell split is sandbox until approved.

3. **P1 — Adopt ship worktree ritual**  
   All Production hotfixes from `/tmp/mpa-ship` (or similar) + pre-deploy checklist §4.3.

4. **P1 — Turn on CI for the ship branch** (or PR-only into `checkpoint/pre-phase5`)  
   At least: install + typecheck + build. Lint can be `continue-on-error` until debt burns down.

5. **P1 — Role checklist on shell/theme/nav/PWA changes**  
   Master Admin–only mandatory.

6. **P2 — Resolve provider architecture as a gated package**  
   Design → Document → Approve → Implement (full ShellProviders Option B) **or** abandon WIP and delete later under authorization.

7. **P2 — Migration inventory**  
   Confirm whether any of the 8 untracked SQL files were applied to Production/staging Supabase; if yes, get them onto a WIP branch and reconcile.

---

## 7. Zero-Risk Improvements (ask before applying)

The following would be documentation/process only — **not applied** in this audit:

1. Add this file’s checklist as `docs/00-governance/hotfix-pre-deploy-checklist.md`.  
2. Add a short “Ship SoT providers” note to `development-freeze-checkpoint.md` or roadmap.  
3. Comment in root `vercel.json` clarifying rootDirectory vs apps/web config.

**Reply with which (if any) of these three you authorize.**

---

## 8. Evidence Appendix

| Evidence | Value |
|----------|-------|
| Audit HEAD | `c0e1a0d84b26acec2cc2738a8061303369148eaa` |
| Production deployment SHA | `c0e1a0d84b26acec2cc2738a8061303369148eaa` |
| Production URL | https://www.my-property-assistant.com |
| Clean worktree | `/tmp/mpa-release-audit-clean` (may be removed after audit) |
| Install / typecheck / build logs | `/tmp/rel-eng-install.log`, `typecheck`, `build` |
| Lint | 28 errors on clean SHA |
| Dirty path count | 176 |
| Package manager | pnpm 11.12.0 |
| CI ship-branch gap | confirmed in `.github/workflows/ci.yml` |

---

**End of report — no repository mutations beyond writing this audit document.**
