# 03 — Optimal Master Admin Architecture

**Package:** MAC-001  
**Status:** Recommendation (Design) — not authorized to implement  
**Date:** 2026-08-05

---

## 1. Operating model (answer to A vs B)

**Reject pure A** (unrestricted everywhere without mode discipline).  
**Reject pure B** (must View As for every HQ action — unusable for flags/recovery/commercial).

### Adopt Hybrid C — Dual-mode Platform Operator

```
Mission Control (single hub)
├── HQ Operator Mode          ← unrestricted platform tools (audited)
│     health · flags · commercial · recovery · directory · migration ops
└── Customer Surface Mode     ← View As / Test Mode required
      portals · role-product canvases · “act as this human”
```

| Mode | Access style | Examples |
|------|--------------|----------|
| **HQ Operator** | Capability-based MA access to platform tools | Recovery, flags, commercial ops, impersonation directory |
| **Customer Surface** | Enter via View As (real user) or Test Mode (synthetic portal) | Resident/Owner/Manager portals; future true role homes |

**Rule:** Opening a customer-facing product surface as “yourself as MA” without a session mode is a defect once Hybrid C is adopted.

---

## 2. Authorization hardening (before more features)

1. **Single grant source for platform MA** — prefer breakglass app metadata / platform table; remove org-manager ability to allow `master_admin` via ordinary overrides **or** gate override writes for that capability to platform-only.  
2. **Unify middleware + `userHasMasterAdminCapability`** — one function, both planes.  
3. **Session TTL in DB** — expire MA sessions server-side, not cookie-only.  
4. **Mandatory audit** — fail closed or alert if event insert fails for start/end/recovery/impersonation.  
5. **Test Mode isolation** — never fall back to “all org properties”; use demo fixtures or explicit linked demo tenancy only.

---

## 3. Information architecture (ARCH-001)

Keep **one hub**: `/master-admin`.

| Zone (below STD-001 Insights) | Contents |
|-------------------------------|----------|
| Workspace Launcher | Honest Open / View As / Test Mode (label Test Mode only when API-backed) |
| Platform Tools | Health · Flags · Integrations · Billing (SaaS) · Push · Demo seed |
| Customer Directory | Organizations · People · Impersonation (true Audit Explorer separate) |
| Commercial & Migration | After STD-001 remount — still tools/homes under hub IA, not rival launchers |

**Retire or demote:** HQ subnav synonym strip **or** collapse it into sidebar-only (one chrome system).

---

## 4. Consolidations before CORE-004

Do these **before** expanding CORE-004 capability depth so expansion lands on a trustworthy HQ:

| Priority | Consolidation |
|----------|---------------|
| P0 | Auth grant plane + Test Mode isolation (security) |
| P0 | Merge/land STD-001 Class D remount (PR #12) so commercial/financials/migration inherit UDF |
| P1 | Honest Workspace Launcher (Test Mode labeling; Applicant href; Audit Explorer truth) |
| P1 | Move Search below Greeting / into shell Command Search only |
| P1 | Collapse sidebar↔subnav synonyms; fix MA-only metaphor labels |
| P2 | First-class Audit Explorer (read path + filters) — not Impersonation alias |
| P2 | Documents / Reports / Support entries on hub tool rail |
| P3 | True role canvases only when product surfaces exist — until then mark cards “Open closest surface” |

**CORE-004 should inherit Hybrid C + ARCH-001**, not invent new MA launchers.

---

## 5. Workspace Launcher honesty contract

| Action | When shown |
|--------|------------|
| **Open** | Always — closest existing surface |
| **View As** | Always — Impersonation Center (optionally prefiltered) |
| **Test Mode** | **Only** if `portal-test` (or future sandbox API) supports the card |

No silent fallback that pretends Test Mode succeeded.

---

## 6. Success definition (certification bar)

Master Admin is certification-ready when:

1. Critical security items MAC-C01–C03 closed.  
2. Class D Admin homes = 0 on the release branch.  
3. Launcher actions are truthful.  
4. One chrome system; one hub.  
5. Audit Explorer exists or the false card is removed.  
6. A new operator can run support → View As → Test Mode → recovery without synonym hunting.
