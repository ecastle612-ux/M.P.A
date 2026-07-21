# 02 — Fix Log

| ID | Fix | Files |
| --- | --- | --- |
| F1 | Raise launcher stacking to `z-[60]` (above Drawer/Modal `z-50`) | `floating-ai-copilot.tsx` |
| F2 | Mount `FloatingAiCopilot` + `AiRouteContextSync` on portal chrome | `portal-shell.tsx` |
| F3 | Pathname → context sync for list/settings routes; skip bridge-owned detail paths | `ai-route-context.ts`, `ai-route-context-sync.tsx`, `application-shell.tsx` |
| F4 | Use `evaluateCapability` for `ai:read` / `ai:use` | `floating-ai-copilot.tsx` |
| F5 | Bridge unmount restores pathname-derived context | `ai-page-context.tsx` |
| F6 | Runtime traces: `ai-copilot-mount` / `open` / `close` / `tap-blocked` / `ai-route-sync` | `floating-ai-copilot.tsx`, `ai-route-context-sync.tsx` |
| F7 | Desktop untappable: portal launcher to `document.body`, never `disabled`, `z-index: 100`, closed Drawer no longer `inset-0` | `floating-ai-copilot.tsx`, `packages/ui/.../drawer.tsx` |
| F8 | Session `/api/auth/session` org fallback so `ai:read`/`ai:use` load without active-org cookie | `api/auth/session/route.ts`, `use-session-permissions.ts` |
| F9 | Concise factual answers (no draft boilerplate); tenant Q&A; render source nav links in floating panel | `provider.ts`, `floating-ai-copilot.tsx` |

## Runtime trace (enable)

```js
localStorage.setItem("mpaDebugShell", "1");
// reload, use AI bubble, then:
copy(JSON.stringify(window.__MPA_SHELL_TRACE__))
```

Expect events: `ai-copilot-mount`, `ai-route-sync`, `ai-copilot-open`, `ai-copilot-close`.
