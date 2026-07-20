# 02 — Pattern System

**Package:** UX-006  
**Rule:** Reuse Canopy tokens and existing shell. Prefer shared presentation components under `components/presentation/`.

---

## Pattern A — Context section navigation (mobile)

Horizontal, scroll-snap chip/tabs under the hero on **detail** surfaces:

`Overview · Units · Residents · Maintenance · Financials · Documents · Timeline · More`

- One tap scrolls/switches to section (prefer **panel swap** over in-page scroll jump when section is heavy)  
- Active section indicated; sticky under top nav on mobile  
- Desktop may keep current two-column layout; tabs optional  

Does **not** create new routes unless a query `?section=` improves deep links (allowed; same page).

---

## Pattern B — Sticky primary action bar

On mobile create/edit/detail workflows, pin primary CTA(s) to bottom safe-area:

`Save` / `Continue` / `Complete` / `Publish` / `Assign` / `Move In`

- Already used on several forms — **standardize** class/helper  
- Detail pages: pin the single most important next action for current section  

---

## Pattern C — Progressive disclosure

Default **collapsed** on mobile for:

- Full timeline  
- Full repair history  
- Documents vault list  
- QR / enrollment  
- Advanced / audit blocks  
- Duplicate rail metrics already shown in hero  

`Show timeline` / `Show documents` expands in place. Information preserved.

---

## Pattern D — Context quick actions

Compact action row (icon + label) scoped to entity:

Property: Add unit · Move in · Work order · Announce · Collect payment  

Only show permitted actions (existing permission checks).

---

## Pattern E — Smart lists (tighten, don’t rebuild)

Keep search/filters; on mobile:

- Collapse filter row behind “Filters” disclosure  
- Prefer recent/pinned when lists grow (use existing sort where present)  
- Avoid new infinite-scroll architecture unless a list already paginates poorly  

---

## Pattern F — AI Ops mobile-first

- Conversation + composer occupy primary viewport  
- Insights / activity / metrics in secondary sheet or top “More”  
- Sticky composer on mobile (not only `xl`)  
- Suggested prompts reachable without scrolling away from thread  

---

## Pattern G — Chrome reduction

- Reduce oversized hero padding on mobile  
- Avoid stacking duplicate cards (main vs rail) without disclosure  
- Touch targets ≥ 44px; thumb-zone for sticky actions  

---

## Explicit bans

- No new product modules  
- No removing fields permanently  
- No changing API / permission / state machines  
- No desktop-only regressions (progressive enhancement OK)  
