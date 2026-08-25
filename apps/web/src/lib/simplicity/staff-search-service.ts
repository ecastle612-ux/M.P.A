import type { SupabaseClient } from "@supabase/supabase-js";
import {
  authorizedQuickCreateActions,
  authorizedSearchDomains,
  EMPTY_SEARCH_DESTINATION_HREFS,
  isTechnicianOnlySearchActor,
  matchReasonFor,
  sanitizeSearchPresentation,
  sanitizeStaffSearchQuery,
  searchCatalogForSku,
  staffAssetHref,
  staffLeaseHref,
  staffPropertyHref,
  staffPmPlanHref,
  staffRequestFormHref,
  staffResidentHref,
  staffSearchDomainLabel,
  staffSearchQueryIsUseful,
  staffUnitHref,
  staffVendorHref,
  staffWorkOrderHref,
  recurrenceLabel,
  STAFF_SEARCH_PER_DOMAIN_CAP,
  STAFF_SEARCH_TOTAL_CAP,
  suggestedCreatesForFailedSearch,
  type QuickCreateAction,
  type RecentItemRef,
  type SearchResultItem,
  type StaffSearchDomain,
  type StaffSearchResult
} from "@mpa/shared";
import type { AuthorizedAction } from "../auth/require-authorized-action";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export type StaffSearchHit = StaffSearchResult & {
  kind: string;
};

export type StaffSearchResponse = {
  query: string;
  results: StaffSearchHit[];
  destinations: SearchResultItem[];
  creates: QuickCreateAction[];
  suggestedCreates: QuickCreateAction[];
};

type SearchActor = {
  sku: AuthorizedAction["sku"];
  roles: string[];
  storedScope: AuthorizedAction["storedScope"];
  entitlements: readonly string[];
  userId: string;
};

function asSingle<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function likeOr(columns: string[], query: string): string {
  return columns.map((column) => `${column}.ilike.%${query}%`).join(",");
}

function presentation(...parts: Array<string | null | undefined>): string {
  return sanitizeSearchPresentation(parts.filter((part) => Boolean(part && part.trim())).join(" · "));
}

function toActor(authz: AuthorizedAction): SearchActor {
  return {
    sku: authz.sku,
    roles: authz.roles,
    storedScope: authz.storedScope,
    entitlements: authz.entitlements,
    userId: authz.user.id
  };
}

function facilityBuilding(actor: SearchActor): boolean {
  return !actor.entitlements.includes("pm.properties");
}

function vendorIsFacility(actor: SearchActor): boolean {
  return !actor.entitlements.includes("pm.vendors");
}

async function assignedAssetIds(supabase: Db, organizationId: string, userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("maintenance_work_orders")
    .select("facility_asset_id")
    .eq("organization_id", organizationId)
    .eq("work_surface", "facility")
    .eq("technician_user_id", userId)
    .not("facility_asset_id", "is", null);
  if (error) throw new Error(error.message);
  return [
    ...new Set(
      (data ?? [])
        .map((row) => row.facility_asset_id as string | null)
        .filter((id): id is string => Boolean(id))
    )
  ];
}

async function searchProperties(
  supabase: Db,
  organizationId: string,
  query: string,
  actor: SearchActor
): Promise<StaffSearchHit[]> {
  const { data, error } = await supabase
    .from("property_properties")
    .select("id, name, city, status, property_units(id)")
    .eq("organization_id", organizationId)
    .ilike("name", `%${query}%`)
    .order("name")
    .limit(STAFF_SEARCH_PER_DOMAIN_CAP);
  if (error) throw new Error(error.message);
  const building = facilityBuilding(actor);
  return (data ?? []).map((row) => {
    const unitCount = Array.isArray(row.property_units) ? row.property_units.length : 0;
    return {
      domain: "property" as const,
      recordId: String(row.id),
      kind: staffSearchDomainLabel("property", { facilityBuilding: building }),
      title: sanitizeSearchPresentation(String(row.name ?? "Untitled")),
      subtitle: presentation(building ? null : `${unitCount} units`, row.city as string | null),
      matchReason: matchReasonFor({
        query,
        haystacks: [{ label: "name", value: row.name as string }]
      }),
      href: staffPropertyHref({ propertyId: String(row.id), facilityBuilding: building })
    };
  });
}

