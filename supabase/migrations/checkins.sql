-- Checkins table: logs every QR check-in visit
-- Run this in Supabase SQL editor

create table if not exists checkins (
  id          bigint generated always as identity primary key,
  shop_slug   text    not null,
  phone       text    not null,
  created_at  timestamptz not null default now()
);

-- Fast lookups: all checkins for a customer at a shop
create index if not exists checkins_shop_phone_idx
  on checkins (shop_slug, phone);

-- Add a visits column to signups if it doesn't exist
alter table signups
  add column if not exists visits int not null default 0;

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
