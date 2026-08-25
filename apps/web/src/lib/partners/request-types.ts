import type {
  PartnerPropertyIntakeSource,
  PartnerRequestStatus,
  PartnerRequestUrgency,
  PartnerServiceCategory
} from "@mpa/shared";

export type PartnerServiceRequest = {
  id: string;
  partnerId: string;
  organizationId: string;
  publicRef: string;
  statusTokenHash: string | null;
  slugSnapshot: string;
  propertySlug: string | null;
  propertyPortalId: string | null;
  propertyId: string | null;
  intakeSource: PartnerPropertyIntakeSource;
  status: PartnerRequestStatus;
  requesterName: string;
  requesterEmail: string | null;
  requesterPhone: string | null;
  propertyAddress: string;
  unitLabel: string | null;
  category: PartnerServiceCategory;
  description: string;
  urgency: PartnerRequestUrgency;
  convertedWorkOrderId: string | null;
  convertedWorkSurface: "residential" | "facility" | null;
  convertedBy: string | null;
  convertedAt: string | null;
  declinedReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PartnerRequestEvent = {
  id: string;
  requestId: string;
  partnerId: string;
  action: string;
  actorUserId: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type PartnerRequestStore = {
  nextPublicRef(): Promise<string>;
  insertRequest(row: PartnerServiceRequest): Promise<PartnerServiceRequest>;
  updateRequest(row: PartnerServiceRequest): Promise<PartnerServiceRequest>;
  getRequest(id: string): Promise<PartnerServiceRequest | null>;
  getRequestByStatusHash(hash: string): Promise<PartnerServiceRequest | null>;
  listRequests(partnerId: string): Promise<PartnerServiceRequest[]>;
  listRequestSummaries?(partnerId: string): Promise<
    Array<{
      partnerId: string;
      propertyPortalId: string | null;
      status: string;
      createdAt: string;
    }>
  >;
  insertEvent(row: PartnerRequestEvent): Promise<void>;
  listEvents(requestId: string): Promise<PartnerRequestEvent[]>;
  countForPartner(partnerId: string): Promise<number>;
};
