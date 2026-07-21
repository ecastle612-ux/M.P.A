# 02 — Root Cause Analysis (Evidence)

## Severity 1 — Input focus loss / keyboard dismiss

### Evidence

`packages/ui/src/lib/focus-trap.ts` (pre-fix):

```ts
useEffect(() => {
  if (!active) return;
  ...
  firstElement?.focus();  // steals focus
  ...
}, [active, onEscape]);
```

`Drawer` / `CommandPaletteShell` / `Modal` pass `onClose` which is typically a **new function every parent render**.

### Trigger chain (Search M.P.A.)

1. User types → `setSearchQuery`  
2. `ResponsiveNavigation` re-renders → new `closeDrawer` (before useCallback) / drawer props churn  
3. `useFocusTrap` deps see new `onEscape` → effect cleanup + re-run  
4. Cleanup calls `previouslyFocusedElement.focus()` (often outside input)  
5. Effect calls `firstElement.focus()` (first focusable in drawer — often not the search field)  
6. Mobile keyboard dismisses; cursor disappears  

Also amplified by:

- Entity search `setEntityResults` re-renders  
- `useMobileNavSignals` polling `setBadges` / `setHealth` every 60s  
- (pre SH-002) AI React context updates re-rendering the entire shell while drawer open  

### Verdict

**Confirmed.** Not speculative. Fix: trap effect depends only on `active`; escape via ref; do not re-focus first element when focus already inside trap.

---

## Floating AI → shell instability

### Evidence

Pre-fix architecture:

```
AiPageContextProvider (useState)
  └─ ApplicationShell children (drawer, header, pages)
  └─ FloatingAiCopilot
```

`AiPageContextBridge` on each page called `setOverride` → Provider state update → **re-rendered entire authenticated tree**, including drawer/search.

### Verdict

**Confirmed contributor** to shell rerenders (and thus focus-trap theft).  
**Architecture fix:** module-level external store (`ai-page-context-store.ts`); only `FloatingAiCopilot` subscribes via `useSyncExternalStore`. Bridges write to the store without React context.

---

## Drawer visual rebuild

| Cause | Status |
| --- | --- |
| Unmount on close | Fixed in SH-001 (`keepMounted`) |
| Brand scroll collapse | Fixed in SH-001 |
| Focus-trap remount feel / focus jumps | Fixed in SH-002 |
| AI context shell rerenders | Fixed in SH-002 |

---

## Remaining risks

- Sidebar collapsed SSR vs client (no animation; width may still snap once)  
- List/table search inputs outside drawer — audit if any remount via `key={query}`  
- Certification matrix not yet executed (see 05)
