import { NextResponse } from "next/server";
import { isRecentRecordType } from "@mpa/shared";
import { requireStaffSearch } from "../../../../../lib/simplicity/staff-search-authz";
import { resolveRecentStaffItems } from "../../../../../lib/simplicity/staff-search-service";

export async function POST(request: Request) {
  const authz = await requireStaffSearch();
  if ("error" in authz) {
    return authz.error;
  }

  const payload = (await request.json().catch(() => null)) as { items?: unknown } | null;
  const items = Array.isArray(payload?.items)
    ? payload.items.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const rec = item as { type?: unknown; id?: unknown };
        if (typeof rec.type !== "string" || typeof rec.id !== "string" || !isRecentRecordType(rec.type)) {
          return [];
        }
        return [{ type: rec.type, id: rec.id }];
      })
    : [];

  try {
    const results = await resolveRecentStaffItems(authz, items);
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Resolve failed" },
      { status: 400 }
    );
  }
}
