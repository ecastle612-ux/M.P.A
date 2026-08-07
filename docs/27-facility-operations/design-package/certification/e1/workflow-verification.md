# Phase E.1 — Workflow Verification

## WF-01 Site / facility profile setup

| Spec | Verification |
|------|----------------|
| Entry | FO-entitled org; actor with `facility.sites:write` |
| States | `draft` → `active` → `archived` |
| Activate requirements | name, timezone, ≥1 location |
| Events | `facility.site.created`, `.activated`, `.archived` |
| Audit | Matching actions |
| Notifications | Optional site activated to actor |
| Timeline | Site aggregate events on profile |
| Assistant | Setup incomplete → activate → site ready |
| Exit | Active site with root location; optional property link |

## Deferred workflows (E.2+)

WF-02–WF-12 not exercised in E.1 — intentionally NO-GO.

## Result

| Workflow | Result |
|----------|--------|
| WF-01 | Pass / Fail |
