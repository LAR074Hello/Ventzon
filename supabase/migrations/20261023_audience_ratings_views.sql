-- Merchant analytics data: audience profile, visit ratings, page views.
-- Approved by Luke 2026-10-22. Expand-only: new nullable columns and two new
-- tables; nothing existing changes. RLS on with no policies, so only the
-- service role (server routes) can read or write.

-- 1. Audience profile (all optional, user-editable in Settings)
alter table public.customer_profiles
  add column if not exists age_range text,
  add column if not exists interests text[],
  add column if not exists going_out_for text[],
  add column if not exists food_prefs text[],
  add column if not exists price_pref text,
  add column if not exists home_area text,
  add column if not exists audience_prompt_done_at timestamptz;

-- 2. Visit ratings (skippable thumbs up/down after a check-in)
create table if not exists public.visit_ratings (
  id uuid primary key default gen_random_uuid(),
  shop_slug text not null,
  customer_id uuid not null,
  rating smallint not null check (rating in (-1, 1)),
  note text check (char_length(note) <= 280),
  created_at timestamptz not null default now()
);
create index if not exists visit_ratings_shop_idx on public.visit_ratings (shop_slug, created_at desc);
create index if not exists visit_ratings_customer_idx on public.visit_ratings (customer_id, shop_slug, created_at desc);
alter table public.visit_ratings enable row level security;

-- 3. Page views (one row per signed-in viewer per place per day)
create table if not exists public.place_views (
  id uuid primary key default gen_random_uuid(),
  place_id uuid,
  shop_slug text,
  viewer_id uuid,
  source text check (source in ('feed','map','search','share','other')),
  view_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (place_id, viewer_id, view_date)
);
create index if not exists place_views_shop_idx on public.place_views (shop_slug, view_date);
alter table public.place_views enable row level security;
