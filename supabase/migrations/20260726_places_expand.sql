-- Slice 1.3 — Migration A: places as a first-class object.
--
-- EXPAND ONLY. Nothing is dropped or altered on an existing table here; the
-- currently deployed code does not know this table exists and is unaffected.
-- Production can sit in this state indefinitely, which is what lets the
-- migration and the deploy be separate, deliberate acts.
--
-- A place exists whether or not anyone has claimed it. That is what lets a
-- city be populated before a single merchant subscribes.

create table if not exists public.places (
  id            uuid primary key default gen_random_uuid(),

  -- FROZEN AT CREATION. A merchant renaming their shop changes the display
  -- name, never this. Enforced by trigger below, not by convention — a
  -- mutable join key across 573 shop_slug references is a failure mode we
  -- can simply decline to have. Redirects are POST-BETA if pretty URLs
  -- ever matter enough.
  slug          text not null unique,

  name          text not null,
  address       text,
  latitude      double precision,
  longitude     double precision,
  neighborhood  text,
  city          text,
  category      text,
  hours         jsonb,
  photos        jsonb not null default '[]'::jsonb,

  -- Claiming. Ships now, unused until Slice 1.5 — adding these later would
  -- mean a second production migration for no reason.
  claimed_by         uuid references public.shops(id) on delete set null,
  claimed_at         timestamptz,
  verification_tier  text not null default 'unclaimed'
                     check (verification_tier in ('unclaimed','claimed','subscribed')),

  -- Provenance. 'osm' rows carry ODbL obligations and must stay separable
  -- from user-generated data — see design-notes.md.
  source          text not null default 'merchant'
                  check (source in ('seed','merchant','osm')),
  osm_id          text,
  osm_updated_at  timestamptz,

  -- Freshness signal for imported places.
  permanently_closed_reports integer not null default 0,

  -- Promotion hooks: nullable and unused on purpose (Slice 1.4). No UI.
  promotable    boolean,
  promotion_id  uuid,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_places_slug on public.places(slug);
create index if not exists idx_places_claimed_by on public.places(claimed_by);
create index if not exists idx_places_city_neighborhood on public.places(city, neighborhood);
create index if not exists idx_places_tier on public.places(verification_tier);
create index if not exists idx_places_geo on public.places(latitude, longitude);
create index if not exists idx_places_osm on public.places(osm_id) where osm_id is not null;

-- Slug immutability, enforced rather than remembered.
create or replace function public.places_freeze_slug()
returns trigger language plpgsql as $fn$
begin
  if new.slug is distinct from old.slug then
    raise exception 'places.slug is immutable (attempted % -> %). Rename the display name instead.', old.slug, new.slug;
  end if;
  return new;
end;
$fn$;

drop trigger if exists trg_places_freeze_slug on public.places;
create trigger trg_places_freeze_slug
  before update on public.places
  for each row execute function public.places_freeze_slug();

drop trigger if exists trg_places_updated_at on public.places;
create trigger trg_places_updated_at
  before update on public.places
  for each row execute function public.set_updated_at();

-- ── RLS ─────────────────────────────────────────────────────────────
-- Enabled WITH NO ANON POLICY, deliberately.
--
-- The anon key ships in the browser bundle, so an anon-read policy would
-- let anyone enumerate this table. RLS is row-level and cannot hide
-- columns, so that would expose verification_tier (revealing which
-- merchants pay), claimed_by, permanently_closed_reports and later
-- promotion_id. Share pages are server-rendered and read through the
-- service role, so anon never needs access. Fail closed: granting anon
-- read later is one migration, un-exposing it is not.
--
-- This also matches the lockdown pattern used by the rest of the social
-- schema (posts, customer_profiles, user_blocks, reports).
alter table public.places enable row level security;
