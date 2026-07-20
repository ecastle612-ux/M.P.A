# UX-007 - Context And Problem

## Background

Prior branding packages standardized earlier logo assets and wrappers, but the official policy has changed. The new policy introduces exactly two canonical raster logo files:

- Light-mode logo file for dark surfaces
- Dark-mode logo file for light surfaces

If the product continues to use direct logo imports or per-surface ad-hoc logic, drift is inevitable:

- Wrong logo contrast on some screens
- Inconsistent auth/portal/marketing/email/PDF branding
- Regression risk whenever UI themes or backgrounds change

## Problem statement

Current logo usage is not governed by one runtime contract that can guarantee:

1. Correct contrast selection by surface background  
2. One policy for web, email, and PDF outputs  
3. A single migration path away from legacy logo files

## Why this is a material change

This package changes cross-surface branding architecture, not just cosmetics:

- It replaces historical single-logo assumptions
- It introduces enforceable runtime selection rules
- It affects all visual channels, including generated artifacts

Per Implementation Gate, this requires design + documentation + approval before implementation.

## Success definition

M.P.A. branding is considered stable only when:

- All rendered logos come from the two approved assets
- Runtime selection is automatic and deterministic
- Direct legacy logo references are removed or blocked
- Certification can prove zero fallback to deprecated logo assets
