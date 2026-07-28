# 18 — M0 Lighthouse Recovery

**Package:** CORE-003 · M0 Production Readiness  
**Date:** 2026-07-23  
**Status:** Lighthouse execution ✅ **RECOVERED** · Historical Perf **66** (hard ≥95 later **superseded** by [24](./24-core-003-amd-m0-perf-framework-limit.md)) · M0 overall ❌ **NO-GO**  
**Application code changes:** None  
**UX-012 / implementation slices:** Not authorized · not started  

Parent report: [14-m0-production-readiness-report.md](./14-m0-production-readiness-report.md)

---

## 1. Root cause of Lighthouse failure

### Symptom (prior M0 session)

```
Unable to connect to Chrome
no lh report
```

### Root cause (confirmed)

| Factor | Finding |
|--------|---------|
| Chrome installed? | ✅ Yes — Google Chrome **150.0.7871.184** at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` |
| Prior command | `npx lighthouse … --chrome-flags="--headless --no-sandbox"` **without** `--chrome-path` |
| Failure mode | `chrome-launcher` could not open a usable Chrome instance in that shell context → “Unable to connect to Chrome” |
| Contributing factor | Agent shell had a **broken/incomplete PATH** earlier in the session (`curl`/`tr`/`head` missing until PATH was reset), which can also break launcher discovery |
| Not the cause | Missing Chromium install; Playwright headless shell alone was not required once system Chrome path was explicit |

**Conclusion:** Environment / launcher configuration failure — **not** an application defect. Chrome was present; Lighthouse was invoked without a reliable executable path (and under a degraded PATH).

---

## 2. Environment corrections

| Correction | Detail |
|------------|--------|
| Explicit Chrome path | `--chrome-path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"` |
| Headless flags | `--chrome-flags="--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage"` |
| PATH hygiene | Ensure `/usr/bin:/bin:/usr/local/bin` present before `npx` |
| Avoid | Running with `--preset=perf` **and** mixed category flags in one confused pass (can yield null TBT/TTI and a bogus Performance **0**) |
| Reusable runner | `docs/106-pmx-004-native-pwa-parity/artifacts/phase-1-production/lighthouse/run-lighthouse-m0.sh` |
| Optional env | `CHROME_PATH` override supported by the runner |

**Do not** paste production secrets into chat. No Vercel/app config changes were required for Lighthouse recovery.

---

## 3. Fresh Lighthouse reports

**URL:** `https://www.my-property-assistant.com/login`  
**Tool:** lighthouse@12.6.0 · mobile form factor · Chrome 150 headless=new  
**Fetch time:** 2026-07-23T23:36:50.360Z  

### Archive location

`docs/106-pmx-004-native-pwa-parity/artifacts/phase-1-production/lighthouse/`

| Artifact | Path |
|----------|------|
| HTML | `login.report.html` (+ `login-m0-recovery.report.html`) |
| JSON | `login.report.json` (+ `login-m0-recovery.report.json`) |
| Metrics sidecar | `login.metrics.json` |
| Screenshot | `login.final-screenshot.jpg` |
| Timestamped archive | `archive/login-m0-recovery.2026-07-23T233712Z.report.{json,html}` |
| Smoke proof | `archive/m0-recovery-smoke.2026-07-23T233712Z.json` (Perf **61**) |
| Runner | `run-lighthouse-m0.sh` |

### Scores (fresh)

| Category | Score | vs prior (59 Perf) | Target |
|----------|------:|--------------------|--------|
| **Performance** | **66** | ↑ from 59 | ≥ **95** ❌ |
| Accessibility | **96** | same | Prefer ≥90 ✅ |
| Best Practices | **100** | same | Prefer ≥90 ✅ |
| SEO | **61** | newly measured | N/A for private beta (`noindex`) |
| PWA (LH12 category) | _not emitted_ | LH 12 removed PWA category | Use install/SW device cert + server probes |

### Core Web Vitals / lab metrics