async function searchUnits(
  supabase: Db,
  organizationId: string,
  query: string
): Promise<StaffSearchHit[]> {
  const { data: properties, error: propertyError } = await supabase
    .from("property_properties")
    .select("id, name")
    .eq("organization_id", organizationId);
  if (propertyError) throw new Error(propertyError.message);
  const propertyIds = (properties ?? []).map((row) => String(row.id));
  if (propertyIds.length === 0) return [];
  const names = new Map((properties ?? []).map((row) => [String(row.id), String(row.name)]));
  const { data, error } = await supabase
    .from("property_units")
    .select("id, unit_label, property_id")
    .in("property_id", propertyIds)
    .ilike("unit_label", `%${query}%`)
    .limit(STAFF_SEARCH_PER_DOMAIN_CAP);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    domain: "unit" as const,
    recordId: String(row.id),
    kind: staffSearchDomainLabel("unit"),
    title: sanitizeSearchPresentation(String(row.unit_label ?? "Unit")),
    subtitle: presentation(names.get(String(row.property_id))),
    matchReason: matchReasonFor({
      query,
      haystacks: [{ label: "unit", value: row.unit_label as string }]
    }),
    href: staffUnitHref(String(row.property_id))
  }));
}

async function searchResidents(
  supabase: Db,
  organizationId: string,
  query: string
): Promise<StaffSearchHit[]> {
  const { data, error } = await supabase
    .from("pm_residents")
    .select("id, display_name, first_name, last_name, email, property_properties(name), property_units(unit_label)")
    .eq("organization_id", organizationId)
    .or(likeOr(["display_name", "first_name", "last_name", "email"], query))
    .order("display_name")
    .limit(STAFF_SEARCH_PER_DOMAIN_CAP);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const property = asSingle(row.property_properties as { name?: string } | { name?: string }[] | null);
    const unit = asSingle(row.property_units as { unit_label?: string } | { unit_label?: string }[] | null);
    return {
      domain: "resident" as const,
      recordId: String(row.id),
      kind: staffSearchDomainLabel("resident"),
      title: sanitizeSearchPresentation(String(row.display_name ?? "Resident")),
      subtitle: presentation(unit?.unit_label, property?.name),
      matchReason: matchReasonFor({
        query,
        haystacks: [
          { label: "name", value: row.display_name as string },
          { label: "first name", value: row.first_name as string },
          { label: "last name", value: row.last_name as string }
        ]
      }),
      href: staffResidentHref(String(row.id))
    };
  });
}

async function searchLeases(
  supabase: Db,
  organizationId: string,
  query: string
): Promise<StaffSearchHit[]> {
  const [{ data: residents }, { data: properties }, { data: units }] = await Promise.all([
    supabase
      .from("pm_residents")
      .select("id")
      .eq("organization_id", organizationId)
      .or(likeOr(["display_name", "first_name", "last_name"], query)),
    supabase.from("property_properties").select("id").eq("organization_id", organizationId).ilike("name", `%${query}%`),
    supabase.from("property_units").select("id, property_id, unit_label").ilike("unit_label", `%${query}%`)
  ]);
  const residentIds = (residents ?? []).map((row) => String(row.id));
  const propertyIds = (properties ?? []).map((row) => String(row.id));
  const unitIds = (units ?? []).map((row) => String(row.id));
  if (residentIds.length + propertyIds.length + unitIds.length === 0) return [];

  let request = supabase
    .from("lease_agreements")
    .select(
      "id, status, property_id, unit_id, resident_id, property_properties(name), property_units(unit_label), pm_residents!resident_id(display_name)"
    )
    .eq("organization_id", organizationId)
    .limit(STAFF_SEARCH_PER_DOMAIN_CAP);
  const filters: string[] = [];
  if (residentIds.length) filters.push(`resident_id.in.(${residentIds.join(",")})`);
  if (propertyIds.length) filters.push(`property_id.in.(${propertyIds.join(",")})`);
  if (unitIds.length) filters.push(`unit_id.in.(${unitIds.join(",")})`);
  request = request.or(filters.join(","));
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const property = asSingle(row.property_properties as { name?: string } | { name?: string }[] | null);
    const unit = asSingle(row.property_units as { unit_label?: string } | { unit_label?: string }[] | null);
    const resident = asSingle(row.pm_residents as { display_name?: string } | { display_name?: string }[] | null);
    return {
      domain: "lease" as const,
      recordId: String(row.id),
      kind: staffSearchDomainLabel("lease"),
      title: sanitizeSearchPresentation(resident?.display_name || property?.name || "Lease"),
      subtitle: presentation(unit?.unit_label, property?.name, String(row.status ?? "")),
      matchReason: matchReasonFor({
        query,
        haystacks: [
          { label: "resident", value: resident?.display_name ?? null },
          { label: "property", value: property?.name ?? null },
          { label: "unit", value: unit?.unit_label ?? null }
        ]
      }),
      href: staffLeaseHref(String(row.id))
    };
  });
}

