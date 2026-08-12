# Token drift notes — Production Polish Wave C1

**Status:** Documented (not fully remediated)  
**Scope:** Discovered while implementing PPS1-014–017. Larger than a safe C1 rewrite.

## Authoritative sources

1. `packages/ui/src/tokens/canopy.ts` — canonical hex values  
2. `ThemeProvider` — runtime `--mpa-*` injection for app shells  
3. `apps/web/src/app/globals.css` `:root` — SSR / marketing bootstrap tokens  

## Drift corrected in C1

- Status subtle tokens (`--mpa-color-status-*-subtle`) wired in ThemeProvider and `:root`.
- `--mpa-color-bg-surface-muted` exposed; `--mpa-color-bg-subtle` aliased to the same Canopy muted surface value.
- Button / Badge / Alert primitives consume status and brand CSS variables instead of one-off emerald/amber/red Tailwind utilities or raw hex copies.
- Shared `buttonClassName`, `Alert`, and `resolveStatusBadgeVariant` helpers land in `@mpa/ui`.

## Remaining architecture debt (leave for a dedicated token sprint)

| Issue | Notes |
|-------|--------|
| Dual token injection | ThemeProvider wraps authenticated shells; marketing/SSR still rely on `:root`. Values can diverge if only one side is updated. |
| Invented status aliases | Some reports/finance surfaces still reference `--mpa-color-danger` / `--mpa-color-success` / `--mpa-color-warning` instead of `--mpa-color-status-*`. |
| `--mpa-color-action-primary` | Used in at least one not-found CTA; not a Canopy token — should use brand-primary. |
| Incomplete `:root` set | Radius, motion, sidebar text, and brand-active tokens are ThemeProvider-only. |
| Dark mode | `[data-theme="dark"]` overrides a subset only; dark mode remains disabled by product rule. |

## Rule for follow-up work

Do not invent new `--mpa-*` names. Extend `canopy.ts` + ThemeProvider + `:root` together, or use an existing status/brand token.
