# 03 — Fix Log

| ID | Issue | Change | Before | After (expected) |
| --- | --- | --- | --- | --- |
| F-S1 | Focus loss | `useFocusTrap` deps = `[active]` only; escape via ref; skip initial focus if already inside | Typing in Search M.P.A. lost cursor | Focus retained across re-renders |
| F-S2 | AI shell rerenders | External AI page context store; remove Provider wrap | Page navigation re-rendered drawer | Only copilot re-renders on context |
| F-S3 | closeDrawer identity | `useCallback` in ResponsiveNavigation | Unstable onClose to Drawer | Stable callback |
| F-S4 | Search field remount risk | Memoized `MobileSearchField` | Input in large parent tree | Isolated memo child |
| F-S5 | Copilot isolation | `memo(FloatingAiCopilot)` + store subscription | Coupled to shell provider | Shell-independent |

## Render expectation (post-fix)

| Event | Drawer/Search re-render? | Copilot re-render? |
| --- | --- | --- |
| Type in Search M.P.A. | Yes (local state) — focus kept | No |
| Entity results arrive | Yes — focus kept | No |
| Navigate page (AI bridge) | No | Yes (context only) |
| Badge poll 60s | Yes — focus kept | No |
