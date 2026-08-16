# 165 — Phase 4 PWA Install + Device-Specific Experience

**Title:** PHASE 4 PWA INSTALL + DEVICE-SPECIFIC EXPERIENCE  
**Status:** **Draft** — awaiting Owner approval  
**Date:** 2026-08-16  
**Program:** Phase 4 tenant / portal experience — PWA-only client (no native apps)  
**Authority:** [Implementation Gate](../00-governance/implementation-gate.md) · [Product Constitution](../00-governance/product-constitution.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md) · [ADR-013](../18-decision-log/adr-013-experience-architecture-before-ui.md) · [ADR-019](../18-decision-log/adr-019-product-constitution.md) · [ADR-032](../18-decision-log/adr-032-report-shape-and-post-auth-home.md) · [docs/19](../19-future-native-mobile-strategy/index.md) · [docs/26](../26-launch-001-onboarding/index.md) · [docs/55](../55-phase-4-resident-dashboard/index.md) · STAB-014 (minimal PWA PASS; deeper polish deferred until this package is approved)  
**This package:** Design and current-implementation audit only. **No application/UI/schema implementation. No native iOS or Android apps. No OneSignal / Web Push enablement. No commercial-flow, SKU, pricing, or ADR-033 change.**

---

## Verdict

M.P.A. is a **PWA-only** client: there is no native iOS or Android application, and this package does not create one. Apple, Android, and desktop do **not** share one installation path. The product must detect capability and display mode, then show the matching optional install experience — or none.

The tenant journey that must always work, with or without installation:

```
Invitation link
  → Open M.P.A. in the device browser
  → Accept invitation / sign in
  → Use Tenant Portal
```

PWA installation is an **optional enhancement after successful onboarding**. It is never an authentication or authorization requirement. A tenant who declines install, uses a browser that cannot install, or has no service worker must retain full authorized Tenant Portal access.

**Do not implement until this package is Approved.**

---

## What this package does not do

- Does not implement UI, service-worker, or manifest changes
- Does not ship native iOS or Android applications (docs/19 remains future)
- Does not enable OneSignal, Web Push, or notification permission as a gate
- Does not make service worker registration a condition of login or invitation accept
- Does not change Stripe, SKUs, pricing, billing plans, or the binding commercial flow
- Does not change ADR-033 scopes or membership rules
- Does not use user-agent strings for authorization
- Does not show Android install UI to Apple users, or Apple Share / Add-to-Home-Screen UI to Android users

---

## Binding product rules

1. **Installation is optional.** Decline, dismiss, or unsupported browser → continue in the browser.
2. **Invitation accept and sign-in run in the browser first.** They must not wait for Home Screen install, `beforeinstallprompt`, service worker, or push permission.
3. **Device/browser detection is presentation logic only.** Authorization remains ADR-026 / ADR-033: authentication → organization → role → SKU entitlement → member operating scope → capability.
4. **No universal install flow.** Apple, Android, and desktop are designed separately.
5. **Already standalone / installed → never keep asking.**
6. **One post-auth home.** Installed launches still go through `resolvePostAuthHome` (ADR-032). The manifest must not hard-code `/portal/tenant` as `start_url` (that would send staff to the wrong product).
7. **Canopy applies when UI is later implemented.** No new design language. No Canopy work in this Draft package.

---

## 1. Current implementation audit

Inspected in-repo on `main` (`867c579b` at audit time). Findings below are from source, not from a live device lab.

### 1.1 Manifest

Source: `apps/web/src/app/manifest.ts` (Next.js App Router → `/manifest.webmanifest`).

| Field | Live value | Assessment |
|-------|------------|------------|
| `name` | `M.P.A. — My Property Assistant` | Fine |
| `short_name` | `M.P.A.` | Fine for Home Screen |
| `description` | AI Property Operations Platform | Fine |
| `start_url` | `/dashboard` | Role-neutral **if a session exists**: `/dashboard` already redirects through `resolvePostAuthHome` (tenant → `/portal/tenant`). Wrong only when standalone has no session (common on iOS). |
| `display` | `standalone` | Correct for installed chrome |
| `scope` | **omitted** (defaults to `/`) | Acceptable; document explicitly later |
| `id` | **omitted** | Chromium install identity is implicit |
| `theme_color` / `background_color` | `#0F6B56` / `#F3F4F6` | Present |
| Icons | House-mark 16–512 `any` + 192/512 `maskable` | Present; Apple also uses `apple-touch-icon` 180 |
| Screenshots / `display_override` / `launch_handler` | **absent** | Not required for v1 |
| Role-specific manifests | **absent** | Do not add; use `/dashboard` + ADR-032 |

