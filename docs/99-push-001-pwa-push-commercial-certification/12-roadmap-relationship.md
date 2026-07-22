# 12 — Roadmap Relationship

**Package:** PUSH-001  
**Status:** Draft — part of PUSH-001 approval  

---

## Relationship to prior packages

| Package | Role |
| --- | --- |
| API-001 | Notification operating layer (stands) |
| API-001A | Enrollment / settings / ops widgets (stands; certification gaps close here) |
| ADR-017 | OneSignal primary provider (stands) |
| DPX-003 | Commercial polish; **G4 push real-device PASS moves here** |

## Amendment

| Before | After |
| --- | --- |
| DPX-003 G4 owns commercial push PASS | **PUSH-001** owns commercial push PASS |
| DPX-003 can still polish push-adjacent UX | Must not claim push PASS without PUSH-001 |

DPX-003 other gates (theme, empty states, tenant IA, etc.) may proceed independently; **package-level commercial readiness for push** requires PUSH-001 = PASS.

## Sequencing

1. Approve PUSH-001  
2. Implement phases 1→9 with real-device loops  
3. Certify PASS  
4. Only then treat Design Partner launch-critical push as closed  
