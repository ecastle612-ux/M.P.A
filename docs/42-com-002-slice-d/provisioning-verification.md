# Slice D — Provisioning Verification

| Check | Result | Evidence |
|-------|--------|----------|
| Flag on | Pass | `COM_002_FLAGS.sliceD_automaticProvisioning === true` |
| Webhook starts job | Pass | `webhook.test.ts` → checkpoint `owner_pending` |
| Identity linked | Pass | `saas_customers` upsert + in-memory customer store |
| Organization created once | Pass | Idempotent slug / session; webhook replay keeps same org id |
| Product activated | Pass | `organization_subscriptions` upsert at `entitled` (service role) |
| Module access gated | Pass | `canAccessWorkspaceModules` false until `owner_bound` |
| Claim → ready | Pass | `run-provisioning.test.ts` claim reaches `ready` + `provisioned=true` |
| Continue page | Pass | `/commerce/continue` polls status, claim CTA, setup CTA |
| Success handoff | Pass | Primary CTA → continue path |
| Login handoff | Pass | `saas_checkout_session` / `bind_token` → continue after sign-in |
| No Slice E/F | Pass | Lifecycle / portal flags false |

## Operator path (no Master Admin SKU assign)

Self-serve purchase activates Product Manager SKU via provisioner entitlements path — Master Admin subscription assign is not required for the happy path.
