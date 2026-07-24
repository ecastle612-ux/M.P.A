/** Client-safe Owner financial presentation types (no server imports). */

import type { StatementStatus } from "../financial/contracts";

export type OwnerFinancialStatementRow = {
  id: string;
  propertyId: string;
  propertyName: string;
  statementNumber: string;
  statementDateLabel: string;
  periodLabel: string;
  status: StatementStatus;
  statusLabel: string;
  generatedAtLabel: string | null;
  downloadHref: string | null;
};
