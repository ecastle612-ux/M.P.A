export type ProviderCertStatus = "pass" | "warn" | "fail" | "skipped" | "not_in_path";

export type ProviderCheckResult = {
  check: string;
  status: ProviderCertStatus;
  detail: string;
  recovery?: string;
};

export type ProviderCertification = {
  provider: string;
  mode: string;
  overall: ProviderCertStatus;
  checks: ProviderCheckResult[];
};

export type IntegrityIssueSeverity = "error" | "warning";

export type IntegrityIssue = {
  id: string;
  domain: string;
  severity: IntegrityIssueSeverity;
  title: string;
  description: string;
  count: number;
  recovery: string;
};

export type IntegrityReport = {
  organizationId: string;
  checkedAt: string;
  issueCount: number;
  errorCount: number;
  warningCount: number;
  issues: IntegrityIssue[];
};

export type PerformanceProbe = {
  surface: string;
  measuredMs: number | null;
  budgetMs: number;
  status: "pass" | "warn" | "fail" | "skipped";
  note: string;
};

export type TrustCertificationReport = {
  generatedAt: string;
  providers: ProviderCertification[];
  integrity: IntegrityReport | null;
  performance: PerformanceProbe[];
  summary: {
    providersPass: number;
    providersWarn: number;
    providersFail: number;
    providersSkipped: number;
    integrityErrors: number;
  };
};
