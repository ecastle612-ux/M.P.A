# R1 Remediation Report

## Problem

Account creation (`apps/web/src/components/shell/login-form.tsx`) showed:

- “Selected plan from checkout”
- “Commercial operations confirms paid subscription during onboarding.”

## Fix

Replaced with premium customer language:

> Your selected plan, **{label}**, is saved. Create your account to continue Guided Setup. Enterprise pricing and billing are finalized during onboarding.

## Constraints honored

| Constraint | Status |
|------------|--------|
| No redesign | Pass |
| No new features | Pass |
| No Capital Projects | Pass |
| No commercial flow change | Pass |
| No authentication change | Pass |
| Guided Setup unchanged | Pass |

## Functionality

Unchanged: `intent` parsing, plan label display gate (`selectedPlanLabel && mode === "sign_up"`), auth modes, redirects.
