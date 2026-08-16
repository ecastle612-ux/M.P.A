-- docs/152 FIN-OPS M2D — Production apply stamp
-- Live Production ledger: 20260816060336 / docs_152_fin_ops_m2d_development_identity_repair
--
-- This stamp records the Owner-authorized Production install of the certified
-- unused source 20260816054252_docs_152_fin_ops_m2d_development_identity_repair.sql
-- (SHA-256 ca88ff8611ee5bb8149522426018ceaca22bbd553e3825943d19c7c13d978e12).
--
-- Do NOT later replay 20260816054252 against mpa-prod.
-- Do NOT call finance_m2_run(false) from this file.
-- Function bodies already exist on Production from the 20260816060336 apply.

create or replace function public.finance_m2d_version()
returns text
language sql
immutable
as $$
  select 'docs_152_m2d_owner_unit_map';
$$;
