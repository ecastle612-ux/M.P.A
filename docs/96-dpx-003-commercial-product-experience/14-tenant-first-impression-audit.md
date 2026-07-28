# 14 — Tenant First-Impression Audit

**Package:** DPX-003 · Workstream 3  
**Type:** UX audit only — no implementation in this document  
**Date:** 2026-07-23  
**Surface audited:** `/portal/tenant` home + portal chrome (post home-screen + polish pass)  
**Persona:** First login as a linked resident on a common phone  
**Constraint:** Recommendations are **UI-only** (no APIs, backend, features, or business logic)

**Related:** [04 Tenant Experience](./04-tenant-experience.md) · [13 Tenant Home Screen](./13-tenant-home-screen.md)

---

## Audit method

Reviewed current composition as a cold first login:

1. Landing on Home after auth  
2. First ~30 seconds of reading  
3. First scroll past the fold  
4. Shell navigation + More  
5. Empty / calm states vs busy states  
6. Touch targets, type, spacing, hierarchy  

Code references: `tenant-portal-home.tsx`, `tenant-greeting-line.tsx`, `portal/tenant/layout.tsx`, `portal-shell.tsx`, `navigation.ts`.

---

## Category review (first login)

### First 30 seconds

| Observation | Assessment |
|-------------|------------|
| Time-based greeting + name | Strong welcome signal |
| “Welcome home.” + property / unit / date | Clear place context |
| Shell title “Tenant Portal” + role badge | Feels **ops/admin**, not consumer app |
| Org switcher + role switcher in header | Noise for a single-role resident |
| Push enrollment banner (when shown) | Can steal attention before greeting is absorbed |
| Parallel data load with **no route `loading.tsx`** | Risk of blank wait → weak speed perception |

### First scroll

| Observation | Assessment |
|-------------|------------|
| For you → Quick actions → Today | Sensible hierarchy |
| Feed capped at 5 + View all | Good restraint |
| Six action tiles | Slightly busy; labels text-only |
| Today “Everything looks good” after For you empty | **Duplicate calm** messaging |
| Breadcrumb “Home” | Low value; adds chrome weight |

### Navigation clarity

| Observation | Assessment |
|-------------|------------|
| Slim primary nav (6 items) | Better than module laundry list |
| More page for secondary | Clear overflow |
| Desktop side nav + sticky header | Clear but still portal-heavy |
| No tenant mobile bottom tabs (unlike Owner) | Thumb reach / consumer pattern gap |
| “View all” → announcements only | Misses notifications / messages discoverability |

### Information overload

| Observation | Assessment |
|-------------|------------|
| Home content itself | Mostly calm |
| Header + badge + switchers + optional push banner | Overloads first impression |
| Critical / unread micro-labels | Acceptable; unread dot is easy to miss |

### Typography

| Observation | Assessment |
|-------------|------------|
| Greeting ~1.65rem / semibold | Premium enough |
| Section titles ~0.95rem | Underpowered vs greeting — hierarchy flattens |
| Action labels | Clear; no icon support for scan |
| Kind labels 10px uppercase | Slightly “admin table” |

### Spacing & visual hierarchy

| Observation | Assessment |
|-------------|------------|
| `space-y-5` / `max-w-lg` on mobile | Good breathing room |
| Card padding generally adequate | Could tighten feed rows slightly |
| Pay Rent filled CTA vs outlined peers | Correct emphasis |
| No soft visual anchor (illustration / ambient) | Feels clean but a bit sparse/product-tool |

### Icons

| Observation | Assessment |
|-------------|------------|
| Quick actions | **No icons** — reduces modern consumer feel |
| Feed kinds | Text labels only |
| Shell | Logo present; rest text |

### Call-to-action emphasis

| Observation | Assessment |
|-------------|------------|
| Pay Rent primary fill | Strong |
| Secondary actions equal weight | OK; Maintenance could be secondary-strong when open WO exists (UI-only badge — future polish) |
| View all | Present but quiet |

### Accessibility