async function searchWorkOrders(
  supabase: Db,
  organizationId: string,
  query: string,
  actor: SearchActor,
  surface: "residential" | "facility"
): Promise<StaffSearchHit[]> {
  const technicianOnly = isTechnicianOnlySearchActor(actor.roles);
  let request = supabase
    .from("maintenance_work_orders")
    .select(
      "id, title, status, request_number, facility_asset_label, facility_asset_code, technician_user_id, work_surface, property_properties(name), property_units(unit_label)"
    )
    .eq("organization_id", organizationId)
    .eq("work_surface", surface)
    .or(likeOr(["title", "request_number", "facility_asset_label", "facility_asset_code"], query))
    .order("submitted_at", { ascending: false })
    .limit(STAFF_SEARCH_PER_DOMAIN_CAP);
  if (technicianOnly) {
    request = request.eq("technician_user_id", actor.userId);
  }
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  const domain: StaffSearchDomain = surface === "facility" ? "facility_work_order" : "pm_work_order";
  return (data ?? []).map((row) => {
    const property = asSingle(row.property_properties as { name?: string } | { name?: string }[] | null);
    const unit = asSingle(row.property_units as { unit_label?: string } | { unit_label?: string }[] | null);
    const requestNumber = typeof row.request_number === "string" ? row.request_number : null;
    return {
      domain,
      recordId: String(row.id),
      kind: staffSearchDomainLabel(domain),
      title: sanitizeSearchPresentation(requestNumber || String(row.title ?? "Work order")),
      subtitle: presentation(
        requestNumber ? String(row.title ?? "") : null,
        property?.name,
        unit?.unit_label,
        String(row.status ?? "")
      ),
      matchReason: matchReasonFor({
        query,
        haystacks: [
          { label: "request number", value: requestNumber },
          { label: "title", value: row.title as string },
          { label: "asset", value: row.facility_asset_label as string },
          { label: "asset tag", value: row.facility_asset_code as string }
        ]
      }),
      href: staffWorkOrderHref({
        surface,
        workOrderId: String(row.id),
        technicianOnly,
        assignedToViewer: row.technician_user_id === actor.userId
      })
    };
  });
}

async function searchAssets(
  supabase: Db,
  organizationId: string,
  query: string,
  actor: SearchActor
): Promise<StaffSearchHit[]> {
  const technicianOnly = isTechnicianOnlySearchActor(actor.roles);
  let request = supabase
    .from("facility_assets")
    .select(
      "id, name, asset_code, serial_number, status, building_label, floor_label, department_label, room_label, property_properties(name)"
    )
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .or(
      likeOr(
        ["name", "asset_code", "serial_number", "building_label", "floor_label", "department_label", "room_label"],
        query
      )
    )
    .order("name")
    .limit(STAFF_SEARCH_PER_DOMAIN_CAP);
  if (technicianOnly) {
    const ids = await assignedAssetIds(supabase, organizationId, actor.userId);
    if (ids.length === 0) return [];
    request = request.in("id", ids);
  }
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const property = asSingle(row.property_properties as { name?: string } | { name?: string }[] | null);
    return {
      domain: "asset" as const,
      recordId: String(row.id),
      kind: staffSearchDomainLabel("asset"),
      title: sanitizeSearchPresentation(String(row.name ?? "Asset")),
      subtitle: presentation(
        row.asset_code as string,
        property?.name,
        row.floor_label as string,
        row.department_label as string
      ),
      matchReason: matchReasonFor({
        query,
        haystacks: [
          { label: "name", value: row.name as string },
          { label: "tag", value: row.asset_code as string },
          { label: "serial", value: row.serial_number as string },
          { label: "department", value: row.department_label as string },
          { label: "location", value: row.building_label as string }
        ]
      }),
      href: staffAssetHref(String(row.id))
    };
  });
}

