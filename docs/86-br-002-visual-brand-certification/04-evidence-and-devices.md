# BR-002 — Evidence and Devices

## Required deliverables

### 1) Before / after

For every surface whose presentation changes under BR-002:

| Artifact | Requirement |
| --- | --- |
| Before | Screenshot of BR-001 (or prior) treatment |
| After | Screenshot of BR-002 purpose-optimized treatment |
| Reason | One sentence: why this variant was chosen for the purpose |

Store under:

```text
docs/86-br-002-visual-brand-certification/evidence/
  before/
  after/
```

Naming: `{surface}-{device}-{theme}-{before|after}.png`  
Examples: `login-phone-dark-after.png`, `drawer-phone-light-after.png`

### 2) Device matrix

Capture (as applicable per surface):

| Device | Viewport target |
| --- | --- |
| Phone | ~390×844 |
| Tablet | ~768×1024 |
| Desktop | ~1440×900 |

### 3) Theme matrix

| Theme | When required |
| --- | --- |
| Light | All light product surfaces |
| Dark | Auth dark shell, dark theme app chrome, dark email header |

### 4) Final PASS/FAIL table

Mirror [03-surface-audit-matrix.md](./03-surface-audit-matrix.md). Overall sprint PASS only if every surface is PASS.

## How to capture

Preferred:

1. Local or preview deploy  
2. Real device or Playwright full-page screenshots at the viewports above  
3. Human review of images (not only CI pixel match)

CI visual tests (BR-001 Amendment D) remain useful regression guards **after** human baselines are approved — they do not replace human YES/NO answers.

## Empty evidence folder

Create `evidence/before` and `evidence/after` when implementation begins; commit screenshots with the certification close-out (or link to a Design Partner review board if binaries are stored elsewhere — document the link here).
