/* eslint-disable @typescript-eslint/no-explicit-any */
/** Loose client for OPS tables until @mpa/supabase types are regenerated. */
export type OpsDbClient = {
  from: (table: string) => any;
  rpc: (fn: string, args?: Record<string, unknown>) => any;
};
