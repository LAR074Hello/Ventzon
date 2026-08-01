-- Slice 1.9 — ROLLBACK for 20260801_checkins_customer_email.sql.
--
-- NOT a migration. Never runs automatically. Same convention as
-- 20260726_places_ROLLBACK.sql: the rollback is an artefact, not a hopeful
-- paragraph.
--
-- LOSSLESS ONLY WHILE NO PLACE CHECK-IN EXISTS.
--
-- Nothing writes `customer_email` in this slice, so at the moment this file
-- is written every row still has `customer_id` and this rollback loses
-- nothing. That stops being true the day the GPS slice ships a write path.
--
-- ⚠ RESTORING NOT NULL DELETES DATA. `alter column customer_id set not null`
-- fails while any place-only check-in exists, so a rollback after the write
-- path ships requires deciding what happens to those rows FIRST. There is no
-- correct blind answer and this file deliberately does not guess — a
-- place-only check-in is a real visit by a real person, and the badge it
-- earned is the product's whole differentiator. Run `npm run backup` and
-- count them before touching this:
--
--   select count(*) from public.checkins where customer_id is null;
--
-- If that count is zero, everything below is safe as written.

drop index if exists public.checkins_email_place_date_unique;

alter table public.checkins
  drop constraint if exists checkins_subject_present_check;

alter table public.checkins drop column if exists customer_email;

-- Left for last: these fail loudly rather than silently if place-only rows
-- exist, which is the correct behaviour. Do not "fix" a failure here by
-- deleting rows without reading the warning above.
alter table public.checkins alter column customer_id set not null;
alter table public.checkins alter column shop_slug   set not null;
