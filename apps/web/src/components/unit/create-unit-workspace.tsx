"use client";

import { useState } from "react";
import { Button } from "@mpa/ui";
import { BulkUnitGenerator } from "./bulk-unit-generator";
import { UnitForm } from "./unit-form";

export function CreateUnitWorkspace({
  properties,
  initialPropertyId
}: {
  properties: Array<{ id: string; name: string }>;
  initialPropertyId?: string | null;
}) {
  const [mode, setMode] = useState<"bulk" | "advanced">("bulk");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          {mode === "bulk" ? "Bulk create is the recommended path for multifamily properties." : "Advanced: create a single unit."}
        </p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => setMode((current) => (current === "bulk" ? "advanced" : "bulk"))}
        >
          {mode === "bulk" ? "Advanced: single unit" : "Back to bulk create"}
        </Button>
      </div>
      {mode === "bulk" ? (
        <BulkUnitGenerator properties={properties} initialPropertyId={initialPropertyId ?? null} />
      ) : (
        <div id="unit-form">
          <UnitForm mode="create" properties={properties} initialPropertyId={initialPropertyId ?? null} />
        </div>
      )}
    </div>
  );
}