### 1.2 Apple-specific metadata

Source: `apps/web/src/app/layout.tsx`.

| Item | Present | Notes |
|------|---------|-------|
| `appleWebApp.capable` | **yes** (`true`) | Emits `apple-mobile-web-app-capable` |
| `appleWebApp.title` | **yes** (`M.P.A.`) | Home Screen label |
| `appleWebApp.statusBarStyle` | `default` | Fine |
| `apple-touch-icon` 180×180 | **yes** (`/icons/mpa-apple-touch.png`) | Required Apple path |
| `apple-touch-startup-image` splash set | **no** | iOS will letterbox / use background color |
| `beforeinstallprompt` | **n/a on Apple** | Correctly unused today — but there is also no Apple instruction UI |

### 1.3 Service worker

Source: `apps/web/public/sw.js`, registered by `apps/web/src/components/pwa/register-service-worker.tsx`.

| Item | Current behavior |
|------|------------------|
| Registration | Production only (`NODE_ENV === "production"`). Skips if `serviceWorker` is missing. |
| Failure handling | Unhandled; registration errors are ignored. Access continues. |
| Cache | `mpa-foundation-v3-house-mark-icons` |
| Precache | `/`, `/offline.html`, `/manifest.webmanifest` — **not** `/dashboard` or `/portal/tenant` |
| Documents / HTML | Network-first; offline → cached page or `/offline.html` |
| Static assets | Cache-first for style/script/image and `/_next/static/` |
| Mutations | Not cached (non-GET ignored) — matches architecture “no offline mutations” |
| Update UX | `updatefound` is an empty placeholder |
| Push / `push` event | **none** |
| Required for auth | **no** — login and invitation do not check SW |

Invitation accept is a POST to `/api/invitations/[token]/accept`. The worker does not intercept POST. A missing or broken worker cannot block accept.

### 1.4 Installability handling

| Surface | Current |
|---------|---------|
| `beforeinstallprompt` listener | **none** |
| `appinstalled` listener | **none** |
| Apple Share / Add to Home Screen instructions | **none** |
| Standalone / `display-mode` detection | **none** |
| Dismiss / “already asked” preference | **none** |
| Install CTA on Tenant Portal | **none** |

STAB-014 explicitly accepted this minimal PASS and deferred deeper polish. That deferral is this package.

### 1.5 Authentication and standalone

| Item | Current |
|------|---------|
| Session cookie | `mpa_session` (configurable), `path=/`, `SameSite=Lax`, `httpOnly`, `secure` in production |
| Auth client | `@supabase/ssr` via `createAuthServerClient` / `createAuthClient` |
| Protected routes | Middleware requires a user for `/portal`, `/dashboard`, and staff surfaces; unauthenticated → `/login` |
| Tenant layout | Requires signed-in user **and** `tenant` role; else `/login` or `/unauthorized` |
| Post-auth home | `resolvePostAuthHome` — tenant → `/portal/tenant` without Guided Setup |

Cookies are first-party and same-origin. On Chromium/Android they generally persist into the installed PWA. On iOS/iPadOS, Safari and the Home Screen web app are **separate website-data containers** (cookies, localStorage, IndexedDB, and usually the service worker). Design must assume an Apple tenant may need to **sign in once** after first Home Screen launch. Do not invent a `start_url` token bridge in v1 (security-sensitive, easy to get wrong).

### 1.6 Invitation and deep links

| Path | Who | Behavior |
|------|-----|----------|
| `/accept-invitation/{token}` | Staff / org invitation | Public page; accept POST after sign-in; `homeHref` from `resolvePostAuthHome` |
| Portal magic link | Tenant / vendor provision | `generateLink` `redirectTo` = `{appUrl}{homeHref}` (tenant home `/portal/tenant`) |
| `/login?next=/portal/tenant` | Tenant returning | Safe `next` must be same-origin relative |
| Email / Messages / QR | All | Opens the **browser** (Safari on Apple, Chrome/other on Android), not the installed PWA |

There is no install check on these routes. Keep it that way.

### 1.7 Push notifications

| Channel | Status |
|---------|--------|
| In-app notification inbox | **Live** (`/portal/tenant/messages`, `/api/shared/communications/notifications`) |
| Web Push / `PushManager` | **not implemented** |
| OneSignal (web) | **not wired** in `apps/web` |
| STAB-007 | Email + in-app for work-order lifecycle; OneSignal / push explicitly out of Sprint 5 |

This package does **not** enable push. If push is designed later: iOS 16.4+ only after Home Screen install and a user gesture; Android can subscribe in browser or PWA; permission must remain optional.