| Metric | Value | Assessment |
|--------|-------|------------|
| FCP | 1.3 s | Good |
| LCP | 2.6 s | Needs work (logo IMG) |
| **TBT** | **4,370 ms** | **Critical — primary score killer** |
| CLS | 0 | Excellent |
| Speed Index | 3.1 s | Acceptable |
| TTI | 6.9 s | Poor |

---

## 4. Performance breakdown

### Primary bottleneck: main-thread JavaScript

| Signal | Evidence |
|--------|----------|
| Total Blocking Time | **4,370 ms** (score ~0.01) |
| Long tasks | **20** long tasks |
| Worst long task | `2gi8x86d4aupk.js` ~**1,889 ms** |
| Other heavy chunks | `3o8-xma2kdh0c.js` (~623 ms + more), turbopack runtime, login document work |
| Main-thread (prior broken run) | Script evaluation dominated ~4.5 s+ |

Largest script transfers on `/login`:

| Asset | Transfer | Decoded |
|-------|----------:|---------:|
| `3asfnzxk2uhe6.js` | ~122 KiB | ~496 KiB |
| `3o8-xma2kdh0c.js` | ~72 KiB | ~226 KiB |
| `3z0skvqe8waxw.js` | ~38 KiB | ~135 KiB |
| `2gi8x86d4aupk.js` | ~10 KiB | ~44 KiB (**high CPU relative to size**) |

### LCP element

Mobile LCP = logo `<img src="/branding/logo-light.png">` (160×160 displayed).

LCP phase split (approx): TTFB 26% · Load Delay 31% · Load Time 6% · **Render Delay 37%**.

### Image opportunities

| Audit | Est. savings |
|-------|----------------|
| Serve next-gen formats (WebP/AVIF) | ~102 KiB · ~640 ms |
| Properly size images | ~43 KiB · ~380 ms |

Both light + dark logos download on the login shell (~117 KiB combined PNG).

### Other

| Item | Notes |
|------|-------|
| Unused CSS | ~10 KiB / ~300 ms opportunity |
| Third parties | None attributed on this run (OneSignal not in critical path for cold `/login` lab) |
| Server TTFB | Short (~20–30 ms) — not the problem |
| SEO 61 | Driven by intentional `noindex` / crawl blocks — **not** a perf remediation target for private beta |

---

## 5. Ranked optimization opportunities

| Rank | Opportunity | Impact on Perf score | Est. improvement (points, rough) | Notes |
|------|-------------|----------------------|----------------------------------:|-------|
| **1** | Cut main-thread work / TBT (split, defer, remove login-path JS) | **Critical** | **+20 to +35** | Must get TBT from ~4.3 s toward &lt;200–300 ms for ≥90 territory |
| **2** | Identify & shrink hot chunk `2gi8x86d4aupk.js` (CPU) | Critical | Included in #1 | Small transfer, huge long task — profile in DevTools |
| **3** | Reduce/defer `3o8-xma2kdh0c.js` + large shared chunks on auth route | High | **+8 to +15** | Route-level code splitting for `/login` |
| **4** | Convert logos to AVIF/WebP + serve one theme variant | Medium | **+3 to +8** | Also helps LCP |
| **5** | Responsive/sized logo assets | Medium | **+2 to +5** | |
| **6** | Trim unused CSS on auth shell | Low–Med | **+1 to +3** | |
| **7** | Font subset / fewer faces on login | Low | **+0 to +2** | Three woff2 already; secondary |
| **8** | SEO crawlability | None for M0 GO | 0 | Keep `noindex` until public launch decision |

**Reaching ≥95** requires treating **#1–#3 as mandatory**. Image-only work will **not** hit 95 while TBT stays multi-second.

---

## 6. Estimated score improvements (plan only — no fixes applied)

| Scenario | Expected Perf | Risk |
|----------|---------------:|------|
| Images only (WebP/AVIF + sizing) | ~70–78 | Low |
| Images + unused CSS + font trim | ~72–80 | Low |
| Auth-route JS split / defer non-critical (+ images) | ~85–92 | Medium (auth/session regressions) |
| Aggressive login island / minimal client JS + images | **≥95 possible** | **High** — must not break auth, SW registration, theme |

These are planning estimates from lab metrics, not guarantees.

---

## 7. Phase D — M0 remediation plan (prioritized; **do not implement yet**)

