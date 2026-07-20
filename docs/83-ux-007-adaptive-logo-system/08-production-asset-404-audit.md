# UX-007 Production Asset 404 Audit

**Date:** 2026-07-20  
**Scope:** Production 404 investigation for `/branding/logo-light.png` and `/branding/logo-dark.png`.

## Questions Answered First

### Where are the approved logo files located?

Both files exist locally in the correct Next.js public static asset directory:

- `apps/web/public/branding/logo-light.png`
- `apps/web/public/branding/logo-dark.png`

### What URL does the application generate?

The shared branding system generates root-relative URLs:

- `/branding/logo-light.png`
- `/branding/logo-dark.png`

Email fixtures and Supabase recovery HTML resolve those against `NEXT_PUBLIC_APP_URL`, producing:

- `https://www.my-property-assistant.com/branding/logo-light.png`

### Do those URLs work locally?

Yes.

- `http://127.0.0.1:3000/branding/logo-light.png` returned `HTTP 200`, `content-type: image/png`, `content-length: 62256`.
- `http://127.0.0.1:3000/branding/logo-dark.png` returned `HTTP 200`, `content-type: image/png`, `content-length: 54754`.

### Did those URLs work on the deployed site before the fix?

No.

- `https://www.my-property-assistant.com/branding/logo-light.png` returned `HTTP 404`.
- `https://www.my-property-assistant.com/branding/logo-dark.png` returned `HTTP 404`.
- Vercel response included `x-matched-path: /404` and `x-vercel-cache: HIT`, confirming the deployed filesystem did not have those static assets.

### If not, why?

The production alias was still pointing at deployment `dpl_DqNA61ZZUAYuyfqmpFcU8BQCfDAr`, created before UX-007 branding assets were deployed. Vercel project metadata confirmed that deployment was from the earlier INT-303 email commit, not the current UX-007 working tree.

Local git evidence also showed the approved PNGs were present in the working tree but not tracked yet:

```text
?? apps/web/public/branding/logo-dark.png
?? apps/web/public/branding/logo-light.png
```

That combination explains the mismatch:

- Local Next.js served the PNGs because they existed in `apps/web/public/branding`.
- Production returned 404 because the live Vercel deployment did not include those files.
- The paths were correct; the production deployment artifact was stale/missing assets.

## Config Audit

- `next.config.ts` has no `basePath`.
- `next.config.ts` has no `assetPrefix`.
- `vercel.json` uses Next.js framework output from `apps/web/.next`.
- `apps/web/vercel.json` uses Next.js framework output from `.next` when the project root is `apps/web`.
- `.vercelignore` does not exclude `apps/web/public` or `apps/web/public/branding`.
- `.gitignore` does not exclude `apps/web/public/branding`.
- No build script was found that removes or renames `public/branding` assets.

## Build Verification

Local Vercel production build was run under Node 24:

```text
pnpm dlx --package node@24 --package vercel -- vercel build --prod --yes
```

The build completed successfully. The Vercel output contained:

- `.vercel/output/static/branding/logo-light.png`
- `.vercel/output/static/branding/logo-dark.png`

This confirmed that Next.js and Vercel static asset handling are correct when the files are included in the deployment input.

## Fix Applied

Deployed the prebuilt Vercel output to production without changing asset paths:

```text
pnpm dlx --package node@24 --package vercel -- vercel deploy --prebuilt --prod
```

New production deployment:

- `dpl_A3hqtYcGyeE7MCXwjfiQn2XzhWQc`
- `https://m-p-a-qudzodb07-ecastle612-uxs-projects.vercel.app`

## Post-Fix Verification

Canonical production domain now serves both approved assets:

- `https://www.my-property-assistant.com/branding/logo-light.png` returned `HTTP 200`, `content-type: image/png`, `content-length: 62256`, `x-matched-path: /branding/logo-light.png`.
- `https://www.my-property-assistant.com/branding/logo-dark.png` returned `HTTP 200`, `content-type: image/png`, `content-length: 54754`, `x-matched-path: /branding/logo-dark.png`.

The deployment URL itself is protected by Vercel SSO and returns `HTTP 302`, but the public custom domain used by runtime pages and emails now returns `HTTP 200`.

## Root Cause

The 404 was a deployment artifact/version mismatch, not an application path bug.

The approved logo files were present locally and Next.js served them correctly, but production was running an older Vercel deployment that did not contain the UX-007 PNG assets. Vercel then cached the 404 response for those missing static paths. Redeploying the current build output with the assets included corrected the production filesystem and cleared the user-facing failure.

## Source-Control Closure

The approved PNGs were verified as not ignored by `.gitignore`, added to the UX-007 release commit, and verified from a clean clone build. Future Git-based deployments will include:

- `apps/web/public/branding/logo-light.png`
- `apps/web/public/branding/logo-dark.png`

The retired asset remains removed:

- `apps/web/public/branding/mpa-logo.svg`
