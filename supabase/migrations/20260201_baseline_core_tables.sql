-- Baseline: the six core tables.
--
-- These were created through the Supabase dashboard rather than a migration,
-- so supabase/migrations/ could not rebuild the schema from scratch — every
-- later migration references shops/customers/checkins and would fail against
-- an empty database. Reconstructed from the production schema on 2026-07-25
-- and dated ahead of the earliest existing migration so ordering holds.
--
-- Columns added by later migrations are included here in their current shape.
-- That is safe: every later ALTER uses ADD COLUMN IF NOT EXISTS (29 of 29
-- checked), so those statements become no-ops. The two exceptions are
-- shops.rep_id and shops.rep_claimed_at, which are left out because their FK
-- target (rep_profiles) is created later, in 20260503_rep_portal.sql.

-- ── shops ───────────────────────────────────────────────────────────
create table if not exists public.shops (
  id                      uuid primary key default gen_random_uuid(),
  slug                    text not null unique,
  is_paid                 boolean not null default false,
  subscription_status     text not null default 'inactive',
  stripe_customer_id      text,
  stripe_subscription_id  text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  user_id                 uuid references auth.users(id),
  logo_url                text,
  plan_type               text not null default 'free',
  address                 text,
  latitude                double precision,
  longitude               double precision,
  ai_insight_text         text,
  ai_insight_generated_at timestamptz,
  ad_subscription_item_id text
);

-- ── shop_settings ───────────────────────────────────────────────────
create table if not exists public.shop_settings (
  shop_slug             text primary key references public.shops(slug) on delete cascade,
  shop_name             text,
  deal_title            text,
  deal_details          text,
  welcome_sms_template  text,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now(),
  reward_goal           integer not null default 5,
  reward_unlocked_text  text,
  promo_text_template   text,
  reward_sms_template   text,
  visits_required       integer not null default 5,
  progress_sms_template text,
  reward_expires_days   integer,
  bonus_days            integer[],
  register_pin          text,
  reward_mode           text not null default 'stamps',
  points_per_dollar     numeric not null default 1,
  points_per_visit      integer not null default 10,
  birthday_enabled      boolean not null default false,
  birthday_reward_title text,
  birthday_days_before  smallint not null default 0,
  birthday_expiry_days  smallint,
  birthday_message      text,
  constraint shop_settings_visits_required_range
    check (visits_required >= 2 and visits_required <= 31),
  constraint shop_settings_reward_mode_check
    check (reward_mode = any (array['stamps'::text, 'points'::text])),
  constraint shop_settings_points_per_dollar_check check (points_per_dollar > 0),
  constraint shop_settings_points_per_visit_check check (points_per_visit > 0),
  constraint shop_settings_birthday_days_before_check
    check (birthday_days_before >= 0 and birthday_days_before <= 60),
  constraint shop_settings_birthday_expiry_days_check
    check (birthday_expiry_days is null
           or (birthday_expiry_days >= 1 and birthday_expiry_days <= 365))
);

-- ── customers ───────────────────────────────────────────────────────
-- One row per (shop, person). `visits` is the shared balance column for both
-- reward modes — see src/lib/reward.ts.
create table if not exists public.customers (
  id                  uuid primary key default gen_random_uuid(),
  shop_slug           text not null references public.shops(slug) on delete cascade,
  phone               text,
  email               text,
  first_seen_at       timestamptz default now(),
  last_seen_at        timestamptz default now(),
  opted_out           boolean default false,
  pin_hash            text,
  visits              integer not null default 0,
  last_checkin_date   date,
  last_text_sent_at   timestamptz,
  reward_unlocked     boolean not null default false,
  reward_unlocked_at  timestamptz,
  created_at          timestamptz not null default now(),
  last_reward_sent_at timestamptz,
  dob                 date,
  community_badge     text,
  total_spend         numeric not null default 0,
  birth_month         smallint,
  birth_day           smallint,
  constraint customers_shop_slug_phone_key unique (shop_slug, phone),
  constraint customers_shop_slug_email_key unique (shop_slug, email),
  constraint customers_birth_month_check check (birth_month >= 1 and birth_month <= 12),
  constraint customers_birth_day_check check (birth_day >= 1 and birth_day <= 31),
  constraint customers_community_badge_check check (
    community_badge = any (array['veteran'::text,'student'::text,'senior'::text,
                                 'first_responder'::text,'care'::text])
    or community_badge is null
  )
);

