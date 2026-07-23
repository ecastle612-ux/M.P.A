# 15 — Real-World Pilot (Phase 11)

**Package:** PMX-004  
**Amendment:** 03  
**Phase:** **11** (after Phase 10 Production Validation)  
**Status:** Binding for COMPLETE · Execution **PENDING**  
**Rule:** No workflow in this pilot may fail. Any failure blocks COMPLETE until fixed and re-run.

---

## 1. Purpose

Lab checklists and Lighthouse are necessary but insufficient. Phase 11 proves M.P.A. behaves as a premium installed PWA on **real devices** under production (or production-equivalent) conditions.

PMX-004 **cannot** be marked COMPLETE until this pilot PASSes.

---

## 2. Minimum device matrix

| Device | OS | Browser / mode | Required |
| --- | --- | --- | --- |
| Samsung Galaxy (mid or flagship) | Current stable Android | Chrome · installed PWA | ✔ |
| Google Pixel | Current stable Android | Chrome · installed PWA | ✔ |
| iPhone | Current iOS | Safari · Add to Home Screen standalone | ✔ |
| iPad | Latest iPadOS | Safari · Add to Home Screen standalone | ✔ |

Optional enrichment (not a substitute for the four above): Samsung Internet on Galaxy.

Record for each: model, OS version, browser version, date, build/deploy ID.

---

## 3. Pilot workflow script (every device)

Execute **in order** on each required device. Mark PASS/FAIL per step. **No step may FAIL.**

| Step | Workflow | PASS criteria |
| --- | --- | --- |
| 1 | Install PWA | Android: install via in-app prompt or browser affordance → launches standalone. iOS/iPad: A2HS → launches without Safari chrome |
| 2 | Enable notifications | Permission granted; device registered; Master Admin / Settings shows healthy device |
| 3 | Login | Existing credentials; session established in standalone |
| 4 | Push while app closed | Force-quit / remove from recents; send test or real notify; notification appears |
| 5 | Notification deep link | Tap opens **correct** screen (not wrong dump to dashboard unless that is the correct target) |
| 6 | Create maintenance request | WO created successfully in standalone |
| 7 | Upload photos | Camera or library; upload succeeds (UX-010 path) |
| 8 | Scan / capture documents | Document or image capture for an allowlisted flow succeeds |
| 9 | Lose internet | Airplane mode / disable network; app shows offline affordance; no crash |
| 10 | Offline queue | Perform allowlisted offline action (note/photo/message per Phase 7); item shows pending |
| 11 | Restore internet | Queue syncs; server reflects **one** successful entity; SyncStatus clears |
| 12 | Send messages | Thread send/receive works in standalone |
| 13 | Process payments | Tenant or billing path: Stripe Checkout round-trip **returns** to authenticated M.P.A. (Accepted-with-return OK) |
| 14 | Generate reports | Report generate/view/download per Phase 4 disposition; no unexpected browser leave (or documented return) |
| 15 | Sign documents | E-sign progress / provider path; return to app per Phase 4 disposition |
| 16 | No unexpected browser launches | Throughout steps 1–15: no surprise exit to browser except Accepted-with-return flows that return successfully |

### Role coverage

| Role | Minimum on pilot |
| --- | --- |
| Property Manager | Steps 1–7, 9–12, 14 on Galaxy + Pixel + iPhone |
| Tenant (or PM impersonation where policy allows) | Payments step 13 on at least one Android + iPhone |
| Vendor token `/v/[token]` | Photo upload step on at least one Android |
| Owner | Open documents/reports on at least one device without unexpected exit |
| iPad | Steps 1–5, 6–7, 9–11, 16 (full script preferred) |

---

## 4. Results matrix (fill during pilot)

| Step | Samsung Galaxy | Google Pixel | iPhone | iPad |
| --- | --- | --- | --- | --- |
| 1 Install | PENDING | PENDING | PENDING | PENDING |
| 2 Notifications | PENDING | PENDING | PENDING | PENDING |
| 3 Login | PENDING | PENDING | PENDING | PENDING |
| 4 Push closed | PENDING | PENDING | PENDING | PENDING |
| 5 Deep link | PENDING | PENDING | PENDING | PENDING |
| 6 Maintenance | PENDING | PENDING | PENDING | PENDING |
| 7 Photos | PENDING | PENDING | PENDING | PENDING |
| 8 Documents scan | PENDING | PENDING | PENDING | PENDING |
| 9 Offline | PENDING | PENDING | PENDING | PENDING |
| 10 Queue | PENDING | PENDING | PENDING | PENDING |
| 11 Sync | PENDING | PENDING | PENDING | PENDING |
| 12 Messages | PENDING | PENDING | PENDING | PENDING |
| 13 Payments | PENDING | PENDING | PENDING | PENDING |
| 14 Reports | PENDING | PENDING | PENDING | PENDING |
| 15 Sign | PENDING | PENDING | PENDING | PENDING |
| 16 No surprise browser | PENDING | PENDING | PENDING | PENDING |

**Device verdict:** PASS only if all required steps for that device are PASS.  
**Phase 11 verdict:** PASS only if all four devices PASS.

---

## 5. Evidence package

Store under `artifacts/phase-11-pilot/` (no secrets):

- Device info sheet  
- Screenshots/video per failed-or-key step (install, push, offline sync, payment return)  
- Notification deep-link targets exercised  
- Deploy/git SHA  
- Funnel KPI snapshot ([14](./14-installation-success-funnel.md))  
- UX matrix roll-up ([13](./13-native-ux-acceptance-matrix.md))  

---

## 6. Failure handling

1. File defect with severity.  
2. Sev-1/2 → fix → re-run **failed device full script** (not only the one step).  
3. Do not mark Phase 11 PASS with open Sev-1/2.  
4. Accepted-with-return flows (Stripe, e-sign) failing to return = FAIL.

---

## 7. Relationship to other phases

| Phase | Relationship |
| --- | --- |
| 6 Push certification | Feeds steps 4–5; Phase 11 re-proves on the four devices |
| 7 Offline | Feeds steps 9–11 |
| 10 Production validation | Internal regression; Phase 11 is external real-device proof |
| 13 UX matrix | Must be PASS (or waived) before or as part of Phase 11 closeout |
| 14 Funnel | KPI report attached to Phase 11 evidence |

---

## 8. Closeout sign-off

| Field | Value |
| --- | --- |
| Pilot start | |
| Pilot end | |
| Deploy ID | |
| Phase 11 verdict | ☐ PASS · ☐ FAIL |
| Lead Architect | |
| Product | |
| Notes | |