async function searchVendors(
  supabase: Db,
  organizationId: string,
  query: string,
  actor: SearchActor
): Promise<StaffSearchHit[]> {
  const { data, error } = await supabase
    .from("vendor_vendors")
    .select("id, name, status")
    .eq("organization_id", organizationId)
    .ilike("name", `%${query}%`)
    .order("name")
    .limit(STAFF_SEARCH_PER_DOMAIN_CAP);
  if (error) throw new Error(error.message);
  const facility = vendorIsFacility(actor);
  return (data ?? []).map((row) => ({
    domain: "vendor" as const,
    recordId: String(row.id),
    kind: staffSearchDomainLabel("vendor"),
    title: sanitizeSearchPresentation(String(row.name ?? "Vendor")),
    subtitle: presentation(String(row.status ?? "")),
    matchReason: matchReasonFor({
      query,
      haystacks: [{ label: "name", value: row.name as string }]
    }),
    href: `${staffVendorHref({ facility, vendorId: String(row.id) })}?q=${encodeURIComponent(String(row.name ?? query))}`
  }));
}

async function searchPmPlans(
  supabase: Db,
  organizationId: string,
  query: string
): Promise<StaffSearchHit[]> {
  const { data, error } = await supabase
    .from("facility_pm_plans")
    .select("id, name, status, recurrence_kind, interval_n, next_due_on, facility_assets(name)")
    .eq("organization_id", organizationId)
    .neq("status", "inactive")
    .or(likeOr(["name", "description"], query))
    .order("name")
    .limit(STAFF_SEARCH_PER_DOMAIN_CAP);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const asset = asSingle(row.facility_assets as { name?: string } | { name?: string }[] | null);
    return {
      domain: "pm_plan" as const,
      recordId: String(row.id),
      kind: staffSearchDomainLabel("pm_plan"),
      title: sanitizeSearchPresentation(String(row.name ?? "Preventive Maintenance")),
      subtitle: presentation(
        recurrenceLabel(row.recurrence_kind as "monthly", Number(row.interval_n ?? 1)),
        row.next_due_on ? `Next due ${row.next_due_on}` : null,
        asset?.name
      ),
      matchReason: matchReasonFor({
        query,
        haystacks: [{ label: "name", value: row.name as string }]
      }),
      href: staffPmPlanHref(String(row.id))
    };
  });
}

async function searchRequestForms(
  supabase: Db,
  organizationId: string,
  query: string
): Promise<StaffSearchHit[]> {
  const { data, error } = await supabase
    .from("facility_request_forms")
    .select("id, name, status")
    .eq("organization_id", organizationId)
    .ilike("name", `%${query}%`)
    .order("name")
    .limit(STAFF_SEARCH_PER_DOMAIN_CAP);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    domain: "request_form" as const,
    recordId: String(row.id),
    kind: staffSearchDomainLabel("request_form"),
    title: sanitizeSearchPresentation(String(row.name ?? "Request form")),
    subtitle: presentation(String(row.status ?? "")),
    matchReason: matchReasonFor({
      query,
      haystacks: [{ label: "name", value: row.name as string }]
    }),
    href: staffRequestFormHref(String(row.id))
  }));
}

function destinationsFor(actor: SearchActor, query: string): SearchResultItem[] {
  const catalog = searchCatalogForSku(actor.sku, query, {
    roles: actor.roles,
    storedScope: actor.storedScope
  });
  if (query.trim()) {
    return catalog.slice(0, 8);
  }
  const preferred = new Set<string>(EMPTY_SEARCH_DESTINATION_HREFS);
  return catalog.filter((item) => preferred.has(item.href)).slice(0, 8);
}

