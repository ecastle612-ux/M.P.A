export const INSPECTION_STATUSES = ["draft", "in_progress", "completed", "canceled"] as const;
export type InspectionStatus = (typeof INSPECTION_STATUSES)[number];

export const INSPECTION_ITEM_RESULTS = ["pass", "fail", "na"] as const;
export type InspectionItemResult = (typeof INSPECTION_ITEM_RESULTS)[number];

export type InspectionTemplateItemDef = {
  label: string;
};

export type FacilityInspectionTemplate = {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  items: InspectionTemplateItemDef[];
  active: boolean;
  metadata: Record<string, unknown>;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type FacilityInspectionItem = {
  id: string;
  organizationId: string;
  runId: string;
  sortOrder: number;
  label: string;
  result: InspectionItemResult | null;
  notes: string | null;
  photoMediaAssetIds: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type FacilityInspectionRun = {
  id: string;
  organizationId: string;
  propertyId: string;
  unitId: string | null;
  templateId: string | null;
  title: string;
  status: InspectionStatus;
  assignedToUserId: string | null;
  dueOn: string | null;
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type FacilityInspectionRunListItem = FacilityInspectionRun & {
  propertyName: string | null;
  unitNumber: string | null;
  failCount: number;
  itemCount: number;
};

export type FacilityInspectionRunDetail = FacilityInspectionRunListItem & {
  items: FacilityInspectionItem[];
};

export type CreateInspectionRunInput = {
  title: string;
  propertyId: string;
  unitId?: string | null;
  templateId?: string | null;
  dueOn?: string | null;
  notes?: string | null;
  assignedToUserId?: string | null;
  /** Ad-hoc checklist labels when no template (or to append). */
  itemLabels?: string[];
};

export type UpdateInspectionItemInput = {
  itemId: string;
  result?: InspectionItemResult | null;
  notes?: string | null;
  photoMediaAssetIds?: string[];
};

export type CompleteInspectionInput = {
  notes?: string | null;
  /** Explicit confirm — never silent. */
  createFollowUpWorkOrder?: boolean;
};

export type ListInspectionRunsOptions = {
  propertyId?: string;
  status?: InspectionStatus;
  limit?: number;
};

export function isInspectionStatus(value: string): value is InspectionStatus {
  return (INSPECTION_STATUSES as readonly string[]).includes(value);
}

export function isInspectionItemResult(value: string): value is InspectionItemResult {
  return (INSPECTION_ITEM_RESULTS as readonly string[]).includes(value);
}

export function formatInspectionStatusLabel(status: InspectionStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "in_progress":
      return "In progress";
    case "completed":
      return "Completed";
    case "canceled":
      return "Canceled";
    default:
      return status;
  }
}

export function formatInspectionResultLabel(result: InspectionItemResult): string {
  switch (result) {
    case "pass":
      return "Pass";
    case "fail":
      return "Fail";
    case "na":
      return "N/A";
    default:
      return result;
  }
}

function asTrimmed(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function parseCreateInspectionRunInput(payload: unknown): CreateInspectionRunInput | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const record = payload as Record<string, unknown>;
  const title = asTrimmed(record["title"]);
  const propertyId = asTrimmed(record["propertyId"]);
  if (!title || !propertyId || !isUuid(propertyId)) return null;

  const unitRaw = record["unitId"];
  const unitId =
    unitRaw === undefined || unitRaw === null || unitRaw === ""
      ? null
      : typeof unitRaw === "string" && isUuid(unitRaw)
        ? unitRaw
        : null;
  if (unitRaw !== undefined && unitRaw !== null && unitRaw !== "" && !unitId) return null;

  const templateRaw = record["templateId"];
  const templateId =
    templateRaw === undefined || templateRaw === null || templateRaw === ""
      ? null
      : typeof templateRaw === "string" && isUuid(templateRaw)
        ? templateRaw
        : null;
  if (templateRaw !== undefined && templateRaw !== null && templateRaw !== "" && !templateId) {
    return null;
  }

  const dueOn = asTrimmed(record["dueOn"]);
  const notes = asTrimmed(record["notes"]);
  const assigneeRaw = record["assignedToUserId"];
  const assignedToUserId =
    assigneeRaw === undefined || assigneeRaw === null || assigneeRaw === ""
      ? null
      : typeof assigneeRaw === "string" && isUuid(assigneeRaw)
        ? assigneeRaw
        : null;

  const labelsRaw = record["itemLabels"];
  const itemLabels = Array.isArray(labelsRaw)
    ? labelsRaw
        .filter((label): label is string => typeof label === "string")
        .map((label) => label.trim())
        .filter((label) => label.length > 0)
        .slice(0, 80)
    : undefined;

  return {
    title,
    propertyId,
    unitId,
    templateId,
    dueOn,
    notes,
    assignedToUserId,
    ...(itemLabels ? { itemLabels } : {})
  };
}

export function parseUpdateInspectionItemInput(payload: unknown): UpdateInspectionItemInput | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const record = payload as Record<string, unknown>;
  const itemId = asTrimmed(record["itemId"]);
  if (!itemId || !isUuid(itemId)) return null;

  const input: UpdateInspectionItemInput = { itemId };
  if ("result" in record) {
    const resultRaw = record["result"];
    if (resultRaw === null || resultRaw === "") {
      input.result = null;
    } else if (typeof resultRaw === "string" && isInspectionItemResult(resultRaw)) {
      input.result = resultRaw;
    } else {
      return null;
    }
  }
  if ("notes" in record) {
    const notes = record["notes"];
    if (notes === null || notes === "") input.notes = null;
    else if (typeof notes === "string") input.notes = notes.trim().slice(0, 4000) || null;
    else return null;
  }
  if ("photoMediaAssetIds" in record) {
    const ids = record["photoMediaAssetIds"];
    if (!Array.isArray(ids)) return null;
    const photoMediaAssetIds = ids.filter((id): id is string => typeof id === "string" && isUuid(id));
    if (photoMediaAssetIds.length !== ids.length) return null;
    input.photoMediaAssetIds = photoMediaAssetIds.slice(0, 20);
  }
  return input;
}

export function parseCompleteInspectionInput(payload: unknown): CompleteInspectionInput {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return {};
  const record = payload as Record<string, unknown>;
  const notes = asTrimmed(record["notes"]);
  const createFollowUpWorkOrder = record["createFollowUpWorkOrder"] === true;
  return {
    ...(notes ? { notes } : {}),
    createFollowUpWorkOrder
  };
}

export function parseAddInspectionItemInput(payload: unknown): { label: string } | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const label = asTrimmed((payload as Record<string, unknown>)["label"]);
  if (!label || label.length > 240) return null;
  return { label };
}
