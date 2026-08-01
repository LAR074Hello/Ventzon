-- Restore the two job_applications indexes production never received.
--
-- `20260416_job_applications.sql` creates `job_applications_role_idx` and
-- `job_applications_submitted_at_idx`. Dev has both; production has neither.
--
-- Logged as missing on **2026-07-25**, and still missing on 2026-08-01 — a
-- week in which the fact was recorded accurately in design-notes and nothing
-- acted on it. That is the argument for the schema-diff check in `verify:dev`
-- being a failing test rather than a paragraph: a note describes drift, a red
-- check removes it.
--
-- Idempotent; a no-op against dev.

create index if not exists job_applications_role_idx
  on public.job_applications(role);
create index if not exists job_applications_submitted_at_idx
  on public.job_applications(submitted_at desc);