### 1.8 Icons and offline shell

Approved house-mark icons exist (`apps/web/public/icons/README.md`). Offline page is a static foundation shell, not a Tenant Portal. Offline is not a substitute for invitation accept or billing.

---

## 2. Apple — iPhone / iPad (current behavior)

Report separately from Android. All iOS/iPadOS browsers are WebKit. Chrome / Firefox / Edge on iPhone or iPad are **not** Android and must not receive Chromium install UI.

### 2.1 What Apple supports

| Topic | Current platform behavior (iOS / iPadOS 16.4–18 family; re-verify at implement) |
|-------|----------------------------------------------------------------------------------|
| Programmatic install (`beforeinstallprompt`) | **Not available.** Do not wait for it. Do not show a fake “Install” button that calls a missing prompt. |
| Supported install path | **Safari** → **Share** → **Add to Home Screen** → **Add**. iPad uses the same Share sheet. |
| Chrome / Firefox / Edge on iOS | WebKit. No Chromium install prompt. If those browsers expose Add to Home Screen in their own share UI, copy must still be Apple-family, not Android. Prefer: “Open this page in Safari, then add M.P.A. to your Home Screen.” |
| iPadOS desktop user-agent | iPad may report as Macintosh. Presentation detection must use touch + Apple signals (`maxTouchPoints > 1` with Mac UA), not “desktop Chrome” instructions. |
| Manifest | Safari reads `display`, name, and icons; Home Screen icon prefers `apple-touch-icon`. |
| Standalone | `display-mode: standalone` and legacy `navigator.standalone`. |
| Splash | Without `apple-touch-startup-image`, iOS shows a simple splash from theme/background. Acceptable for v1. |
| Session persistence | **Safari tab and Home Screen app do not share cookies/storage.** Invitation in Safari does not automatically sign the installed app in. |
| Deep links | Mail / Messages / QR open **Safari**, not the Home Screen app. Invitation must complete in Safari. |
| Opening when already installed | Subsequent Home Screen taps launch `start_url` (`/dashboard` → `resolvePostAuthHome`). In-scope https links from Mail still typically open Safari. |
| Browser fallback | Always available. Tenant who never installs keeps full portal access in Safari. |
| Push | Not used today. If added later: only in the **installed** Home Screen app, iOS 16.4+, user gesture. Never required. |
| Storage eviction | Script-writable storage can be evicted after ~7 days unused. Server session / refresh is source of truth. |

### 2.2 Apple experience to design (after approval)

**When:** Tenant is signed in, has the `tenant` role, has reached Tenant Portal (`/portal/tenant` or a child route), and is **not** already standalone.

**What to show:** An Apple-only card, dismissible, never blocking.

Copy intent (not final Canopy strings):

1. Add M.P.A. to your Home Screen for faster access.
2. Tap **Share**.
3. Tap **Add to Home Screen**.
4. Tap **Add**.
5. Honest note: “The first time you open M.P.A. from your Home Screen, you may need to sign in once.”

**When not to show:**

- Invitation accept, login, password reset, marketing, checkout
- Already `standalone` / `navigator.standalone`
- User dismissed (snooze or “don’t show again” — client preference only)
- Android or desktop capability paths

**Do not** display Play-style “Install M.P.A.” or `beforeinstallprompt` buttons on Apple.

### 2.3 Apple invitation sequence (required)

```
Email / text invitation
  → Safari (or other iOS browser) opens /accept-invitation/… or magic link
  → Sign in / accept
  → Tenant Portal in the browser   ← success; onboarding complete
  → Optional Apple Add-to-Home-Screen card
  → Later: Home Screen launch → /dashboard → resolvePostAuthHome
       if no standalone session → /login (allowed; not a defect)
```

---

## 3. Android (current behavior)

### 3.1 What Android supports

| Topic | Current platform behavior |
|-------|---------------------------|
| Chrome / Edge / Samsung Internet | Chromium installability: HTTPS, manifest (`name`, `start_url`, `display`, 192+512 icons), service worker with a `fetch` handler. Production registration satisfies the SW requirement; local/dev does not. |
| `beforeinstallprompt` | **Supported** on qualifying Chromium. Capture, `preventDefault`, show **Install M.P.A.**, then `prompt()`. |
| `appinstalled` | Use to hide the CTA and record “already installed” locally. |
| Firefox on Android | Often **no** `beforeinstallprompt`. Use Android wording: browser menu → **Add to Home Screen**. Never Apple Share instructions. |
| Standalone | `display-mode: standalone` (and `minimal-ui` / `fullscreen` if ever used). |
| Session persistence | Browser and installed PWA generally **share** first-party cookies for the same origin. Invitation in Chrome then install usually stays signed in. |
| Deep links | Email opens Chrome (or default browser). After install, Chrome may offer “Open in M.P.A.” for in-scope URLs; do not depend on it for accept. |
| Opening when already installed | Home screen / app drawer launches `start_url` → `/dashboard` → Tenant Portal if session + `tenant` role. |
| Browser fallback | Full portal in the tab if the user never installs. |
| Push | Not used. Later optional; never a gate. |
| Icons | Maskable 192/512 exist for Android adaptive icons. |

