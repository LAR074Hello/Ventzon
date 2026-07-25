-- Slice 1.3 — ROLLBACK for migrations A, B and C.
--
-- NOT a migration. Never runs automatically. This file exists so the
-- rollback is a tested artefact rather than a hopeful paragraph.
--
-- SAFE ONLY WHILE NO DEPLOYED CODE READS place_id.
-- That is the whole reason the production order is: migrate, verify, THEN
-- deploy. Between those two steps this rollback is lossless — it removes
-- only columns and a table that nothing in production is reading yet.
--
-- After the dependent deploy has shipped, rolling back means redeploying
-- the previous build FIRST, then running this. Reversing that order takes
-- the live app down.
--
-- What is lost: nothing that did not originate elsewhere. Every places row
-- is derived from shops; every posts.place_id and checkins.place_id is
-- derived from shop_slug, which is still present and still authoritative.

drop index if exists public.idx_checkins_place_id;
alter table public.checkins drop column if exists place_id;

drop index if exists public.idx_posts_place_id;
alter table public.posts drop column if exists place_id;

drop trigger if exists trg_places_freeze_slug on public.places;
drop trigger if exists trg_places_updated_at on public.places;
drop function if exists public.places_freeze_slug();

drop table if exists public.places cascade;
