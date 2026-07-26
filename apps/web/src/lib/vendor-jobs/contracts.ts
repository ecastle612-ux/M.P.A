export type VendorJobCard = {
  tokenPrefix: string;
  workOrderId: string;
  workOrderNumber: string;
  title: string;
  description: string | null;
  propertyAddress: string;
  estimatedTime: string | null;
  managerName: string | null;
  managerPhone: string | null;
  managerEmail: string | null;
  status: string;
  phase: "pending_accept" | "ready" | "on_site" | "finished" | "declined" | "unavailable";
  assignmentStatus: string | null;
  startedAt: string | null;
  completedAt: string | null;
  arrivalRecordedWithLocation: boolean;
};

export type ArrivalLocation = {
  latitude: number;
  longitude: number;
  accuracyM?: number | null;
};
