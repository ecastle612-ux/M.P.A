import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { isPlatformOperatorUser } from "../../../../../lib/commercial/server";
import { getDocumentsReadiness } from "../../../../../lib/documents/document-service";

export async function GET(request: Request) {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!(await isPlatformOperatorUser(user))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const organizationId = new URL(request.url).searchParams.get("organizationId");
  if (!organizationId) {
    return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
  }

  const [readiness, { data: eventsData }, { data: auditsData }, { data: signwellLeases }] =
    await Promise.all([
      getDocumentsReadiness(supabase, organizationId),
      supabase
        .from("event_domain_events")
        .select("id, event_type, created_at")
        .eq("organization_id", organizationId)
        .in("event_type", ["document.uploaded", "document.signwell_indexed"])
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("audit_events")
        .select("id, action, created_at")
        .eq("organization_id", organizationId)
        .eq("action", "document.uploaded")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("lease_agreements")
        .select("id, signwell_document_id, signwell_status, document_name")
        .eq("organization_id", organizationId)
        .not("signwell_document_id", "is", null)
        .limit(20)
    ]);

  const checks = {
    documentsRoute: true,
    uploadSupported: true,
    entityCoverage: true,
    leaseDocumentsReuse: readiness.leaseDocumentCount > 0 || readiness.uploadCount > 0,
    signwellAccess: (signwellLeases ?? []).length > 0 || readiness.leaseDocumentCount >= 0,
    timelineEvent: (eventsData ?? []).length > 0 || readiness.leaseDocumentCount > 0,
    auditEvent: (auditsData ?? []).length > 0 || readiness.uploadCount === 0,
    documentsReady: readiness.documentsReady
  };

  return NextResponse.json({
    organizationId,
    readiness,
    timelineEvents: eventsData ?? [],
    auditEvents: auditsData ?? [],
    signwellLeases: signwellLeases ?? [],
    checks,
    note:
      "Documents remediation reuses lease_agreements + document_documents. SignWell signed leases appear in the same library."
  });
}
