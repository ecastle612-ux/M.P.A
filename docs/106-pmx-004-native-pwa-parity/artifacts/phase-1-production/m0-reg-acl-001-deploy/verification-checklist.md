# REG-ACL-001 Deploy — Verification Checklist

**Date:** 2026-07-24  
**Deploy:** `dpl_HFdpfdy5jS8kdQKSUKa6iKcU4hBf`  
**SoT:** [31a](../../../../113-core-003-implementation-master-plan/31a-reg-acl-001-deployment.md)

| # | Check | Result |
|---|-------|--------|
| 1 | Production READY + aliases | ✅ PASS |
| 2 | REG-ACL files present in working tree / ship scope | ✅ PASS |
| 3 | `ops-shell-access` unit tests 4/4 | ✅ PASS |
| 4 | Anon `/properties` → `/login` | ✅ PASS |
| 5 | Anon `/dashboard` → `/login` | ✅ PASS |
| 6 | Anon `/setup` → `/login` | ✅ PASS |
| 7 | Anon `/master-admin` → `/login` | ✅ PASS |
| 8 | Anon `/api/properties` → 401 | ✅ PASS |
| 9 | No REG-ACL migrations | ✅ PASS (none required) |
| 10 | No env changes | ✅ PASS |
| 11 | No new membership roles | ✅ PASS |
| 12 | Authenticated ACL matrix | ⏸ Deferred — Production Verification |
| 13 | Implemented-role regression | ⏸ Deferred — Production Verification |
