export type WorkOrderMaterial = {
  id: string;
  organizationId: string;
  workOrderId: string;
  name: string;
  quantity: number;
  inventoryItemId: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateWorkOrderMaterialInput = {
  name: string;
  quantity?: number;
  inventoryItemId?: string | null;
};

export type UpdateWorkOrderMaterialInput = {
  name?: string;
  quantity?: number;
  inventoryItemId?: string | null;
};

function asTrimmed(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function parseCreateWorkOrderMaterialInput(
  payload: unknown
): CreateWorkOrderMaterialInput | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const record = payload as Record<string, unknown>;
  const name = asTrimmed(record["name"]);
  if (!name || name.length > 160) return null;

  const qtyRaw = record["quantity"];
  const quantity =
    qtyRaw === undefined
      ? 1
      : typeof qtyRaw === "number"
        ? qtyRaw
        : typeof qtyRaw === "string"
          ? Number.parseFloat(qtyRaw)
          : NaN;
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 100000) return null;

  const invRaw = record["inventoryItemId"];
  const inventoryItemId =
    invRaw === undefined || invRaw === null || invRaw === ""
      ? null
      : typeof invRaw === "string" && isUuid(invRaw)
        ? invRaw
        : null;
  if (invRaw !== undefined && invRaw !== null && invRaw !== "" && !inventoryItemId) return null;

  return { name, quantity, inventoryItemId };
}

export function parseUpdateWorkOrderMaterialInput(
  payload: unknown
): UpdateWorkOrderMaterialInput | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const record = payload as Record<string, unknown>;
  const input: UpdateWorkOrderMaterialInput = {};
  if ("name" in record) {
    const name = asTrimmed(record["name"]);
    if (!name || name.length > 160) return null;
    input.name = name;
  }
  if ("quantity" in record) {
    const qtyRaw = record["quantity"];
    const quantity =
      typeof qtyRaw === "number"
        ? qtyRaw
        : typeof qtyRaw === "string"
          ? Number.parseFloat(qtyRaw)
          : NaN;
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 100000) return null;
    input.quantity = quantity;
  }
  if ("inventoryItemId" in record) {
    const invRaw = record["inventoryItemId"];
    if (invRaw === null || invRaw === "") input.inventoryItemId = null;
    else if (typeof invRaw === "string" && isUuid(invRaw)) input.inventoryItemId = invRaw;
    else return null;
  }
  if (Object.keys(input).length === 0) return null;
  return input;
}

export function parseRecommendationsInput(payload: unknown): { recommendationsNotes: string | null } | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const notes = (payload as Record<string, unknown>)["recommendationsNotes"];
  if (notes === null || notes === "") return { recommendationsNotes: null };
  if (typeof notes !== "string") return null;
  return { recommendationsNotes: notes.trim().slice(0, 4000) || null };
}