| Observation | Assessment |
|-------------|------------|
| Section `aria-labelledby` | Good |
| Unread indicated by color dot only | Weak for SR / low vision beyond `aria-label` on dot |
| Min heights ~44–52px on actions / rows | Good touch targets |
| Critical uses `red-50` / `red-700` | Prefer Canopy feedback tokens for theme consistency |
| Focus rings | Rely on defaults — verify visible on all links |

### Loading states

| Observation | Assessment |
|-------------|------------|
| No `portal/tenant/loading.tsx` | **Gap** — first impression can feel slow |
| No skeleton for greeting / feed / actions | Gap |

### Empty states

| Observation | Assessment |
|-------------|------------|
| “You’re all caught up” / “Everything looks good” | Friendly, non-technical |
| Onboarding when unlinked | Warm and clear |
| Missing property (linked) | Helpful |
| Duplicate empty copy across For you + Today | Slightly redundant |

### Error states

| Observation | Assessment |
|-------------|------------|
| Payments soft-fail (`.catch`) | Invisible to user if rent fails — may hide “Pay Rent” urgency |
| Other service failures | Likely bubble / blank — no calm home-level error card |
| No “Couldn’t refresh updates — try again” UI | Gap for trust |

---

## Scores (1–10)

| Category | Score | Rationale |
|----------|------:|-----------|
| Visual appeal | **7.0** | Clean Canopy surfaces; lacks icons / soft brand atmosphere |
| Ease of use | **7.5** | Clear sections; header chrome competes |
| Discoverability | **7.0** | Core actions visible; View all / More incomplete mental model |
| Mobile usability | **6.5** | Content OK; no bottom nav; side nav pattern still portal-like |
| Professional appearance | **7.5** | Polished copy; “Tenant Portal” naming undercuts premium consumer |
| Speed perception | **5.5** | No skeleton / loading UX on a multi-fetch home |
| Trust | **7.0** | Calm empties help; weak error honesty; push banner can feel pushy |
| **Overall first impression** | **7.0** | Solid communication-first home; not yet “premium consumer app” |

**Average (equal weight):** **6.9 / 10**

---

## Strengths

1. **Personal greeting** — time of day + name + “Welcome home.”  
2. **Place context** — property / unit / date without clutter.  
3. **Communication-first feed** — ranked, capped, View all.  
4. **Friendly empty / onboarding copy** — human, not technical.  
5. **Primary CTA** — Pay Rent visually dominant.  
6. **Slimmed IA** — primary nav + More (vs long module list).  
7. **Today only when meaningful** — avoids “No maintenance” noise.

---

## Weaknesses

1. **Portal chrome** reads as internal software (title, badge, role/org switchers).  
2. **No loading skeleton** — hurts first-login speed perception most.  
3. **Icon-less action grid** — less modern / scannable.  
4. **Mobile lacks bottom navigation** — Owner already has a better consumer pattern.  
5. **Duplicate calm states** — For you + Today both say “all good.”  
6. **View all → announcements only** — incomplete “inbox” story.  
7. **Error / partial-load honesty** missing on the home canvas.  
8. **Section typography** too quiet vs greeting.

---

## Before / after observations

| Moment | Before (link-grid home) | After (current home + polish) | Remaining gap |
|--------|-------------------------|--------------------------------|---------------|
| First words | Generic “Welcome” | Good Morning, Name | Still under “Tenant Portal” chrome |
| What to do | Hunt modules | For you + Pay Rent | Icons / bottom nav |
| Empty day | Link tiles always present | Calm empty copy | Duplicated calm sections |
| Nav | Long module list | 6 primary + More | Header still dense |
| Feel | Ops dashboard | Consumer-leaning home | Not yet premium app shell |

---

## Recommendations (UI only)

### P0 — Highest priority (first-impression ROI)

