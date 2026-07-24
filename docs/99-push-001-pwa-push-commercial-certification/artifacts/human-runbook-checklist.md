# PUSH-001 Human Device Checklist

**Use with:** [13-launch-readiness-execution.md](../13-launch-readiness-execution.md)  
**Production:** `https://www.my-property-assistant.com`  
**Known good PUSH repair SHA (as of 2026-07-24 cert FAIL session):** `8b46d70`  
**Return phrase:** `RESUME PUSH-001 REAL-DEVICE CERTIFICATION — evidence attached`

Fill one block per device. Attach screenshots to `devices/`, `deep-links/`, `delivery-matrix/`.

---

## Device A — Android Chrome PWA

| Field | Value |
|-------|--------|
| Tester | |
| Device model | |
| OS version | |
| Chrome version | |
| Installed to Home Screen? | ☐ |
| Permission granted? | ☐ |
| MA diagnostics healthy? | ☐ |
| Single SW = `OneSignalSDKWorker.js`? | ☐ |

| Check | Pass | Screenshot / note |
|-------|------|-------------------|
| Send Test appears | ☐ | |
| Tap → expected URL | ☐ | |
| Foreground | ☐ | |
| Background | ☐ | |
| Cold kill → tap | ☐ | |
| Badge (if applicable) | ☐ | |

---

## Device B — iPhone Safari PWA (A2HS)

| Field | Value |
|-------|--------|
| Tester | |
| Device model | |
| iOS version | |
| Safari / installed PWA | |
| Add to Home Screen? | ☐ |
| Permission granted? | ☐ |
| MA diagnostics healthy? | ☐ |

| Check | Pass | Screenshot / note |
|-------|------|-------------------|
| Send Test appears (installed PWA) | ☐ | |
| Tap → expected URL | ☐ | |
| Foreground | ☐ | |
| Background | ☐ | |
| Cold kill → tap | ☐ | |
| Safari tab limitation noted (if any) | ☐ | |

---

## Device C — Desktop Chrome

| Field | Value |
|-------|--------|
| Tester | |
| OS | |
| Chrome version | |
| Browser vs installed PWA | |
| Permission granted? | ☐ |
| MA diagnostics healthy? | ☐ |

| Check | Pass | Screenshot / note |
|-------|------|-------------------|
| Send Test | ☐ | |
| Foreground / background / cold | ☐ | |
| Deep link | ☐ | |

---

## Device D — Desktop Edge

| Field | Value |
|-------|--------|
| Tester | |
| OS | |
| Edge version | |
| Permission granted? | ☐ |
| MA diagnostics healthy? | ☐ |

| Check | Pass | Screenshot / note |
|-------|------|-------------------|
| Send Test | ☐ | |
| Foreground / background / cold | ☐ | |
| Deep link | ☐ | |

---

## Role matrix smoke (minimum)

Trigger each on a device that is enrolled for that role. Record Pass + deep-link URL landed.

| Role | Event | Deep link expect | Pass | Evidence file |
|------|-------|------------------|------|---------------|
| Tenant | New message | `/portal/tenant/messages?thread=…` | ☐ | |
| Tenant | Payment received | `/portal/tenant/payments` | ☐ | |
| Tenant | Maintenance update | `/portal/tenant/maintenance/{id}` | ☐ | |
| Tenant | Announcement | `/portal/tenant/announcements/{id}` | ☐ | |
| PM | New maintenance | `/maintenance/{id}` | ☐ | |
| PM | Vendor accepted | `/maintenance/{id}` | ☐ | |
| PM | Resident message | `/communications/threads/{id}` | ☐ | |
| Owner | Statement ready | `/portal/owner` | ☐ | |
| MA | Test + diagnostics | MA notifications | ☐ | |

Deferred (do not fake PASS): Owner payout initiated/completed; MA ops-alert catalog.

---

## Failures (if any)

| Scenario | Expected | Actual | Severity | RCA / remediation |
|----------|----------|--------|----------|-------------------|
| | | | | |
