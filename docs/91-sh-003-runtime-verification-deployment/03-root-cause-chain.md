# 03 — Root Cause Chain (complete)

## Chain A — Focus trap identity churn (SH-002)

`useFocusTrap(..., onClose)` depended on `onEscape` → parent re-render → effect cleanup/re-run → `.focus()` → keyboard dismiss.

**Status:** Fixed in SH-002; hardened further in SH-003 (activate-only focus; safer restore).

## Chain B — Controlled search + heavy drawer updates (SH-003)

Typing → `setSearchQuery` → drawer re-render → entity results paint → **controlled** `<input value={...}>` rewritten during DOM churn → **iOS Safari blurs**.

**Status:** Fixed — Search M.P.A. is **uncontrolled** (`defaultValue` + ref); refocus after results if blurred.

## Chain C — Expanded-section sync during search (SH-003)

`useEffect([open, pathname, firstSectionId])` reshuffled sections while typing when permissions/nav settled → layout under input → Safari blur.

**Status:** Fixed — skip section sync while `searchQuery` non-empty.

## Chain D — Stale Service Worker JS (SH-003)

`sw.js` used **cache-first** for `/_next/static/` → phone kept old focus-trap / drawer bundles after “fix” deploy → user still saw the bug.

**Status:** Fixed — `mpa-foundation-v4`, **network-first** for Next static assets.

## Chain E — AI context Provider re-rendering shell (SH-002)

Page bridge `setState` on Provider wrapping shell → drawer re-render while typing → fed Chain A/B.

**Status:** Fixed — external AI page context store; shell does not subscribe.
