import type {
  PartnerOpportunityCloseReason,
  PartnerOpportunityDeclineReason,
  PartnerOpportunityPropertyType,
  PartnerOpportunityRouteResponse,
  PartnerOpportunityStatus,
  PartnerRequestUrgency,
  PartnerServiceCategory
} from "@mpa/shared";

export type PartnerServiceOpportunity = {
  id: string;
  organizationId: string;
  requestedByUserId: string;
  propertyId: string;
  unitLabel: string | null;
  workOrderId: string | null;
  propertyType: PartnerOpportunityPropertyType;
  category: PartnerServiceCategory;
  description: string;
  urgency: PartnerRequestUrgency;
  preferredTiming: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  status: PartnerOpportunityStatus;
  selectedPartnerId: string | null;
  selectedBy: string | null;
  selectedAt: string | null;
  closeReason: PartnerOpportunityCloseReason | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
};

export type PartnerOpportunityRoute = {
  id: string;
  opportunityId: string;
  partnerId: string;
  routedAt: string;
  viewedAt: string | null;
  response: PartnerOpportunityRouteResponse | null;
  responseAt: string | null;
  declineReason: PartnerOpportunityDeclineReason | null;
  selected: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PartnerOpportunityEvent = {
  id: string;
  opportunityId: string;
  partnerId: string | null;
  action: string;
  actorUserId: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type PartnerUnmetDemand = {
  id: string;
  serviceCategory: PartnerServiceCategory;
  city: string | null;
  region: string | null;
  createdAt: string;
};

export type PartnerOpportunityStore = {
  insertOpportunity(row: PartnerServiceOpportunity): Promise<PartnerServiceOpportunity>;
  updateOpportunity(row: PartnerServiceOpportunity): Promise<PartnerServiceOpportunity>;
  getOpportunity(id: string): Promise<PartnerServiceOpportunity | null>;
  listOpportunities(organizationId?: string): Promise<PartnerServiceOpportunity[]>;
  listOpenForWorkOrder(organizationId: string, workOrderId: string): Promise<PartnerServiceOpportunity[]>;
  insertRoute(row: PartnerOpportunityRoute): Promise<PartnerOpportunityRoute>;
  updateRoute(row: PartnerOpportunityRoute): Promise<PartnerOpportunityRoute>;
  getRoute(id: string): Promise<PartnerOpportunityRoute | null>;
  listRoutes(opportunityId: string): Promise<PartnerOpportunityRoute[]>;
  listRoutesForPartner(partnerId: string): Promise<PartnerOpportunityRoute[]>;
  insertEvent(row: PartnerOpportunityEvent): Promise<void>;
  listEvents(opportunityId: string): Promise<PartnerOpportunityEvent[]>;
  insertUnmetDemand(row: PartnerUnmetDemand): Promise<void>;
  listUnmetDemand(): Promise<PartnerUnmetDemand[]>;
};
