# 01 — Audit Findings

**Package:** AI-001  
**Date:** 2026-07-21

## Architecture (pre-fix)

| Layer | Implementation |
| --- | --- |
| Mount | `FloatingAiCopilot` in `ApplicationShell` only |
| Context | External store (`ai-page-context-store`) + optional `AiPageContextBridge` |
| Permissions | `ai:read` (show) / `ai:use` (send) via session permissions |
| Stacking | Launcher `z-40`; keepMounted Drawer / Modal `z-50` |

## Defects

### D1 — Launcher under keepMounted drawer (Critical)

Mobile nav Drawer uses `keepMounted` with `fixed inset-0 z-50` even when closed (`pointer-events-none invisible`). Copilot sat at **`z-40`**, so the drawer stacking context stayed above the bubble. On mobile WebViews this commonly yields “bubble visible but not tappable / needs multiple taps.”

### D2 — Portals missing launcher

`PortalShell` (owner / tenant / vendor portals) did not mount `FloatingAiCopilot`. Certification requires portals.

### D3 — Context gaps on list/settings routes

Bridges existed only for dashboard + some entity detail pages. Financials, Settings, Messages, list indexes often fell back to generic “Ask about your portfolio.”

### D4 — Permission check too narrow

Launcher used `permissions.includes("ai:read")` instead of `evaluateCapability`, so `ai:*` grants would not enable the bubble.

### D5 — Bridge cleanup wiped context

`AiPageContextBridge` cleanup called `setAiPageContext(null)` → hard reset to generic default during route transitions.

## Non-defects (verified in code)

- Copilot is `memo`’d and does not wrap the shell (SH-002 isolation intact).
- Wrapper uses `pointer-events-none` with `pointer-events-auto` on the button (correct pattern).
- Escape closes panel and restores focus to launcher.
- Body scroll is not locked while open (avoids “frozen scroll after close”).
