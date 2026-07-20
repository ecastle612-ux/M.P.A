# Loading Experience & Duplicate Prevention

## Loading

| Surface | Behavior |
| --- | --- |
| Global | Branded logo loading (`app/loading.tsx`) |
| Ops modules | Existing skeletons retained |
| Portals / auth / profile / settings | New skeleton or branded loading + copy |
| Friendly errors | Explicit “Retry” (no infinite spinner) |

## Duplicate prevention

| Action | Mechanism |
| --- | --- |
| Payments (record form) | `useSubmissionGuard` + 2.5s payload key dedupe + disabled submit |
| Notifications | DB unique `(organization_id, idempotency_key)` |
| Webhooks (pay/screen/sign) | `integrations_webhook_events` insert-before-apply |
| General forms | Guard helper reusable via `useSubmissionGuard` |

## Follow-up

Apply `useSubmissionGuard` to remaining high-risk mutations (screening order, signature send, resident invite bulk) in a thin polish PR.