export async function runStaffSearch(
  authz: AuthorizedAction,
  rawQuery: string
): Promise<StaffSearchResponse> {
  const actor = toActor(authz);
  const domains = authorizedSearchDomains(actor);
  const creates = authorizedQuickCreateActions(actor);
  const query = sanitizeStaffSearchQuery(rawQuery);
  const useful = staffSearchQueryIsUseful(query);

  const destinationResults = destinationsFor(actor, useful ? query : "");
  if (!useful) {
    return {
      query,
      results: [],
      destinations: destinationResults,
      creates,
      suggestedCreates: []
    };
  }

  const tasks: Array<Promise<StaffSearchHit[]>> = [];
  const run = (domain: StaffSearchDomain, task: () => Promise<StaffSearchHit[]>) => {
    if (domains.includes(domain)) {
      tasks.push(task());
    }
  };

  run("property", () => searchProperties(authz.supabase, authz.organizationId, query, actor));
  run("unit", () => searchUnits(authz.supabase, authz.organizationId, query));
  run("resident", () => searchResidents(authz.supabase, authz.organizationId, query));
  run("lease", () => searchLeases(authz.supabase, authz.organizationId, query));
  run("pm_work_order", () => searchWorkOrders(authz.supabase, authz.organizationId, query, actor, "residential"));
  run("facility_work_order", () => searchWorkOrders(authz.supabase, authz.organizationId, query, actor, "facility"));
  run("asset", () => searchAssets(authz.supabase, authz.organizationId, query, actor));
  run("vendor", () => searchVendors(authz.supabase, authz.organizationId, query, actor));
  run("request_form", () => searchRequestForms(authz.supabase, authz.organizationId, query));
  run("pm_plan", () => searchPmPlans(authz.supabase, authz.organizationId, query));

  const groups = await Promise.all(tasks);
  const results = groups.flat().slice(0, STAFF_SEARCH_TOTAL_CAP);
  return {
    query,
    results,
    destinations: destinationResults,
    creates,
    suggestedCreates: results.length === 0 ? suggestedCreatesForFailedSearch(query, creates) : []
  };
}

