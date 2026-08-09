# Phase 3 Deployment Report — Sprints 1 → 1.1 → 2

**Date:** 2026-08-09  
**Owner authorization:** Phase 3 Deployment (Sprint 1, 1.1, 2 accepted)  
**Serving project:** Vercel `m-p-a-web` → `https://www.my-property-assistant.com`

---

## Preview failure diagnosis (pre-merge)

Same root cause on **#71 / #72 / #73** (and on every recent PR including already-merged #68/#69):

| Field | Value |
|-------|--------|
| Why Preview fails | Project-wide Preview failure on `m-p-a-web`, not sprint-specific code. Production for the same project builds/deploys successfully from `main`. CI `verify` was green on all three PRs. |
| Exact error (GitHub/Vercel status) | `Deployment has failed — run this Vercel CLI command: npx vercel inspect dpl_<id> --logs` |
| #71 Preview dpl | `dpl_ADtePHnj9Tvsbw2VB1W5NYMbGSSg` |
| #72 Preview dpl | `dpl_4jDekGmMzW4EDimqDTpL84miLUFx` |
| #73 Preview dpl | `dpl_HphZLCTaHK1NwdX3J37pX7Fu1sW1` |
| Required fix | Ops: ensure Vercel **Preview** env for `m-p-a-web` includes required schema vars (`NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SESSION_COOKIE_NAME`) — same set Production already has. Agent cannot mutate Vercel env (Vercel MCP unauthenticated). |
| Merge decision | Preview is **not** a required status check (proven by merged #69 with Vercel FAILURE). CI `verify` PASS. Owner authorized merge. No sprint code redesign applied. |

---

## Merge sequence (executed)

| Order | Sprint | PR | Branch | Merge commit | Merged at (UTC) |
|-------|--------|----|--------|--------------|-----------------|
| 1 | Sprint 1 | #71 | `cursor/phase3-sprint1-public-polish-afef` | `f262cbb0835609958bf15f4a635aaf5c98e907b3` | 2026-08-09T02:53:35Z |
| 2 | Sprint 1.1 | #72 | `cursor/phase3-sprint1-1-commercial-polish-afef` | `fe0db932a5cb67e14b466273dbd9d72f9eef0fd9` | 2026-08-09T02:53:41Z |
| 3 | Sprint 2 | #73 | `cursor/phase3-sprint2-guided-setup-polish-afef` | `0ea36a18ab8bb9fb8e4975082898b8ac5a829091` | 2026-08-09T02:53:48Z |

### `origin/main` contains sprint tips

| Sprint tip SHA | On `origin/main`? |
|----------------|-------------------|
| `c52e8f7eb90b1039616781ded46435978821c823` (Sprint 1) | Yes |
| `04a3933cc1b0fef899740bbe4d2a3b8ad0d75f3f` (Sprint 1.1) | Yes |
| `1f914bca42c427f506760bfdf5ddd3281c99288a` (Sprint 2) | Yes |

Tip of `origin/main` after merges: **`0ea36a18ab8bb9fb8e4975082898b8ac5a829091`**

---

## Production deployment

| Field | Value |
|-------|--------|
| Status | **success** |
| Vercel project | `m-p-a-web` |
| Vercel deployment ID | `285YZbYBhngEqKHd4bEL6LiaZbDk` |
| GitHub Production deployment ID | `5814911013` |
| Production SHA | `0ea36a18ab8bb9fb8e4975082898b8ac5a829091` |
| Completed (UTC) | 2026-08-09T02:54:43Z |
| Live domain | https://www.my-property-assistant.com |

---

## STOP

Production verified for Sprints 1–2. **Do not begin Sprint 3** until Owner accepts this closeout.
