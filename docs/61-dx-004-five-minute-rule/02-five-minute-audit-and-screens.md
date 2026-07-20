# DX-004 — Five-Minute Rule Audit & Screen Recommendations

**Status:** Draft — Ready for Approval  
**Builds on:** [DX-003 Workflow Audit](../60-dx-003-zero-friction-daily-operations/01-workflow-audit.md)

Pass = completable ≤5 min without training. Fail = exceeds or requires tribal knowledge.

---

## 3. Five-Minute Rule Audit (modules)

| Module | Pass today? | Why / why not | Target path |
| --- | --- | --- | --- |
| Dashboard / Ops Center | **Borderline** | Attention exists; resolve requires leaving | Today’s Work + Resolve |
| Command Center | **Partial** | Search yes; lifecycle actions missing | Universal Palette |
| Properties | **Pass** (CRUD) | Create property OK; QR buried | Quick Add + Inspector |
| Units | **Pass** (CRUD) | Vacancy→tenant path wrong | Quick Add + Move in action |
| Residents / Tenants | **Fail** | Dual path + nav sprawl | One path + Inspector |
| Applicants | **Fail** | Approve→Move in re-select | Inspector + continuation |
| Leases | **Borderline** | Signature queue missing | Filtered queue + Inspector |
| Move In | **Pass** (guided) | Dense but completable | Keep; keyboard polish |
| Move Out | **Pass*** | *Inspection fiction confuses | Copy honesty |
| Maintenance | **Fail** | Assign/complete via Edit | Inspector + inline |
| Vendors | **Borderline** | Create OK; assign context-switch | Assign from WO Inspector |
| Messages / Inbox | **Borderline** | Split from Announcements | Palette + Today’s Work |
| Announcements | **Pass** | Compose is clear | Quick Add |
| Documents | **Partial** | Embedded panels; no hub | Inspector attachments |
| Payments | **Fail** | List→charge→form | One-shot Quick Add |
| Financials | **Fail** (daily) | Hub discovery tax | Today’s unpaid + Inspector |
| Migration Center | **Exempt / Fail daily** | Correctly heavy; not a daily job | Palette discoverability |
| Organization | **Fail** | No standing settings | Profile/org menu |
| Staff | **Fail** | Invite only in setup memory | Quick Add → Invite |
| Settings / Notifications | **Partial** | Hidden from nav | Palette + Profile |
| Profile | **Pass** | Simple | Keep |

**Pass rate today:** ~45% of common jobs. **Target:** ≥85% after DX-003 P0 + DX-004 OS slices.

---

## 4. Screen-by-screen recommendations

### Operations Center (`/dashboard`)

| Issue | Fix |
| --- | --- |
| Metric gallery overload | Collapse into **Today’s Work** (due today) + secondary “Portfolio pulse” |
| Deep-link attentions | Each row: primary Context Action + open Inspector |
| Quick Actions mis-wired | Bind to Quick Add / one-shot flows ([DX-003](../60-dx-003-zero-friction-daily-operations/)) |
| Scroll fatigue | Sticky Today’s Work; pulse below fold |

### Command Center (⌘K)

| Issue | Fix |
| --- | --- |
| Creates → CRUD `/new` | Actions run guided jobs / Quick Add drafts |
| Missing lifecycle | Move in/out, Transfer, Inbox, Migration pinned |
| Shortcut collision | Spec in §8 |

### Properties / Units lists

| Issue | Fix |
| --- | --- |
| Open full page for minor edits | Right-side Inspector |
| No bulk | Select → Archive / Export / Status |
| Vacancy CTA | Context Action: **Move in** |

### Residents / Applicants / Leases lists

| Issue | Fix |
| --- | --- |
| Detail-page tax | Inspector for status, contact, next action |
| Dual create paths | Quick Add prefers guided |
| Signature/screening hunt | Context Action on card |

### Move In / Move Out

| Issue | Fix |
| --- | --- |
| Dense wizard | Keep steps; add progress + keyboard; honest checklist |
| Success wander | Return to Today’s Work with next action |

### Maintenance / Vendors

| Issue | Fix |
| --- | --- |
| Edit page for assign/complete | Inspector actions |
| Vendor create mid-flow | Quick Add Vendor without losing WO |

### Messages / Announcements

