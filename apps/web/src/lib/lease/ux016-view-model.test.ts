import { describe, expect, it } from "vitest";
import { buildLeasingCommandCenterViewModel } from "./ux016-view-model";
import type { LeaseListItem } from "./server";
import type { ApplicantListItem } from "../applicant/server";

const leaseSample: LeaseListItem = {
  id: "lease-1",
  organizationId: "org-1",
  leaseNumber: "L-2026-0001",
  propertyId: "prop-1",
  unitId: "unit-1",
  primaryTenantId: "ten-1",
  coTenantPlaceholder: null,
  leaseType: "residential",
  status: "signed",
  workflowStage: "signwell_signature",
  startDate: "2026-09-01",
  endDate: "2027-08-31",
  moveInDate: "2026-09-01",
  moveOutDate: null,
  rentAmount: 1800,
  securityDeposit: 1800,
  lateFeePlaceholder: null,
  renewalOption: true,
  noticePeriodDays: 60,
  renewalStatus: "none",
  internalNotes: null,
  signedAt: null,
  activatedAt: null,
  expiredAt: null,
  terminatedAt: null,
  metadata: {},
  createdAt: "2026-08-05T00:00:00.000Z",
  updatedAt: "2026-08-05T00:00:00.000Z",
  archivedAt: null,
  deletedAt: null,
  propertyName: "Oak Street",
  unitNumber: "2A",
  tenantName: "Pat Resident"
};

const applicantSample: ApplicantListItem = {
  id: "app-1",
  organizationId: "org-1",
  applicationNumber: "A-2026-0001",
  applicationGroupId: "group-1",
  isPrimary: true,
  propertyId: "prop-1",
  unitId: "unit-1",
  assignedPmId: null,
  tenantId: null,
  status: "screening_in_progress",
  workflowStage: "screening",
  firstName: "Jordan",
  lastName: "Applicant",
  preferredName: null,
  email: "jordan@example.com",
  phone: null,
  dateOfBirth: null,
  plannedMoveInDate: "2026-09-01",
  profile: {
    employment: {
      employer: null,
      jobTitle: null,
      startDate: null,
      monthlyIncome: null,
      supervisorName: null,
      supervisorPhone: null
    },
    income: { source: null, amount: null, frequency: null, notes: null },
    emergency: { name: null, phone: null, relationship: null },
    pets: [],
    vehicles: [],
    householdMembers: [],
    moveInChecklist: {
      keysIssued: false,
      utilitiesTransferred: false,
      welcomePacketSent: false,
      orientationScheduled: false,
      notes: null
    }
  },
  internalNotes: null,
  metadata: {},
  submittedAt: "2026-08-01T00:00:00.000Z",
  approvedAt: null,
  declinedAt: null,
  convertedAt: null,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-05T00:00:00.000Z",
  archivedAt: null,
  deletedAt: null,
  propertyName: "Oak Street",
  unitNumber: "2A"
};

describe("Leasing Command Center UDF", () => {
  it("surfaces SignWell and screening queues on STD-001 home", () => {
    const model = buildLeasingCommandCenterViewModel({
      leases: [leaseSample],
      applicants: [applicantSample],
      canCreateLease: true,
      canCreateApplicant: true,
      userName: "Alex"
    });
    expect(model.greeting.surfaceLabel).toBe("Leasing Operations");
    expect(model.attention.some((item) => item.id === "lease-signwell")).toBe(true);
    expect(model.attention.some((item) => item.id === "lease-screening")).toBe(true);
    expect(model.assistant).toBeTruthy();
    expect(model.quickActions.some((item) => item.id === "qa-lease")).toBe(true);
  });
});