### 3.2 Android experience to design (after approval)

**When:** Tenant Portal, not standalone, and either:

- **A.** `beforeinstallprompt` fired → primary button **Install M.P.A.** that calls the deferred prompt; or
- **B.** Android-family browser without the event → short **Add M.P.A. to your Home Screen** using that browser’s menu (not Safari Share).

**Do not** show Safari Share artwork or “Add to Home Screen” Apple steps on Android.

If `beforeinstallprompt` never fires, do not block and do not invent a broken Install button.

### 3.3 Android invitation sequence (required)

```
Invitation link
  → Chrome / browser tab
  → Accept / sign in
  → Tenant Portal
  → Optional Install M.P.A. (native sheet) or Android A2HS hint
  → Launch from Home Screen as installed PWA (session usually already present)
```

---

## 4. Desktop (current behavior)

Desktop install is **optional** and secondary to the tenant-phone journey.

| Browser | Install | Design |
|---------|---------|--------|
| Chrome / Edge (Chromium) | `beforeinstallprompt` when installable | Optional “Install M.P.A.” in Tenant Portal (and later staff chrome if Owner wants). Same control as Android Chromium, different placement (not a mobile coaching card). |
| Safari (macOS) | Dock / Home Screen support is not the iPhone Share sheet | Do **not** show iPhone Share steps. If no programmatic prompt, continue in the browser. |
| Firefox (desktop) | Generally not installable as a PWA | Continue in the browser. No install nag. |
| Already installed / standalone window | Detect `display-mode` | Do not ask again. |

Desktop users who never install keep full authorized access in the tab.

---

## 5. Device-aware onboarding (presentation state machine)

Capability detection is a **client presentation helper**. It must never appear in `requireAuthorizedAction`, RLS, invitation accept, or middleware allow/deny.

### 5.1 Signals (prefer capability over UA)

Evaluate in this order:

1. **Installed / standalone**  
   `window.matchMedia("(display-mode: standalone)").matches`  
   OR `window.matchMedia("(display-mode: minimal-ui)").matches`  
   OR `(navigator as Navigator & { standalone?: boolean }).standalone === true`  
   → `experience = installed` — **no install UI**.

2. **Chromium install event**  
   `beforeinstallprompt` received → `experience = chromium_installable`  
   (Android or desktop; distinguish viewport / pointer only for layout, not for Apple copy).

3. **Apple mobile family**  
   Presentation-only: iPhone / iPod UA, or iPad / iPadOS, or Macintosh + `maxTouchPoints > 1`.  
   → `experience = apple_a2hs`  
   Chrome-on-iOS (`CriOS`) stays in this family.

4. **Android family without event**  
   Android UA and no `beforeinstallprompt` after a short wait → `experience = android_manual_a2hs`.

5. **Else**  
   → `experience = browser_only` — no install card.

User-agent is a **hint** for steps 3–4 only. It must not gate APIs or Tenant Portal routes.

### 5.2 When the card may appear

| Allowed | Forbidden |
|---------|-----------|
| Authenticated | Unauthenticated |
| Role includes `tenant` (this slice) | Invitation, login, signup, claim-password, marketing, SaaS checkout |
| Path under `/portal/tenant` | Staff Mission Control / launcher (unless a later approved staff slice) |
| Not `installed` | User dismissed / snoozed |
| Onboarding success already happened | During accept POST or magic-link exchange |

**Onboarding success** for this slice = the tenant can see Tenant Portal Home. That is after invitation accept **or** password/magic-link sign-in. The install card is a child of the portal, not of the accept page.

### 5.3 Dismiss

Store a client preference only (`localStorage` key such as `mpa.pwa.install.dismissed`). Not a membership column. Not authorization. Clearing site data may show the card again — acceptable.

### 5.4 Fail-open

If detection throws, `matchMedia` is missing, or the prompt event is stale: **show nothing** and leave the portal usable.

---

## 6. Manifest and launch rules (for a later implement package)

These are design constraints, not work to do in this Draft.