| Issue | Fix |
| --- | --- |
| Split IA | Today’s Work “Communications due”; Quick Add Announcement |
| Thread depth | Inspector for short reply; full page for long threads |

### Payments / Financials

| Issue | Fix |
| --- | --- |
| Record payment path | Global Quick Add → Payment |
| Hub as homepage | Default “Due today / unpaid” |

### Migration / Org / Staff / Settings / Profile

| Issue | Fix |
| --- | --- |
| Migration dense | Palette entry; not daily Today’s Work |
| Staff dead end | Quick Add → Invite teammate |
| Settings hidden | Palette “Notification settings” |

---

## 5. Click reduction metrics (common jobs)

| Job | Current clicks | Target | Current min | Target min | Training reduction |
| --- | ---: | ---: | ---: | ---: | --- |
| Morning top-5 clear | 18 | 8 | 12–15 | 4–5 | High |
| Record payment | 3–4 | 1–2 | 3–4 | ≤2 | High |
| Create WO + assign vendor | 5–7 | 2–3 | 6–8 | ≤4 | High |
| Approve applicant → move-in start | 6 | 2–3 | 8–10 | ≤5 | High |
| Publish announcement | 3–4 | 2 | 3–4 | ≤3 | Med |
| Start move-in (vacant) | 4–5 | 2–3 | 8–12 | ≤5 | Med |
| Find resident + update phone | 4–5 | 2 | 3–4 | ≤2 | High |
| Invite teammate (post-setup) | 8+ hunt | 2 | 10+ | ≤3 | Very high |
| Close WO complete | 4–5 | 2 | 4–5 | ≤2 | High |
| Reply inbox thread | 3–4 | 2 | 3–4 | ≤2 | Med |

**Daily time saved (500-unit PM):** 70–90 minutes (with DX-003).  
**Monthly:** ≈ 26–33 hours.

---

## 6. Mobile workflow improvements

| Principle | Spec |
| --- | --- |
| Today’s Work first | `/dashboard` mobile = Today’s Work list, not widget mosaic |
| Thumb Quick Add | FAB or bottom-bar **+** (same Global Quick Add) |
| Inspector as sheet | Right-side becomes bottom sheet ≥90% height on small screens |
| Palette | Full-screen sheet; large tap targets |
| No hover-only actions | Context Actions always visible or in overflow menu |
| Phone-pass jobs | Payment, WO assign, announcement publish, applicant decide, short message reply |
| Depth deferral | Migration review, statement generate → “Open on desktop” affordance if needed |

---

## 7. Bulk workflow opportunities

Every major list (`properties`, `units`, `tenants`, `applicants`, `leases`, `maintenance`, `vendors`, `communications`, `charges`) supports:

| Action | Notes |
| --- | --- |
| Select / Select all (page) | Standard |
| Assign | WO→vendor; applicant→owner; unit→PM |
| Message | Residents/applicants only; confirm audience count |
| Archive | Soft-archive where model exists |
| Export | CSV of selection |
| Delete | Capability-gated; confirm; never default |
| Status change | Enum-safe transitions only |

**Priority order to implement bulk:** Maintenance → Charges/Payments → Applicants → Residents → Announcements.

Reuse `/residents/bulk` interaction grammar; do not invent a second bulk system.

---

## 8. Keyboard shortcut plan

| Shortcut | Action |
| --- | --- |
| ⌘K / Ctrl+K | Universal Command Palette |
| ⌘N / Ctrl+N | Global Quick Add menu |
| `G` then `D` | Today’s Work / Ops |
| `G` then `R` | Move in (Residents guided) |
| `G` then `M` | Maintenance list |
| `G` then `I` | Inbox |
| `G` then `F` | Financials (due today) |
| `G` then `P` | Properties |
| `C` then `W` | Quick Add Work Order |
| `C` then `Y` | Quick Add Payment |
| `C` then `A` | Quick Add Applicant |
| `J` / `K` | Move selection in Today’s Work / list |
| `Enter` | Open Inspector / primary Context Action |
| `Esc` | Close Inspector / Palette / Quick Add |
| `?` | Shortcut cheatsheet |

**Fix:** Remove `G A` collision (Applicants vs AI). Assign `G A` → Applicants; `G O` → AI Operations (or Palette-only for AI).

Shortcuts must be listed in Palette footer and `?` overlay — never tribal.
