-- Production stamp twin: 20260818081654 / docs_219_fac002_legacy_pm_rename
-- Prelude required before certified Slice 5 SQL.
-- FAC-002 leftover tables occupied facility_pm_occurrences / facility_pm_schedules.
-- Rename only. Do not drop rows or historical work orders.
-- Leftover: 1 schedule + 1 occurrence on MPA QA Certification (FAC-002 Slice B HVAC Filter).
-- Do not replay this twin.

ALTER TABLE public.facility_pm_occurrences RENAME TO fac002_legacy_pm_occurrences;
ALTER TABLE public.facility_pm_schedules RENAME TO fac002_legacy_pm_schedules;

ALTER INDEX public.facility_pm_occurrences_pkey RENAME TO fac002_legacy_pm_occurrences_pkey;
ALTER INDEX public.facility_pm_occurrences_due_idx RENAME TO fac002_legacy_pm_occurrences_due_idx;
ALTER INDEX public.facility_pm_occurrences_org_id_uidx RENAME TO fac002_legacy_pm_occurrences_org_id_uidx;
ALTER INDEX public.facility_pm_occurrences_schedule_due_uidx RENAME TO fac002_legacy_pm_occurrences_schedule_due_uidx;
ALTER INDEX public.facility_pm_occurrences_work_order_uidx RENAME TO fac002_legacy_pm_occurrences_work_order_uidx;
ALTER INDEX public.facility_pm_schedules_pkey RENAME TO fac002_legacy_pm_schedules_pkey;
ALTER INDEX public.facility_pm_schedules_due_idx RENAME TO fac002_legacy_pm_schedules_due_idx;
ALTER INDEX public.facility_pm_schedules_id_org_uidx RENAME TO fac002_legacy_pm_schedules_id_org_uidx;
ALTER INDEX public.facility_pm_schedules_property_idx RENAME TO fac002_legacy_pm_schedules_property_idx;
