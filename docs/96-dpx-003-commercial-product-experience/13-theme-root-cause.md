# 13 — Theme Root Cause (DPX-003)

**Status:** Fixed in implementation  
**Severity:** 1  
**Date:** 2026-07-21

---

## Symptom

Dark mode flips to light during navigation / refresh.

## Root cause

1. SSR `readServerThemeState` defaults `system` → `light` when mode cookie missing.  
2. `ThemeProvider` trusted SSR `initialMode` and did **not** re-resolve system on mount.  
3. `documentElement` received a full CSS-variable dump that RSC/html re-renders could wipe; `:root` light tokens then painted the shell.  
4. `onAuthStateChange` called `router.refresh()` on **every** auth event (including token refresh), remounting the theme path.  
5. A `useEffect` wrote `preference` to localStorage on every render of preference — amplifying bad SSR values.

BrandLogo / PortalShell were **not** forcing theme.

## Fix

| File | Change |
| --- | --- |
| `packages/ui/.../theme-provider.tsx` | Mount-time system resolve; html only gets `data-theme` + `colorScheme`; vars on wrapper; localStorage only on user set |
| `apps/web/.../layout.tsx` | Remove SSR `style.colorScheme` fight |
| `apps/web/.../auth-session-sync.tsx` | Refresh only on `SIGNED_IN` / `SIGNED_OUT` |
| `apps/web/.../theme-sync.ts` | Init script prefers cookie when storage empty |
| `apps/web/.../globals.css` | Full dark token set on `[data-theme="dark"]` |

## Verification

- Dark stays dark across PM path soft nav  
- Light stays light  
- System follows OS only when System selected  
- Hard refresh preserves selection  
