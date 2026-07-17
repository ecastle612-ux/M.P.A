"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WorkflowSuccessPanel } from "../presentation/workflow-success-panel";
import type { SetupProgressStep, WorkflowAction } from "../../lib/setup/types";
import type { WorkflowCrossLink } from "../../lib/workflow/shared/types";

export function WorkflowSuccessBanner({
  dismissPath,
  title,
  description,
  recommendations = [],
  steps,
  primaryAction,
  secondaryActions = [],
  crossLinks = [],
  milestone
}: {
  dismissPath: string;
  title: string;
  description?: string;
  recommendations?: string[];
  steps?: SetupProgressStep[];
  primaryAction: WorkflowAction;
  secondaryActions?: WorkflowAction[];
  crossLinks?: WorkflowCrossLink[];
  milestone?: string;
}) {
  const router = useRouter();
  const [visible, setVisible] = useState(true);

  if (!visible) {
    return null;
  }

  return (
    <WorkflowSuccessPanel
      title={title}
      {...(description ? { description } : {})}
      recommendations={recommendations}
      {...(steps ? { steps } : {})}
      primaryAction={primaryAction}
      secondaryActions={secondaryActions}
      crossLinks={crossLinks}
      {...(milestone ? { milestone } : {})}
      onDismiss={() => {
        setVisible(false);
        router.replace(dismissPath, { scroll: false });
      }}
    />
  );
}