| Decision | Why |
|----------|-----|
| Keep `start_url` = `/dashboard` | ADR-032: one resolver. Tenant, vendor, owner, and staff all bounce correctly **when a session exists**. |
| Do not set `start_url` to `/portal/tenant` | Staff / Complete / FO Home Screen launches would hit the tenant layout and `/unauthorized`. |
| Set `scope` explicitly to `/` | Invitation URLs stay in-scope for Android link capture where the browser supports it. |
| Do not require SW on `/accept-invitation` | Accept must work if registration failed. |
| Do not add a session token to `start_url` in v1 | Isolated iOS storage is handled by an honest re-sign-in, not a custom handoff protocol. |
| Apple splash images | Optional polish after the instruction card ships; not a gate. |

---

## 7. Push notifications (out of implement scope)

| Rule | Statement |
|------|-----------|
| Current | In-app inbox only. No Web Push. |
| This package | Do not implement push. |
| Later (separate Design → Approve) | Optional; iOS only after Home Screen install; Android optional in browser or PWA; denial must not reduce portal authorization. |

---

## 8. Security and authorization

| Risk | Rule |
|------|------|
| UA spoofing | Detection cannot grant or deny `tenant` access |
| Install as “proof” of identity | Forbidden |
| Push permission as 2FA | Forbidden |
| SW cache as source of truth for money or membership | Forbidden — network / RLS remain authoritative |
| `start_url` query session transfer | Forbidden in v1 |
| Cookie `SameSite=Lax` | Keep; invitation and login are top-level navigations |

---

## 9. Proposed implement slices (only after Approve)

Do not start these while this document is Draft.

| Slice | After approval, implement only |
|-------|--------------------------------|
| **PWA-DETECT** | Presentation helper: standalone, Apple-family, Chromium prompt, Android manual, browser-only. Unit-tested. No auth imports. |
| **PWA-TENANT-CARD** | Tenant Portal-only, dismissible, Canopy Card/Button. Branches: Apple steps / Install button / Android menu hint / hidden. |
| **PWA-CHROMIUM-PROMPT** | `beforeinstallprompt` + `appinstalled` wiring. Used by Android and optional desktop. |
| **PWA-MANIFEST-SCOPE** | Explicit `scope: "/"`. No `start_url` role split. |
| **PWA-SW-SAFE** | Keep production registration; ensure accept/login never await SW; keep network-first for documents. |

Out of those slices: native apps, Web Push, OneSignal, staff install coaching, Canopy token changes, SKU/pricing.

---

## 10. Acceptance criteria (for the later implement package)

1. Tenant invitation → browser → accept/sign-in → Tenant Portal works with SW disabled (dev or blocked).
2. Apple-family + not standalone + on Tenant Portal → Apple Share / Add to Home Screen instructions only.
3. Chromium + `beforeinstallprompt` + on Tenant Portal → Install M.P.A. uses the native sheet; no Apple steps.
4. Android without the event → Android menu hint, not Apple Share.
5. Standalone → zero install prompts.
6. Dismiss → portal remains fully usable; card stays gone for that browser profile.
7. Desktop without installability → no nag.
8. `/dashboard` as `start_url` still routes tenant to `/portal/tenant` via `resolvePostAuthHome`.
9. No middleware, RLS, or accept-route change that reads install state.
10. No native Xcode / Play Store app.

---

## 11. Risks

| Risk | Mitigation |
|------|------------|
| iOS isolated session looks like “install broke login” | Honest copy; login in standalone is allowed |
| Chrome-on-iOS mistaken for Android | Apple-family wins over `beforeinstallprompt` (which will not fire) |
| iPadOS Macintosh UA treated as desktop | Touch + Apple detection |
| SW cache serving stale accept page | Keep network-first for documents; never cache POST |
| Install card on the accept page | Forbidden by §5.2 |
| Staff Home Screen + tenant `start_url` | Forbidden; keep `/dashboard` |

---

## 12. Approval gate

| Status | Meaning |
|--------|---------|
| **Draft** (now) | Audit + design only. No code. |
| **Approved** | Owner authorizes the implement slices in §9 only. |
| Implement | Separate package; cite this doc; Canopy components only. |

Requested Owner decision: **Approve** this device-split, optional-install tenant experience — or return comments. Approval does **not** authorize native apps, Web Push, or a universal install modal.

---

## Final statement

Apple and Android are different products of the same PWA. M.P.A. must coach Apple users through Safari Share → Add to Home Screen, use the native Chromium install UI on Android when it exists, keep desktop optional, and **never** require installation for invitation, sign-in, or Tenant Portal access.
