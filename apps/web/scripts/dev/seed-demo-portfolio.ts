import type { SupabaseClient } from "@supabase/supabase-js";

type SeedClient = SupabaseClient;

export type SeedCounts = {
  properties: number;
  units: number;
  tenants: number;
  leases: number;
  workOrders: number;
  vendors: number;
  rentCharges: number;
  payments: number;
  expenses: number;
  ownerStatements: number;
  aiInsights: number;
  announcements: number;
};

const PROPERTY_SEEDS = [
  {
    name: "Maple Court Apartments",
    code: "MAPLE",
    propertyType: "apartment" as const,
    addressLine1: "1200 Maple Court",
    city: "Austin",
    stateRegion: "TX",
    postalCode: "78701"
  },
  {
    name: "Harbor View Townhomes",
    code: "HARBOR",
    propertyType: "townhome" as const,
    addressLine1: "88 Harbor View Lane",
    city: "Seattle",
    stateRegion: "WA",
    postalCode: "98101"
  },
  {
    name: "Summit Commercial Plaza",
    code: "SUMMIT",
    propertyType: "commercial" as const,
    addressLine1: "500 Summit Boulevard",
    city: "Denver",
    stateRegion: "CO",
    postalCode: "80202"
  }
] as const;

const TENANT_FIRST_NAMES = [
  "Avery",
  "Jordan",
  "Taylor",
  "Morgan",
  "Riley",
  "Casey",
  "Quinn",
  "Hayden",
  "Parker",
  "Reese",
  "Cameron",
  "Dakota",
  "Skyler",
  "Emerson",
  "Finley",
  "Harper",
  "Logan",
  "Sage"
] as const;

const TENANT_LAST_NAMES = [
  "Brooks",
  "Chen",
  "Diaz",
  "Ellis",
  "Foster",
  "Garcia",
  "Hayes",
  "Ibrahim",
  "Johnson",
  "Kim",
  "Lopez",
  "Martin",
  "Nguyen",
  "Owens",
  "Patel",
  "Reed",
  "Singh",
  "Turner"
] as const;

const VENDOR_SEEDS = [
  { businessName: "BrightFix Plumbing", services: ["plumbing"] },
  { businessName: "Northwind HVAC", services: ["hvac"] },
  { businessName: "GreenLeaf Landscaping", services: ["landscaping"] },
  { businessName: "Spark Electric Co.", services: ["electrical"] },
  { businessName: "SafeGuard Pest Control", services: ["pest"] },
  { businessName: "Prime Appliance Repair", services: ["appliance"] }
] as const;

const WORK_ORDER_TITLES = [
  "Leaking kitchen faucet",
  "AC not cooling bedroom",
  "Broken hallway light fixture",
  "Garage door sensor misaligned",
  "Dishwasher drainage issue",
  "Loose balcony railing",
  "Thermostat calibration",
  "Water heater inspection"
] as const;

export async function isOrganizationPortfolioEmpty(client: SeedClient, organizationId: string): Promise<boolean> {
  const { count, error } = await client
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }

  return (count ?? 0) === 0;
}

