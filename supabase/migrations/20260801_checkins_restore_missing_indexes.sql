-- Restore two check-in indexes production never received.
--
-- `20260201_baseline_core_tables.sql` creates `idx_checkins_shop_slug` and
-- `idx_checkins_customer_id`. Dev has both. **Production has neither** — it
-- carried 4 indexes on `checkins` where dev carried 6.
--
-- This is the SECOND time production has been found missing indexes its own
-- migrations create; `job_applications_role_idx` and
-- `job_applications_submitted_at_idx` are the same story, logged 2026-07-25.
-- The pattern is what matters: the migration files describe an intended
-- database, and production is not verified against them, so drift accumulates
-- silently and is only ever noticed by someone looking for something else.
--
-- Harmless today at 0 check-in rows. Not harmless later: every reader of
-- `checkins` filters on `shop_slug = ...` or `customer_id in (...)`, which is
-- precisely what these two index. Without them each of those becomes a
-- sequential scan the moment check-ins are real.
--
-- Idempotent on purpose — it is a no-op against dev.

create index if not exists idx_checkins_shop_slug   on public.checkins(shop_slug);
create index if not exists idx_checkins_customer_id on public.checkins(customer_id);
