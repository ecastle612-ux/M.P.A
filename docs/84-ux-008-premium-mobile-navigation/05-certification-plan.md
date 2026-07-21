# UX-008 — Certification Plan

## Verdict rule

UX-008 is **PASS** for Design Partner readiness only if every gate below passes. Any FAIL blocks completion.

## Visual / brand gates

| ID | Gate | FAIL if |
| --- | --- | --- |
| B1 | Drawer brand immediately communicates M.P.A. | “M.P.A.” unreadable or missing |
| B2 | Mark/lockup is sharp on retina | Blurry, stretched, or clipped |
| B3 | Uses UX-007 approved assets / central Logo system | Direct unofficial logo files |
| B4 | Header compact; pins/search appear early | Large empty brand void remains |
| B5 | Brand collapses on scroll to mark + M.P.A. | No collapse or brand disappears entirely |

## Navigation IA gates

| ID | Gate | FAIL if |
| --- | --- | --- |
| N1 | ≥50% scroll reduction to reach Maintenance/Messages vs baseline flat drawer | Still requires long scroll for essentials |
| N2 | Pinned essentials visible early on open | Ops Center / Properties / Maintenance / Messages / Notifications not reachable without long scroll when permitted |
| N3 | Accordion one-open-at-a-time | Multiple sections expanded simultaneously |
| N4 | Expanded section persistence works | Always resets with no memory and no route-aware expand |
| N5 | Sticky ＋ New always visible with Property / Resident / Work Order / Announcement (permission-filtered) | Create control scrolls away, missing, or still plain non-OS link row only |
| N6 | Existing routes + permissions preserved | Broken links, unauthorized items shown, or route renames |
| N7 | Search M.P.A. jumps via synonyms (resident, lease, work order, payment, …) | Search missing or non-functional |
| N8 | Favorites pin/unpin persist client-side | Cannot personalize or persistence broken |
| N9 | Recent section resumes from existing history when available | Section missing when history exists, or invents fake entries |
| N10 | Company switcher reserved in header even with one org | Switcher omitted or redesigned away |
| N11 | Badges only when reliable counts exist | Fake counts shown |
| N12 | Operations Score / health slot reserved | Slot missing (live or restrained placeholder) |
| N13 | Desktop ⌘K / Ctrl+K still opens Command Center | Shortcut regresses |

## Interaction / quality gates

| ID | Gate | FAIL if |
| --- | --- | --- |
| Q1 | Active item premium (no awkward stripe as primary cue) | Stripe-only unfinished treatment remains |
| Q2 | Touch targets ≥44px | Small hit areas |
| Q3 | Keyboard + screen reader labels | Missing `aria-expanded` / `aria-current` / search label / focus trap regressions |
| Q4 | Instant drawer feel | Noticeable jank or unnecessary remounts |
| Q5 | Phone / Android / iPad / desktop smoke | Layout break on any required device class |

## Logo audit gates

| ID | Gate | FAIL if |
| --- | --- | --- |
| L1 | Cross-surface audit completed | Inventory incomplete |
| L2 | No legacy/unofficial logo paths in app brand rendering | Divergent assets remain in nav/auth/loading |

## Evidence required

- Screenshots: drawer closed header, drawer open (brand expanded + collapsed), search results, favorites, recent, sticky ＋ New menu, active item light/dark, company switcher, badges when data exists.
- Scroll metric note: baseline vs redesigned (approximate px or screens).
- Device matrix checkboxes for iPhone, Android, iPad, desktop.
- Logo audit table filled.
- Confirm ⌘K still opens Command Center on desktop.

## Out of scope for FAIL

Unrelated product bugs, API outages, or missing backend features for destinations that already 404/unauthorized under current product scope. Missing Operations Score *data* is not FAIL if the reserved slot/placeholder is present.