export async function seedDemoPortfolio(
  client: SeedClient,
  organizationId: string,
  userId: string
): Promise<SeedCounts> {
  const propertyIds: string[] = [];
  const unitIds: string[] = [];
  const tenantIds: string[] = [];
  const leaseIds: string[] = [];
  const vendorIds: string[] = [];
  const workOrderIds: string[] = [];

  for (const property of PROPERTY_SEEDS) {
    const { data, error } = await client
      .from("properties")
      .insert({
        organization_id: organizationId,
        name: property.name,
        code: property.code,
        property_type: property.propertyType,
        status: "active",
        description: `Development seed property for ${property.name}.`,
        address_line_1: property.addressLine1,
        city: property.city,
        state_region: property.stateRegion,
        postal_code: property.postalCode,
        country_code: "US",
        created_by: userId
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    propertyIds.push(data.id);
  }

  for (const [propertyIndex, propertyId] of propertyIds.entries()) {
    for (let unitIndex = 1; unitIndex <= 8; unitIndex += 1) {
      const rentAmount = 1200 + propertyIndex * 150 + unitIndex * 25;
      const { data, error } = await client
        .from("units")
        .insert({
          organization_id: organizationId,
          property_id: propertyId,
          unit_number: String(unitIndex).padStart(3, "0"),
          unit_label: `Unit ${unitIndex}`,
          bedrooms: unitIndex % 3 === 0 ? 3 : 2,
          bathrooms: unitIndex % 2 === 0 ? 2 : 1,
          square_feet: 750 + unitIndex * 35,
          rent_amount: rentAmount,
          deposit_amount: rentAmount,
          occupancy_status: "vacant_ready",
          status: "active",
          created_by: userId
        })
        .select("id")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      unitIds.push(data.id);
    }
  }

  for (let index = 0; index < TENANT_FIRST_NAMES.length; index += 1) {
    const propertyId = propertyIds[index % propertyIds.length];
    if (!propertyId) {
      continue;
    }
    const unitId = unitIds[index] ?? null;
    const firstName = TENANT_FIRST_NAMES[index] ?? "Demo";
    const lastName = TENANT_LAST_NAMES[index] ?? "Resident";
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@dev.mpa.local`;

    const { data, error } = await client
      .from("tenants")
      .insert({
        organization_id: organizationId,
        property_id: propertyId,
        unit_id: unitId,
        first_name: firstName,
        last_name: lastName,
        email,
        phone: `555-010${String(index).padStart(2, "0")}`,
        status: "active",
        move_in_date: "2025-01-01",
        created_by: userId
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    tenantIds.push(data.id);
  }

  const year = new Date().getUTCFullYear();
  for (let index = 0; index < 12; index += 1) {
    const propertyId = propertyIds[index % propertyIds.length];
    const unitId = unitIds[index];
    const tenantId = tenantIds[index];
    if (!propertyId || !unitId || !tenantId) {
      continue;
    }
    const rentAmount = 1300 + index * 40;

    const { data, error } = await client
      .from("leases")
      .insert({
        organization_id: organizationId,
        lease_number: `LS-${year}-${String(index + 1).padStart(4, "0")}`,
        property_id: propertyId,
        unit_id: unitId,
        primary_tenant_id: tenantId,
        lease_type: "residential",
        status: "active",
        start_date: "2025-01-01",
        end_date: "2025-12-31",
        move_in_date: "2025-01-01",
        rent_amount: rentAmount,
        security_deposit: rentAmount,
        activated_at: new Date().toISOString(),
        created_by: userId
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    leaseIds.push(data.id);

    await client
      .from("units")
      .update({
        occupancy_status: "occupied",
        updated_by: userId
      })
      .eq("organization_id", organizationId)
      .eq("id", unitId);
  }

  for (const [index, vendor] of VENDOR_SEEDS.entries()) {
    const { data, error } = await client
      .from("vendors")
      .insert({
        organization_id: organizationId,
        business_name: vendor.businessName,
        primary_contact_name: `${vendor.businessName} Dispatch`,
        email: `contact+${index + 1}@dev-vendor.mpa.local`,
        phone: `555-020${String(index).padStart(2, "0")}`,
        city: "Austin",
        state_region: "TX",
        country_code: "US",
        services: [...vendor.services],
        preferred_vendor: index < 2,
        status: "active",
        created_by: userId
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    vendorIds.push(data.id);
  }

  for (let index = 0; index < WORK_ORDER_TITLES.length; index += 1) {
    const propertyId = propertyIds[index % propertyIds.length];
    if (!propertyId) {
      continue;
    }
    const unitId = unitIds[index] ?? null;
    const tenantId = tenantIds[index] ?? null;
    const vendorId = vendorIds[index % vendorIds.length] ?? null;

    const { data, error } = await client
      .from("maintenance_work_orders")
      .insert({
        organization_id: organizationId,
        property_id: propertyId,
        unit_id: unitId,
        tenant_id: tenantId,
        vendor_id: vendorId,
        work_order_number: `WO-${year}-${String(index + 1).padStart(4, "0")}`,
        title: WORK_ORDER_TITLES[index] ?? "General maintenance request",
        description: "Seeded development work order for local testing.",
        category: index % 2 === 0 ? "plumbing" : "hvac",
        priority: index === 0 ? "high" : "medium",
        status: index < 3 ? "in_progress" : "submitted",
        created_by: userId
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    workOrderIds.push(data.id);
  }

  let rentCharges = 0;
  let payments = 0;
  let expenses = 0;
  let ownerStatements = 0;

  for (const [index, leaseId] of leaseIds.entries()) {
    const propertyId = propertyIds[index % propertyIds.length];
    const unitId = unitIds[index];
    const tenantId = tenantIds[index];
    if (!propertyId || !unitId || !tenantId) {
      continue;
    }
    const amount = 1300 + index * 40;
    const amountPaid = index % 3 === 0 ? amount : index % 3 === 1 ? amount / 2 : 0;
    const outstandingBalance = amount - amountPaid;

    const { data: charge, error: chargeError } = await client
      .from("rent_charges")
      .insert({
        organization_id: organizationId,
        charge_number: `RC-${year}-${String(index + 1).padStart(4, "0")}`,
        lease_id: leaseId,
        property_id: propertyId,
        unit_id: unitId,
        tenant_id: tenantId,
        charge_type: "monthly_rent",
        description: `Rent charge for lease ${index + 1}`,
        amount,
        amount_paid: amountPaid,
        outstanding_balance: outstandingBalance,
        due_date: "2025-07-01",
        period_start: "2025-07-01",
        period_end: "2025-07-31",
        status: outstandingBalance === 0 ? "paid" : outstandingBalance < amount ? "partial" : "pending",
        created_by: userId
      })
      .select("id")
      .single();

    if (chargeError) {
      throw new Error(chargeError.message);
    }

    rentCharges += 1;

    if (amountPaid > 0) {
      const { error: paymentError } = await client.from("payments").insert({
        organization_id: organizationId,
        payment_number: `PM-${year}-${String(index + 1).padStart(4, "0")}`,
        rent_charge_id: charge.id,
        lease_id: leaseId,
        property_id: propertyId,
        unit_id: unitId,
        tenant_id: tenantId,
        amount: amountPaid,
        payment_method: "manual",
        status: "completed",
        reference_note: "Development seed payment",
        created_by: userId
      });

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      payments += 1;
    }
  }

  for (let index = 0; index < 4; index += 1) {
    const propertyId = propertyIds[index % propertyIds.length];
    if (!propertyId) {
      continue;
    }
    const vendorId = vendorIds[index % vendorIds.length] ?? null;
    const workOrderId = workOrderIds[index] ?? null;

    const { error } = await client.from("expenses").insert({
      organization_id: organizationId,
      expense_number: `EX-${year}-${String(index + 1).padStart(4, "0")}`,
      property_id: propertyId,
      vendor_id: vendorId,
      work_order_id: workOrderId,
      category: "maintenance",
      description: `Seeded maintenance expense ${index + 1}`,
      amount: 180 + index * 45,
      expense_date: "2025-06-15",
      status: index % 2 === 0 ? "paid" : "approved",
      created_by: userId
    });

    if (error) {
      throw new Error(error.message);
    }

    expenses += 1;
  }

  for (let index = 0; index < propertyIds.length; index += 1) {
    const propertyId = propertyIds[index];
    if (!propertyId) {
      continue;
    }

    const { error } = await client.from("owner_statements").insert({
      organization_id: organizationId,
      statement_number: `OS-${year}-${String(index + 1).padStart(4, "0")}`,
      property_id: propertyId,
      owner_placeholder: "Development Owner",
      statement_period_start: "2025-06-01",
      statement_period_end: "2025-06-30",
      status: "generated",
      created_by: userId
    });

    if (error) {
      throw new Error(error.message);
    }

    ownerStatements += 1;
  }

  const aiInsightSeeds = [
    {
      insight_type: "summary" as const,
      category: "portfolio" as const,
      priority: "medium" as const,
      title: "Portfolio occupancy is stable",
      content: "Twelve active leases are covering most seeded units with limited vacancy risk."
    },
    {
      insight_type: "recommendation" as const,
      category: "maintenance" as const,
      priority: "high" as const,
      title: "Prioritize HVAC follow-ups",
      content: "Multiple HVAC-related work orders are open across the development portfolio."
    },
    {
      insight_type: "risk" as const,
      category: "financial" as const,
      priority: "medium" as const,
      title: "Monitor partial rent collections",
      content: "Several seeded rent charges remain partially paid heading into July."
    }
  ];

  for (const insight of aiInsightSeeds) {
    const { error } = await client.from("ai_insights").insert({
      organization_id: organizationId,
      insight_type: insight.insight_type,
      category: insight.category,
      priority: insight.priority,
      status: "active",
      title: insight.title,
      content: insight.content,
      created_by: userId
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  const announcementSeeds = [
    {
      title: "Welcome to M.P.A. Development",
      message: "This seeded organization is ready for local feature testing.",
      priority: "normal" as const,
      category: "general" as const,
      status: "published" as const
    },
    {
      title: "Scheduled maintenance this week",
      message: "HVAC inspections are planned across Maple Court and Harbor View.",
      priority: "high" as const,
      category: "maintenance" as const,
      status: "published" as const
    }
  ];

  for (const announcement of announcementSeeds) {
    const { error } = await client.from("announcements").insert({
      organization_id: organizationId,
      title: announcement.title,
      message: announcement.message,
      priority: announcement.priority,
      category: announcement.category,
      status: announcement.status,
      targeting_scope: "organization",
      published_at: new Date().toISOString(),
      recipient_count: tenantIds.length,
      created_by: userId
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  return {
    properties: propertyIds.length,
    units: unitIds.length,
    tenants: tenantIds.length,
    leases: leaseIds.length,
    workOrders: workOrderIds.length,
    vendors: vendorIds.length,
    rentCharges,
    payments,
    expenses,
    ownerStatements,
    aiInsights: aiInsightSeeds.length,
    announcements: announcementSeeds.length
  };
}
