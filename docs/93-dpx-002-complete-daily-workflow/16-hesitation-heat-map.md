# 16 — Hesitation Heat Map

**Package:** DPX-002  
**Phase:** 2  
**Legend:** 🔴 Hard stop · 🟠 High hesitation · 🟡 Medium · 🟢 Low

```
Dashboard 🟢─────────────────────────────🟡 competing CTAs
    │
    ▼
Find Property 🟢/🟡 ── filters / Menu / Search
    │
    ▼
Open Property 🔴 CRASH ───────────────────── BLOCKS PATH
    │
    ▼
Open Resident 🔴 ERROR ───────────────────── BLOCKS PATH
    │
    ▼
Lease 🟠 (est.) module jump
    │
    ▼
Payment 🟠 (est.) module jump
    │
    ▼
Create WO 🟡 (est.) form
    │
    ▼
Assign Vendor 🔴 CRASH on WO detail
    │
    ▼
Message Resident 🟠 unscoped /communications
    │
    ▼
Notify Owner 🟠 no in-path action
    │
    ▼
Dashboard 🟢
```

**Hottest nodes:** Property detail · Resident detail · Work order detail · Message · Owner notify.
