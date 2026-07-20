# 10 — Production Checklist (Design Partner Go-Live)

**Package:** RC-001  
Complete before enabling the first Design Partner org.

---

## Engineering

- [ ] `pnpm check:boundaries` pass  
- [ ] `pnpm lint` pass  
- [ ] `pnpm typecheck` pass  
- [ ] `pnpm test` pass (≥ 106)  
- [ ] `pnpm build` pass  
- [ ] Latest migrations applied to target Supabase project  
- [ ] `pnpm qa:e2e:smoke` pass with auth enabled  

## Security

- [ ] No secrets in repo or client bundles  
- [ ] `*_ALLOW_SIMULATE=false` outside CI  
- [ ] Service role server-only  
- [ ] Partner staff on least-privilege roles  

## Providers (as contracted)

- [ ] Supabase Auth + Storage configured  
- [ ] Checkr sandbox **or** documented noop screening  
- [ ] Dropbox Sign sandbox **or** documented noop signing  
- [ ] Stripe test **or** documented noop payments  
- [ ] Optional OneSignal for push  
- [ ] Webhook URLs registered  

## Product / legal

- [ ] Known Limitations acknowledged in writing  
- [ ] Owner/Vendor portals confirmed out of scope  
- [ ] Scale guidance (&lt; 50 units) accepted  
- [ ] Feedback channel established  

## Manual UAT (must pass)

- [ ] Scenario 1 — New PM company path  
- [ ] Scenario 2 — Applicant → payment path (sandbox)  
- [ ] Scenario 3 — Migration sample (if partner migrates)  
- [ ] Scenario 4 — Maintenance assign → complete  

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product | | | |
| Engineering | | | |
| Design Partner lead | | | |
