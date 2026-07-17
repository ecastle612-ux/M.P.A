import type { SetupStep } from "./constants";

export type SetupStepStatus = {
  id: SetupStep;
  label: string;
  complete: boolean;
  optional?: boolean;
};

export type SetupStatus = {
  isComplete: boolean;
  currentStep: SetupStep;
  steps: SetupStepStatus[];
  completionPercent: number;
  counts: {
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
  profileComplete: boolean;
  inviteSkipped: boolean;
};

export type WorkflowAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
};

export type SetupProgressStep = {
  id: string;
  label: string;
  complete: boolean;
};
