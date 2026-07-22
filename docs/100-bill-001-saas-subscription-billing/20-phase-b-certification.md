# 20 — Phase B Certification Record

**Package:** BILL-001  
**Phase:** B — Company Billing Center  
**Recorded:** 2026-07-22  
**Verdict:** Pending production operator walk after deploy  

---

## Scope (honored)

| Constraint | Result |
|------------|--------|
| No Phase A billing engine changes | ✔ webhook / sync / Stripe adapter left untouched |
| Settings → Billing surface | ✔ `/settings/billing` |
| Checkout + Customer Portal via existing `/api/saas` | ✔ |
| Founder leave confirmation | ✔ type `LEAVE FOUNDER` |
| Usage tracking (no enforcement) | ✔ |
| Permissions `saas:read` / `saas:manage` | ✔ |

---

## Files

- `apps/web/src/app/(app)/settings/billing/page.tsx`
- `apps/web/src/components/settings/company-billing-center.tsx`
- `apps/web/src/components/settings/settings-subnav.tsx`
- `apps/web/src/lib/saas/plan-display.ts`
- `apps/web/src/lib/saas/usage.ts`
- Docs: `03`, `11`, this file

---

## Quality

| Check | Result |
|-------|--------|
| `pnpm typecheck` (`@mpa/web`) | ✔ |
| `pnpm --filter @mpa/web build` | ✔ (`/settings/billing` routed) |
| ESLint on modified files | ✔ |

---

## Operator verification checklist

1. Org admin with `saas:manage` opens **Settings → Billing**
2. Current plan / status / renewal / cycle visible
3. **Start trial** or **Manage in Stripe** works
4. Plan change modal shows price, effective date, proration note
5. Leaving Founder requires typing `LEAVE FOUNDER`
6. Invoice table search/sort + PDF / Stripe links
7. Portal return lands on `/settings/billing` with session intact
8. Mobile: no clipped primary actions

---

## Deploy anchors

| Item | Value |
|------|-------|
| Commit | _(filled on ship)_ |
| Deployment | _(filled on ship)_ |
