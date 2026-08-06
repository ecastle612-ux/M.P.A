import { NextResponse } from "next/server";
import { createServiceRoleClient } from "../../../../../lib/supabase/service-role";
import { isSignWellCompletedStatus, verifySignWellWebhook } from "../../../../../lib/signwell/client";
import { activateSignedLease } from "../../../../../lib/leasing/lease-service";

type SignWellWebhookBody = {
  event?: {
    type?: string;
    time?: string;
    hash?: string;
    related_signer?: unknown;
  };
  data?: {
    object?: {
      id?: string;
      status?: string;
      metadata?: Record<string, string>;
    };
  };
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as SignWellWebhookBody | null;
  if (!body?.event?.type || !body.data?.object?.id) {
    return NextResponse.json({ error: "Invalid SignWell payload" }, { status: 400 });
  }

  const eventType = body.event.type;
  const eventTime = body.event.time ?? "";
  const hash = body.event.hash ?? "";
  if (!verifySignWellWebhook({ eventType, eventTime, hash })) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  const documentId = body.data.object.id;
  const documentStatus = body.data.object.status ?? eventType;
  const metadata = body.data.object.metadata ?? {};
  const organizationId = metadata["organization_id"] ?? null;
  const leaseIdFromMeta = metadata["lease_id"] ?? null;

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch {
    return NextResponse.json({ error: "Service role unavailable" }, { status: 503 });
  }

  await supabase.from("signwell_webhook_events").upsert(
    {
      organization_id: organizationId,
      event_id: `${eventType}:${documentId}:${eventTime}`,
      event_type: eventType,
      document_id: documentId,
      payload: body
    },
    { onConflict: "event_type,document_id,event_id", ignoreDuplicates: true }
  );

  if (eventType !== "document_completed" && !isSignWellCompletedStatus(documentStatus)) {
    return NextResponse.json({ ok: true, ignored: true, eventType });
  }

  let leaseQuery = supabase
    .from("lease_agreements")
    .select("id, organization_id, status")
    .eq("signwell_document_id", documentId)
    .limit(1);
  if (leaseIdFromMeta) {
    leaseQuery = supabase
      .from("lease_agreements")
      .select("id, organization_id, status")
      .eq("id", leaseIdFromMeta)
      .limit(1);
  }

  const { data: leases, error } = await leaseQuery;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  const lease = leases?.[0];
  if (!lease) {
    return NextResponse.json({ ok: true, unmatched: true });
  }

  try {
    await activateSignedLease(supabase, lease.organization_id as string, null, lease.id as string, {
      channel: "signwell",
      signwellStatus: documentStatus
    });
    return NextResponse.json({ ok: true, activated: true, leaseId: lease.id });
  } catch (activateError) {
    return NextResponse.json(
      {
        error: activateError instanceof Error ? activateError.message : "Activation failed"
      },
      { status: 400 }
    );
  }
}