-- ── checkins ────────────────────────────────────────────────────────
create table if not exists public.checkins (
  id           bigserial primary key,
  shop_slug    text not null,
  customer_id  uuid not null references public.customers(id) on delete cascade,
  checkin_date text not null,
  created_at   timestamptz not null default now(),
  amount       numeric
);

-- ── shop_members ────────────────────────────────────────────────────
create table if not exists public.shop_members (
  id         uuid primary key default gen_random_uuid(),
  shop_id    uuid not null references public.shops(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'owner',
  created_at timestamptz not null default now(),
  constraint shop_members_shop_id_user_id_key unique (shop_id, user_id)
);

-- ── signups ─────────────────────────────────────────────────────────
create table if not exists public.signups (
  id         bigint generated by default as identity primary key,
  created_at timestamptz not null default now(),
  shop_slug  text not null,
  phone      text not null,
  source     text default 'web'
);

-- ── RLS ─────────────────────────────────────────────────────────────
-- customers and checkins carry RLS with no policies on purpose: they are
-- reached only through server routes using the service role, which bypasses
-- RLS. Client-side reads of those tables are meant to fail closed.
alter table public.shops         enable row level security;
alter table public.shop_settings enable row level security;
alter table public.customers     enable row level security;
alter table public.checkins      enable row level security;
alter table public.shop_members  enable row level security;
alter table public.signups       enable row level security;

drop policy if exists shops_select on public.shops;
drop policy if exists shops_insert on public.shops;
drop policy if exists shops_update on public.shops;
drop policy if exists shops_delete on public.shops;
create policy shops_select on public.shops for select using (user_id = auth.uid());
create policy shops_insert on public.shops for insert with check (user_id = auth.uid());
create policy shops_update on public.shops for update using (user_id = auth.uid());
create policy shops_delete on public.shops for delete using (user_id = auth.uid());

drop policy if exists shop_members_select on public.shop_members;
drop policy if exists shop_members_insert on public.shop_members;
drop policy if exists shop_members_update on public.shop_members;
drop policy if exists shop_members_delete on public.shop_members;
create policy shop_members_select on public.shop_members for select using (user_id = auth.uid());
create policy shop_members_insert on public.shop_members for insert with check (user_id = auth.uid());
create policy shop_members_update on public.shop_members for update using (user_id = auth.uid());
create policy shop_members_delete on public.shop_members for delete using (user_id = auth.uid());

drop policy if exists "shop_settings: read if member" on public.shop_settings;
create policy "shop_settings: read if member" on public.shop_settings for select using (
  exists (select 1 from public.shops s
            join public.shop_members m on m.shop_id = s.id
           where s.slug = shop_settings.shop_slug and m.user_id = auth.uid())
);

drop policy if exists "shop_settings: insert if owner/admin" on public.shop_settings;
create policy "shop_settings: insert if owner/admin" on public.shop_settings for insert with check (
  exists (select 1 from public.shops s
            join public.shop_members m on m.shop_id = s.id
           where s.slug = shop_settings.shop_slug and m.user_id = auth.uid()
             and m.role = any (array['owner'::text,'admin'::text]))
);

drop policy if exists "shop_settings: update if owner/admin" on public.shop_settings;
create policy "shop_settings: update if owner/admin" on public.shop_settings for update using (
  exists (select 1 from public.shops s
            join public.shop_members m on m.shop_id = s.id
           where s.slug = shop_settings.shop_slug and m.user_id = auth.uid()
             and m.role = any (array['owner'::text,'admin'::text]))
) with check (
  exists (select 1 from public.shops s
            join public.shop_members m on m.shop_id = s.id
           where s.slug = shop_settings.shop_slug and m.user_id = auth.uid()
             and m.role = any (array['owner'::text,'admin'::text]))
);

drop policy if exists "allow anon signup" on public.signups;
create policy "allow anon signup" on public.signups for insert to anon with check (true);

create index if not exists idx_customers_shop_slug on public.customers(shop_slug);
create index if not exists idx_checkins_shop_slug on public.checkins(shop_slug);
create index if not exists idx_checkins_customer_id on public.checkins(customer_id);