async function resolveOne(
  supabase: Db,
  organizationId: string,
  actor: SearchActor,
  item: Pick<RecentItemRef, "type" | "id">
): Promise<StaffSearchHit | null> {
  const domains = authorizedSearchDomains(actor);
  const technicianOnly = isTechnicianOnlySearchActor(actor.roles);
  if (!domains.includes(item.type)) return null;

  if (item.type === "property") {
    const { data } = await supabase
      .from("property_properties")
      .select("id, name, city")
      .eq("organization_id", organizationId)
      .eq("id", item.id)
      .maybeSingle();
    if (!data) return null;
    const building = facilityBuilding(actor);
    return {
      domain: "property",
      recordId: String(data.id),
      kind: staffSearchDomainLabel("property", { facilityBuilding: building }),
      title: sanitizeSearchPresentation(String(data.name ?? "Untitled")),
      subtitle: presentation(data.city as string | null),
      matchReason: "Recent",
      href: staffPropertyHref({ propertyId: String(data.id), facilityBuilding: building })
    };
  }

  if (item.type === "resident") {
    const { data } = await supabase
      .from("pm_residents")
      .select("id, display_name, property_properties(name), property_units(unit_label)")
      .eq("organization_id", organizationId)
      .eq("id", item.id)
      .maybeSingle();
    if (!data) return null;
    const property = asSingle(data.property_properties as { name?: string } | { name?: string }[] | null);
    const unit = asSingle(data.property_units as { unit_label?: string } | { unit_label?: string }[] | null);
    return {
      domain: "resident",
      recordId: String(data.id),
      kind: staffSearchDomainLabel("resident"),
      title: sanitizeSearchPresentation(String(data.display_name ?? "Resident")),
      subtitle: presentation(unit?.unit_label, property?.name),
      matchReason: "Recent",
      href: staffResidentHref(String(data.id))
    };
  }

  if (item.type === "asset") {
    if (technicianOnly) {
      const ids = await assignedAssetIds(supabase, organizationId, actor.userId);
      if (!ids.includes(item.id)) return null;
    }
    const { data } = await supabase
      .from("facility_assets")
      .select("id, name, asset_code, department_label, floor_label, property_properties(name)")
      .eq("organization_id", organizationId)
      .eq("id", item.id)
      .is("deleted_at", null)
      .maybeSingle();
    if (!data) return null;
    const property = asSingle(data.property_properties as { name?: string } | { name?: string }[] | null);
    return {
      domain: "asset",
      recordId: String(data.id),
      kind: staffSearchDomainLabel("asset"),
      title: sanitizeSearchPresentation(String(data.name ?? "Asset")),
      subtitle: presentation(data.asset_code as string, property?.name, data.department_label as string),
      matchReason: "Recent",
      href: staffAssetHref(String(data.id))
    };
  }

  if (item.type === "facility_work_order" || item.type === "pm_work_order") {
    const surface = item.type === "facility_work_order" ? "facility" : "residential";
    let request = supabase
      .from("maintenance_work_orders")
      .select("id, title, status, request_number, technician_user_id, work_surface")
      .eq("organization_id", organizationId)
      .eq("id", item.id)
      .eq("work_surface", surface);
    if (technicianOnly) {
      request = request.eq("technician_user_id", actor.userId);
    }
    const { data } = await request.maybeSingle();
    if (!data) return null;
    return {
      domain: item.type,
      recordId: String(data.id),
      kind: staffSearchDomainLabel(item.type),
      title: sanitizeSearchPresentation(String(data.request_number || data.title || "Work order")),
      subtitle: presentation(data.request_number ? String(data.title) : null, String(data.status ?? "")),
      matchReason: "Recent",
      href: staffWorkOrderHref({
        surface,
        workOrderId: String(data.id),
        technicianOnly,
        assignedToViewer: data.technician_user_id === actor.userId
      })
    };
  }

  if (item.type === "pm_plan") {
    const { data } = await supabase
      .from("facility_pm_plans")
      .select("id, name, status, recurrence_kind, interval_n, next_due_on")
      .eq("organization_id", organizationId)
      .eq("id", item.id)
      .maybeSingle();
    if (!data || data.status === "inactive") return null;
    return {
      domain: "pm_plan",
      recordId: String(data.id),
      kind: staffSearchDomainLabel("pm_plan"),
      title: sanitizeSearchPresentation(String(data.name ?? "Preventive Maintenance")),
      subtitle: presentation(
        recurrenceLabel(data.recurrence_kind as "monthly", Number(data.interval_n ?? 1)),
        data.next_due_on ? `Next due ${data.next_due_on}` : null
      ),
      matchReason: "Recent",
      href: staffPmPlanHref(String(data.id))
    };
  }

  if (item.type === "vendor") {
    const { data } = await supabase
      .from("vendor_vendors")
      .select("id, name, status")
      .eq("organization_id", organizationId)
      .eq("id", item.id)
      .maybeSingle();
    if (!data) return null;
    return {
      domain: "vendor",
      recordId: String(data.id),
      kind: staffSearchDomainLabel("vendor"),
      title: sanitizeSearchPresentation(String(data.name ?? "Vendor")),
      subtitle: presentation(String(data.status ?? "")),
      matchReason: "Recent",
      href: `${staffVendorHref({ facility: vendorIsFacility(actor), vendorId: String(data.id) })}?q=${encodeURIComponent(String(data.name ?? ""))}`
    };
  }

  return null;
}

export async function resolveRecentStaffItems(
  authz: AuthorizedAction,
  items: Array<Pick<RecentItemRef, "type" | "id">>
): Promise<StaffSearchHit[]> {
  const actor = toActor(authz);
  const unique = items.filter(
    (item, index, all) => all.findIndex((other) => other.type === item.type && other.id === item.id) === index
  );
  const resolved = await Promise.all(
    unique.slice(0, 8).map((item) => resolveOne(authz.supabase, authz.organizationId, actor, item))
  );
  return resolved.filter((item): item is StaffSearchHit => Boolean(item));
}
