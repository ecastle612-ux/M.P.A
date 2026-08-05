# 04 — Regression Checklist

**Package:** MAC-002  
**Date:** 2026-08-05

Automated: unit suites for access grant, launcher catalog, NAV-001 nav, STD-001 view-models — **pass**.

| Surface | Check | Result |
|---------|-------|--------|
| Master Admin grant | app_metadata only; overrides blocked | ✅ code + migration |
| Middleware / API | Same JWT flag semantics | ✅ |
| Mission Control | Greeting before Search; Workspace Launcher present | ✅ |
| Workspace Launcher | Test Mode only for resident/owner/manager | ✅ |
| View As | Still → Impersonation Center | ✅ unchanged |
| Test Mode Resident | Demo only | ✅ |
| Test Mode Owner | Demo only; no all-org properties | ✅ |
| Commercial / Financials / Migration | UDF remount | ✅ |
| Non-MA `/portal` | Availability hub preserved | ✅ (MA redirects) |
| Portal destinations | `/portal/tenant\|owner\|manager` preserved | ✅ |
| Audit Explorer card | Absent | ✅ |
| Session TTL | 8h server enforce | ✅ |
| Audit events | Fail on insert error | ✅ |

### Manual soak (operator)

- [ ] Bootstrap MA with `dev_master_admin` app_metadata  
- [ ] Apply migration `20260805010000_mac002_…`  
- [ ] Confirm org admin cannot insert `master_admin` override  
- [ ] Launch Resident/Owner/Manager Test Mode — demo only, banner correct  
- [ ] View As → Impersonation → exit  
- [ ] Open Commercial / Financials / Migration — UDF present  
- [ ] Bookmark `/portal` and `/master-admin/dashboards` as MA — redirect to hub  
