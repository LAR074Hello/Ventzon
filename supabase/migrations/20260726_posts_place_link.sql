-- Slice 1.3 — Migration C: link posts to places.
--
-- EXPAND ONLY. posts.shop_slug STAYS. Both columns coexist for the whole
-- transition: new writes populate both, reads prefer place_id and fall back
-- to shop_slug. Contract (dropping shop_slug) is a later slice, once every
-- read path is proven on the new column.
--
-- A hard cutover here would make any rollback a data-loss event, which is
-- exactly what expand-contract exists to avoid.

alter table public.posts
  add column if not exists place_id uuid references public.places(id) on delete set null;

create index if not exists idx_posts_place_id on public.posts(place_id);

-- Backfill through the shared slug. Idempotent: only fills nulls.
update public.posts p
set place_id = pl.id
from public.places pl
where p.place_id is null
  and p.shop_slug is not null
  and pl.slug = p.shop_slug;

-- Check-ins get the same treatment so the reward ledger can follow a place
-- across a claim change. Same rule: shop_slug stays, both are written.
alter table public.checkins
  add column if not exists place_id uuid references public.places(id) on delete set null;

create index if not exists idx_checkins_place_id on public.checkins(place_id);

update public.checkins c
set place_id = pl.id
from public.places pl
where c.place_id is null
  and pl.slug = c.shop_slug;
