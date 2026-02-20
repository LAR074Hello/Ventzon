-- Run this in Supabase SQL editor
-- Creates tables needed for QR check-in flow + merchant onboarding

-- Customers table: one row per (shop, phone) pair
create table if not exists customers (
  id              uuid default gen_random_uuid() primary key,
  shop_id         uuid not null references shops(id),
  phone           text not null,
  total_visits    int  not null default 0,
  opted_out       boolean not null default false,
  last_checkin_at timestamptz,
  created_at      timestamptz not null default now(),
  unique (shop_id, phone)
);

create index if not exists customers_shop_phone_idx
  on customers (shop_id, phone);

-- Checkins table: logs every QR scan
create table if not exists checkins (
  id            uuid default gen_random_uuid() primary key,
  shop_id       uuid not null references shops(id),
  customer_id   uuid not null references customers(id),
  visit_number  int  not null default 1,
  created_at    timestamptz not null default now()
);

create index if not exists checkins_shop_idx
  on checkins (shop_id);

-- Messages table: SMS log (transactional + marketing)
create table if not exists messages (
  id            uuid default gen_random_uuid() primary key,
  shop_id       uuid not null references shops(id),
  to_phone      text not null,
  from_phone    text not null default '',
  body          text not null default '',
  type          text not null default 'transactional',
  status        text not null default 'queued',
  twilio_sid    text,
  error_message text,
  checkin_id    uuid references checkins(id),
  promotion_id  uuid,
  created_at    timestamptz not null default now()
);

-- Shop members: links owners/staff to shops
create table if not exists shop_members (
  id          bigint generated always as identity primary key,
  shop_slug   text    not null,
  email       text    not null,
  role        text    not null default 'owner',
  created_at  timestamptz not null default now(),
  unique (shop_slug, email)
);

create index if not exists shop_members_email_idx
  on shop_members (email);
