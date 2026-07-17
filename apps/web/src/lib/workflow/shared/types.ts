import type { SetupProgressStep, WorkflowAction } from "../../setup/types";

export type PortfolioCounts = {
  organizations: number;
  properties: number;
  units: number;
  tenants: number;
  leases: number;
  activeLeases: number;
  vendors: number;
  payments: number;
  invitations: number;
};

export type PortfolioActionTask = {
  id: string;
  label: string;
  complete: boolean;
  href?: string;
  optional?: boolean;
};

export type WorkflowCrossLink = {
  label: string;
  href: string;
};

export type WorkflowSuccessConfig = {
  title: string;
  description: string;
  recommendations: string[];
  primaryAction: WorkflowAction;
  secondaryActions: WorkflowAction[];
  crossLinks?: WorkflowCrossLink[];
  milestone?: string;
  progressSteps?: SetupProgressStep[];
};
