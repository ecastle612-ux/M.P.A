import { NextResponse } from "next/server";
import { isCommsAudienceType } from "@mpa/shared";
import { requireCommunicationsPermission } from "../../../../lib/communications/authz";
import {
  listCommunicationHistory,
  sendOperationalMessage
} from "../../../../lib/communications/communications-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authz = await requireCommunicationsPermission("platform.communications:read");
  if ("error" in authz) {
    return authz.error;
  }

  const { searchParams } = new URL(request.url);
  const audienceParam = searchParams.get("audienceType") ?? "all";
  const audienceType =
    audienceParam === "all"
      ? "all"
      : isCommsAudienceType(audienceParam)
        ? audienceParam
        : null;
  if (!audienceType) {
    return NextResponse.json({ error: "Invalid audienceType" }, { status: 400 });
  }

  try {
    const q = searchParams.get("q");
    const messages = await listCommunicationHistory(authz.supabase, authz.organizationId, {
      audienceType,
      ...(q ? { query: q } : {})
    });
    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load history" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const authz = await requireCommunicationsPermission("platform.communications:write");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const body = (await request.json()) as {
      audienceType?: string;
      subject?: string;
      body?: string;
      channel?: string;
      residentId?: string;
      vendorId?: string;
      ownerUserId?: string;
      propertyId?: string;
    };
    if (!body.audienceType || !body.subject || !body.body) {
      return NextResponse.json(
        { error: "audienceType, subject, and body are required" },
        { status: 400 }
      );
    }
    const message = await sendOperationalMessage(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      {
        audienceType: body.audienceType,
        subject: body.subject,
        body: body.body,
        ...(body.channel ? { channel: body.channel } : {}),
        ...(body.residentId ? { residentId: body.residentId } : {}),
        ...(body.vendorId ? { vendorId: body.vendorId } : {}),
        ...(body.ownerUserId ? { ownerUserId: body.ownerUserId } : {}),
        ...(body.propertyId ? { propertyId: body.propertyId } : {})
      }
    );
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send message" },
      { status: 400 }
    );
  }
}
