# 12 — Risk Assessment

**Package:** VENDOR-001  
**Status:** Draft — Ready for Approval

| Risk | Severity | Mitigation |
|------|----------|------------|
| Stolen QR used by wrong person | High | Short TTL after complete; revoke on reassignment; optional start PIN later |
| Token enumeration | High | High entropy; hash at rest; rate limit |
| PII on shared phone | Medium | Minimal fields; clear session cookie controls |
| Invoice fraud | Medium | PM approve gate; amount caps optional |
| Scope creep into accounting | Medium | ADR-010; Mark Paid + history only in B |
| Conflict with marketplace ADR-004 | Low | Org vendor Phase A; marketplace Phase C |
| Bypass authenticated portal expectations | Low | Portal remains; token is additive |