### R1 — Profile and reduce login main-thread JS

| Field | Content |
|-------|---------|
| **Problem** | TBT 4,370 ms; 20 long tasks; hot chunks on `/login` |
| **Impact** | Blocks Perf ≥95 |
| **Est. score gain** | +20–35 |
| **Risk** | Auth/session/SW regressions |
| **Recommended fix** | Chrome Performance panel on `/login`; map chunk hashes → modules; defer non-auth UI; dynamic import for non-critical providers; ensure SW registration does not block interaction |
| **Dependencies** | DevTools profile; Next.js bundle analyzer |
| **Regression risk** | **High** — login, theme, SW |

### R2 — Auth-route bundle boundary

| Field | Content |
|-------|---------|
| **Problem** | Shared app chunks (~122 KiB + ~72 KiB) loaded for a simple sign-in form |
| **Impact** | High CPU + parse/compile |
| **Est. score gain** | +8–15 |
| **Risk** | Medium–High |
| **Recommended fix** | Isolate `(auth)` layout client graph; postpone portal/dashboard providers until post-login |
| **Dependencies** | R1 profile |
| **Regression risk** | Medium |

### R3 — Logo / LCP image pipeline

| Field | Content |
|-------|---------|
| **Problem** | PNG logos; both light+dark fetched; LCP is logo with large render delay |
| **Impact** | Medium |
| **Est. score gain** | +3–8 |
| **Risk** | Low |
| **Recommended fix** | AVIF/WebP; dimension-matched assets; load only active theme logo |
| **Dependencies** | Brand assets |
| **Regression risk** | Low (visual) |

### R4 — CSS trim on auth shell

| Field | Content |
|-------|---------|
| **Problem** | Unused CSS ~10 KiB opportunity |
| **Impact** | Low–Med |
| **Est. score gain** | +1–3 |
| **Risk** | Low |
| **Recommended fix** | CSS partitioning / avoid global app CSS on auth where safe |
| **Dependencies** | Design system ownership (later UX-012) |
| **Regression risk** | Low–Med visual |

### Explicitly deferred (not M0 blind optimization)

- SEO uncrawlable / `noindex` (product decision)  
- Full-app EP-019 performance program (broader than `/login`)  
- OneSignal load-path changes without push regression plan  

**Gate:** Performance code changes begin only after Product/Architect review of this plan (separate authorize / kickoff). This document does **not** authorize those changes.

---

## 8. Remaining M0 blockers

| ID | Blocker | Status after this doc |
|----|---------|------------------------|
| **M0-LH-EXEC** | Lighthouse cannot run | ✅ **CLEARED** |
| **M0-LH-FRESH** | Fresh reports required | ✅ **CLEARED** |
| **M0-LH-PERF** | Performance ≥95 | ❌ **FAIL** (66) — remediation plan ready, fixes not started |
| **M0-GATE-1** | Real-device PMX T1–T7 | ❌ Still open |
| **M0-PAY-1** | PAY-001 verification | ❌ Still FAIL |
| **M0-ENV-1** | Prod secret attestation | ❌ Still open |
| **M0-REG-1** | Authenticated regression | ❌ Still open |

---

## 9. Updated GO / NO-GO decision

| Field | Result |
|-------|--------|
| Lighthouse executes successfully | ✅ **YES** |
| Fresh reports generated | ✅ **YES** |
| Performance remediation plan completed | ✅ **YES** (this doc §5–§7) |
| Performance ≥95 | ❌ **NO** (66) |
| Critical production blockers resolved | ❌ **NO** (devices, PAY-001, etc.) |
| **M0 Production Readiness** | ❌ **NO-GO** |
| **Authorize UX-012 Slice A?** | ❌ **NO** |

### Unlock reminder

M0 remains **NO-GO** until Production Readiness report flips to **GO**.  
Do **not** issue `AUTHORIZE UX-012 SLICE A` based on Lighthouse recovery alone.

---

## How to re-run

```bash
docs/106-pmx-004-native-pwa-parity/artifacts/phase-1-production/lighthouse/run-lighthouse-m0.sh
```
