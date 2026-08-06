import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";

type RouteContext = {
  params: Promise<{ organizationId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { organizationId } = await context.params;
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("organization_setup_state")
    .select("organization_id, product_confirmed, checklist, completed_at")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    setup: data ?? {
      organization_id: organizationId,
      product_confirmed: false,
      checklist: {},
      completed_at: null
    }
  });
}

export async function PUT(request: Request, context: RouteContext) {
  const { organizationId } = await context.params;
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as {
    checklist?: Record<string, boolean>;
    complete?: boolean;
  } | null;

  if (!payload) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("organization_setup_state")
    .select("checklist, product_confirmed")
    .eq("organization_id", organizationId)
    .maybeSingle();

  const checklist = {
    ...((existing?.checklist as Record<string, boolean> | null) ?? {}),
    ...(payload.checklist ?? {})
  };

  const { data, error } = await supabase
    .from("organization_setup_state")
    .upsert(
      {
        organization_id: organizationId,
        product_confirmed: existing?.product_confirmed ?? Boolean(checklist["product_selected"]),
        checklist,
        completed_at: payload.complete ? new Date().toISOString() : null
      },
      { onConflict: "organization_id" }
    )
    .select("organization_id, product_confirmed, checklist, completed_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ setup: data });
}
