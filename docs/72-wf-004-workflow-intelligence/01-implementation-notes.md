# 01 — Implementation Notes

**Package:** WF-004 · EP-006 Approved

## Workspace memory (client-only)

`apps/web/src/lib/workflow/workspace-memory.ts`

- Last property / unit / tenant  
- Announcement audience + category  
- Accounting period preference  
- Last vendor id by maintenance category  
- Persisted in `localStorage` keys under `mpa.wf_memory.*`

## Suggest helpers

`apps/web/src/lib/workflow/category-suggest.ts`

- Title → maintenance / announcement category  
- Lease number + date defaults  
- Current accounting period defaults  

## Forms

| Surface | Behavior |
| --- | --- |
| Maintenance create/edit | URL → memory → options; occupied tenant; title→category; sticky actions |
| Lease create | Memory + lease number/dates; occupied tenant |
| Announcement create | Remembered scope/category; title→category |
| Expense / owner statement | Property (+ period) memory |
| Unit create | Property memory |

## Suggestions UI

`apps/web/src/components/workflow/smart-suggestions.tsx`

- Vacant unit detail  
- Completed work order detail  
- Late rent on Financials overview  

## Operational memory

`apps/web/src/components/workflow/operational-memory-hint.tsx`

- Prior repairs on `/maintenance/new` when `propertyId` present (existing list read)  
- Vendor panel soft-ranks remembered vendor for category  

## Completion

`apps/web/src/lib/workflow/shared/success-configs.ts` — longer next-step chains with prefilled query strings

## Empty states

`apps/web/src/lib/experience/empty-states.ts` + `@mpa/ui` `EmptyState` `whyItMatters`
