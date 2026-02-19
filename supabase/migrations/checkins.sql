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
