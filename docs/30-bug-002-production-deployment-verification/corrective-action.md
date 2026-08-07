# Corrective Action — BUG-002

**Date:** 2026-08-07  
**Rule:** No application functionality changes in this package. Deployment/process only.

---

## Why production still shows the auth homepage

BUG-001 (PR #44) fixed root routing in a **feature branch**. Production tracks **`main`**.  
`main` @ `a37e565` still contains:

```ts
redirect("/login");
```

Therefore the live domain correctly executes the legacy behavior.

---

## Required corrective action (exact)

1. **Merge PR #44** (`cursor/bug-001-public-homepage-routing-f5dd`) into `main` after review.  
2. Confirm Vercel creates a **Production – m-p-a-web** deployment for the merge commit and status is **success**.  
3. Confirm `https://www.my-property-assistant.com/` returns **200** marketing HTML (no 307 to `/login`).  
4. Confirm login CTA still works (`/login`) and protected routes still require auth.  
5. In Vercel dashboard for **`m-p-a-web` → Domains**, confirm `www.my-property-assistant.com` (and apex if used) are attached to that project.  
6. Investigate duplicate project **`mpa`**: Production for `a37e565` **failed**; decide whether to repair or disconnect it so it cannot confuse aliases/CI.

---

## Not required

- Purging CDN for `/` (root is already `MISS` / no-store).  
- Re-implementing the marketing page (already in PR #44).  
- Changing permissions, subscriptions, or business logic.

---

## Optional hardening after merge

- Fix failing Vercel Preview builds on PR branches (`dpl_6LHZysCVq3t3SeZ68eosQTDys4Fi`, `dpl_36h8bHx8PWELxVmCMDRH59mPyDcs`) so future homepage changes can be previewed.  
- Authenticate Vercel MCP/CLI in the agent environment for direct domain/deployment inspection next time.

---

## STOP

Await merge + successful `m-p-a-web` Production deploy. Do not begin Capital Projects.