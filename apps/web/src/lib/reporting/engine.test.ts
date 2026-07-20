import { describe, expect, it } from "vitest";
import { buildPeriod, buildReportModel } from "./engine";
import { renderReportPdf } from "./pdf-renderer";
import type { ReportingSnapshot } from "./read-sources";
import type { PropertyRecord } from "../property/contracts";

function baseSnapshot(overrides: Partial<ReportingSnapshot> = {}): ReportingSnapshot {
  const property: PropertyRecord = {
    id: "11111111-1111-1111-1111-111111111111",
    organizationId: "22222222-2222-2222-2222-222222222222",
    name: "Cedar Court",
    code: "CC",
    propertyType: "multi_family",
    status: "active",
    description: null,
    addressLine1: "100 Main St",
    addressLine2: null,
    city: "Austin",
    stateRegion: "TX",
    postalCode: "78701",
    countryCode: "US",
    timezone: "America/Chicago",
    latitude: null,
    longitude: null,
    ownershipEntityName: null,
    ownerContactName: null,
    ownerContactEmail: null,
    ownerContactPhone: null,
    coverImageUrl: null,
    metadata: {},
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    archivedAt: null,
    deletedAt: null
  };

  return {
    organizationName: "Demo PM Co",
    property,
    managerName: "Alex Manager",
    charges: [],
    payments: [
      {
        id: "p1",
        organizationId: property.organizationId,
        paymentNumber: "PAY-1",
        rentChargeId: null,
        leaseId: null,
        propertyId: property.id,
        unitId: null,
        tenantId: null,
        amount: 1200,
        paymentMethod: "ach",
        paymentDate: "2026-07-05",
        status: "completed",
        referenceNote: null,
        metadata: {},
        createdAt: "2026-07-05T00:00:00.000Z",
        updatedAt: "2026-07-05T00:00:00.000Z",
        archivedAt: null,
        deletedAt: null
      }
    ],
    expenses: [
      {
        id: "e1",
        organizationId: property.organizationId,
        expenseNumber: "EXP-1",
        propertyId: property.id,
        vendorId: null,
        workOrderId: null,
        category: "maintenance",
        customCategory: null,
        description: "HVAC repair",
        amount: 200,
        expenseDate: "2026-07-10",
        status: "paid",
        vendorBillPlaceholder: null,
        metadata: {},
        createdAt: "2026-07-10T00:00:00.000Z",
        updatedAt: "2026-07-10T00:00:00.000Z",
        archivedAt: null,
        deletedAt: null
      }
    ],
    units: [],
    leases: [],
    workOrders: [],
    awaitingReconciliationCount: 0,
    periodCharges: [],
    periodPayments: [],
    periodExpenses: [],
    periodWorkOrders: [],
    recognitionBasis: "cash",
    ...overrides
  };
}

describe("FIN-001 report engine", () => {
  it("builds cash P&L totals from period payments and expenses", () => {
    const period = buildPeriod(2026, 7);
    const snapshot = baseSnapshot({
      periodPayments: baseSnapshot().payments,
      periodExpenses: baseSnapshot().expenses
    });
    const model = buildReportModel("monthly_profit_and_loss", snapshot, period);
    expect(model.totals.find((row) => row.label === "Gross income")?.amount).toBe(1200);
    expect(model.totals.find((row) => row.label === "Total expenses")?.amount).toBe(200);
    expect(model.totals.find((row) => row.emphasis)?.amount).toBe(1000);
    expect(model.health.status).toBe("healthy");
  });

  it("flags unreconciled transactions in report health", () => {
    const period = buildPeriod(2026, 7);
    const snapshot = baseSnapshot({ awaitingReconciliationCount: 2 });
    const model = buildReportModel("cash_flow_summary", snapshot, period);
    expect(model.health.status).toBe("incomplete");
    expect(model.health.warning).toMatch(/unreconciled/i);
  });

  it("renders a multi-page capable PDF with header bytes", () => {
    const period = buildPeriod(2026, 7);
    const snapshot = baseSnapshot({
      periodPayments: baseSnapshot().payments,
      periodExpenses: baseSnapshot().expenses
    });
    const model = buildReportModel("owner_statement", snapshot, period);
    const pdf = renderReportPdf(model);
    const header = Buffer.from(pdf.bytes.slice(0, 8)).toString("utf8");
    expect(header.startsWith("%PDF")).toBe(true);
    expect(pdf.pageCount).toBeGreaterThanOrEqual(1);
    expect(pdf.contentHash.length).toBe(64);
  });

  it("builds maintenance summary counts from period work orders", () => {
    const period = buildPeriod(2026, 7);
    const snapshot = baseSnapshot({
      periodWorkOrders: [
        {
          id: "wo1",
          organizationId: "22222222-2222-2222-2222-222222222222",
          propertyId: "11111111-1111-1111-1111-111111111111",
          unitId: null,
          tenantId: null,
          workOrderNumber: "WO-1",
          title: "Leak",
          description: null,
          category: "plumbing",
          priority: "high",
          status: "completed",
          dueDate: null,
          assignedToUserId: null,
          vendorId: null,
          currentVendorAssignmentId: null,
          internalNotes: null,
          tenantNotes: null,
          photoPlaceholder: null,
          documentPlaceholder: null,
          recurringMaintenancePlaceholder: null,
          preventiveMaintenancePlaceholder: null,
          completedAt: "2026-07-10T00:00:00.000Z",
          metadata: {},
          createdBy: "u1",
          updatedBy: null,
          createdAt: "2026-07-01T00:00:00.000Z",
          updatedAt: "2026-07-10T00:00:00.000Z",
          archivedAt: null,
          deletedAt: null,
          propertyName: "Cedar Court",
          unitNumber: null,
          tenantName: null
        }
      ]
    });
    const model = buildReportModel("maintenance_summary", snapshot, period);
    expect(model.totals.find((row) => row.label === "Work orders in period")?.amount).toBe(1);
    expect(model.totals.find((row) => row.label === "Completed work orders")?.amount).toBe(1);
    expect(model.sections.some((section) => section.id === "completed")).toBe(true);
  });
});