| ID | Recommendation |
|----|----------------|
| R1 | Add `portal/tenant/loading.tsx` (and optional home skeletons): greeting block + feed lines + action grid placeholders |
| R2 | Soften chrome for tenant: rename visible title toward **“Home”** / property name; de-emphasize or hide Role/Org switchers when only one role/org (UI conditional) |
| R3 | Add simple **icons** to the six quick actions (Canopy / existing icon set only — no new features) |
| R4 | Introduce **tenant mobile bottom nav** mirroring Owner pattern (Home · Rent · Messages · Maintenance · More) — composition only |

### P1 — Strong polish

| ID | Recommendation |
|----|----------------|
| R5 | Merge calm empties: if For you is empty, **omit** Today empty card (or single combined “You’re all set” band) |
| R6 | Raise section heading weight/size one step for clearer hierarchy |
| R7 | Tighten feed row vertical padding; keep min touch height |
| R8 | “View all” → More or a single “Updates” list page that already exists (announcements + link chips to Notifications / Messages) — UI routing only |
| R9 | Replace hardcoded `red-*` critical chip with Canopy feedback tokens |
| R10 | Suppress or delay push enrollment banner until after first home paint / dismissible quieter style |

### P2 — Premium finishing

| ID | Recommendation |
|----|----------------|
| R11 | Subtle top ambient (soft gradient / brand wash) behind greeting — Canopy tokens only |
| R12 | Breadcrumb hidden on Home (keep on nested pages) |
| R13 | Unread: text “New” chip in addition to color dot for a11y |
| R14 | Home-level soft error strip if a section failed to load (“Updates unavailable — pull to refresh” / retry link to same page) |
| R15 | Micro-motion: fade/slide sections once (respect `prefers-reduced-motion`) |

---

## Priority list (ordered)

1. **R1** Loading skeletons  
2. **R2** Consumer chrome (title + switcher quieting)  
3. **R3** Action icons  
4. **R4** Mobile bottom nav  
5. **R5** Deduplicate empty calm  
6. **R6–R10** Hierarchy, View all, tokens, push banner  
7. **R11–R15** Atmosphere, a11y chips, soft errors, motion  

---

## Estimated UX improvement

| If implemented | Expected score lift (overall first impression) |
|----------------|--------------------------------------------------|
| P0 only (R1–R4) | **7.0 → ~8.0** |
| P0 + P1 | **→ ~8.5** |
| P0 + P1 + P2 | **→ ~8.8–9.0** (approaching UI-001 consumer bar) |

Largest single lever: **loading perception (R1)** + **de-portalizing chrome (R2)**.

---

## Commercial readiness verdict

| Question | Answer |
|----------|--------|
| Is the tenant **home content** commercially credible? | **Yes, with caveats** — communication-first, calm empties, clear Pay Rent CTA |
| Is the **first impression** premium-consumer ready? | **Not yet** — chrome + loading + iconography hold it at “good product,” not “delightful app” |
| Block Design Partner / commercial pilot? | **No** for content structure; **polish P0 recommended** before marketing screenshots / first resident cohort |
| Block GA? | Prefer **P0 complete** before broad resident launch; not a CORE-002 money blocker |

**Recommendation:** Treat current home as **commercially acceptable MVP** for DPX-003 communication-first goals. Schedule a **UI-only polish sprint** (R1–R5) before external resident demos. Defer full consumer redesign to **UI-001**.

---

## P0 polish status (2026-07-23)

Authorized and implemented (UI composition): loading skeletons, quick-action icons, consumer chrome, empty-state consolidation, subtle motion, tenant mobile bottom nav.

**Estimated first-impression after P0:** **~8.3–8.6** (target 8.5+).

---

## Explicit non-recommendations (out of scope)

- New APIs, aggregators, or ranking services  
- Weather, packages, or new modules  
- Backend performance work (beyond UI skeletons)  
- RBAC / schema / FIN-003  

---

## Sign-off (optional)

| Role | Notes |
|------|-------|
| Product | Confirm P0 polish before resident demo |
| Design | Confirm chrome naming + bottom nav |
| Engineering | UI-only; cite this audit + DPX-003 |
