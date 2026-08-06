# LAUNCH-001 — Property Manager Promise Remediation

**Status:** Approved  
**Authorization:** `AUTHORIZE LAUNCH-001 – PROPERTY MANAGER PROMISE REMEDIATION`  
**Parent:** [LAUNCH-001](../index.md) · [docs/24 Product Architecture](../../24-product-architecture/index.md)  
**Goal:** Move Property Manager Customer Promise Certification from **CONDITIONAL GO** → **GO**

---

## Scope (only)

| Promise | Outcome |
|---------|---------|
| **Documents** | Operational document library for property / resident / lease / maintenance / vendor; SignWell signed lease access; upload + organize |
| **Communications** | Send resident / owner / vendor messages; receive system notifications; view history |

## Out of scope (hard stop)

- Facility Operations  
- CORE-004 expansion  
- Financial Operations expansion (S4+)  
- New platform capabilities beyond completing advertised PM Documents + Communications  

---

## Design — Documents

**Reuse:** Shared Platform `platform.documents` entitlement and `/shared/documents` route; lease text + SignWell metadata on `lease_agreements`; no second document product.

**Schema:** `document_documents` (metadata + content for uploads; links for SignWell/generated).

**Entity types:** `property` · `resident` · `lease` · `maintenance` · `vendor`

**Behaviors:**
1. List/filter/search documents by entity type and name  
2. Upload and attach to an entity (title, category, file/text)  
3. View/download stored content  
4. Surface existing lease documents (generated body + SignWell id/status) in the same library  
5. Access signed SignWell documents when configured (sync + completed artifact / body)  
6. Timeline + audit: `document.uploaded`, `document.viewed` (optional), organize via category  

**Capabilities:** `platform.documents:read` · `platform.documents:write`

---

## Design — Communications

**Reuse:** Existing `financial_notifications` + `maintenance_notifications` write paths; shell NotificationCenter; Resend for optional email; profile notification preferences when sending email.

**Schema:** `comms_messages` (staff → resident/owner/vendor) + `comms_notifications` (in-app delivery for messages).

**Behaviors:**
1. Unified inbox reading FO + maintenance + comms notifications  
2. Compose/send message to resident, owner, or vendor  
3. Communication history (sent + received)  
4. Mark notifications read  
5. Optional email via Resend when configured and preference allows  
6. Timeline + audit: `comms.message.sent`  

**Capabilities:** `platform.communications:read` · `platform.communications:write`

---

## Mission Control

- Quick Actions: Documents → `/shared/documents`, Communications → `/shared/communications`  
- Assistant may recommend Documents/Communications when open maintenance evidence or unread notices matter  

---

## Master Admin

- Launch Readiness evidence panels for Documents + Communications remediation  
- Timeline / audit / journey completion checks  
- Final cert updated to **GO** when both Pass  

---

## Success

Every advertised Property Manager capability is demonstrable begin→end.  
Certification verdict: **GO**.
