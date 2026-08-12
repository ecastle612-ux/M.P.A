# Performance notes — Production Polish Wave C2 (PPS1-029)

**Status:** Partial pass + documented follow-ups  
**Rule:** Only low-risk, clearly demonstrated improvements in C2. No architecture rewrite.

## Implemented in C2

| Change | Why low-risk |
|--------|----------------|
| Notification center skips refresh on open when last fetch &lt; 15s | Removes duplicate GET when opening the panel immediately after mount; mark-read still forces refresh. |
| Command palette debounces property/resident search (200ms) and skips empty `q` | Cuts request storms while typing; catalog search remains local/synchronous. |

## Documented — leave unchanged in C2

| Finding | Why deferred |
|---------|----------------|
| Shell Notification Center + `/shared/communications` both load notifications | Would need shared cache or context; higher coupling risk. |
| Mission Control multi-source fan-out | Large surface; speculative without measured budgets. |
| Unused `global-search.tsx` still present | Dead code cleanup is fine later; not mounted in chrome today. |
| ThemeProvider / `globals.css` dual token injection | Tracked in `token-drift-wave-c1.md`; out of C2 scope. |

Do not introduce a global cache or replace the data-fetching architecture without a governed design sprint.
