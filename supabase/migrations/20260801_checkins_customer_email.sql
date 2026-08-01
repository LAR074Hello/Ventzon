-- Slice 1.9 — Migration A: check-ins that can exist at an imported place.
--
-- THE PROBLEM. `checkins.customer_id` references `customers(id)`, and
-- `customers.shop_slug` is FK-bound to `shops.slug`. A membership therefore
-- cannot exist for a place with no merchant account, so a check-in cannot
-- either — which makes the verified-visit badge unreachable at all 3,281
-- imported places, i.e. at everything a beta user can actually see.
--
-- THE FIX. Identify the visitor by their authenticated email when there is
-- no membership to point at. `customer_email` is IDENTITY, not a label: it is
-- written from the server-side session, never from a request body. A route
-- that accepts it as input is a badge-forgery API.
--
-- EXPAND ONLY. `customer_id` stays and stays populated for QR check-ins;
-- every existing writer supplies it and keeps working unchanged. This
-- migration only ever weakens constraints and adds a column plus an index.
--
-- NOTE: no code writes `customer_email` yet. This migration and the read path
-- in `getVerifiedVisitSet` land together; the WRITE path is deliberately not
-- in this slice. A session-derived email proves identity, not presence — an
-- endpoint that badges any place on request is worse than no endpoint. The
-- write arrives with the GPS slice, where the server recomputes haversine
-- distance itself.

alter table public.checkins
  add column if not exists customer_email text;

-- Both of these are NOT NULL today, and a place-only check-in has neither:
-- there is no membership row and there is no shop. Dropping NOT NULL cannot
-- break a deployed writer (they all still supply both), and every one of the
-- eight readers filters on `shop_slug = ...` or `customer_id in (...)`, which
-- a NULL never matches. Audited call site by call site before this shipped,
-- not after.
alter table public.checkins alter column shop_slug   drop not null;
alter table public.checkins alter column customer_id drop not null;

-- Having weakened both, re-assert the invariant they were carrying. A
-- check-in is one of exactly two things, and never a row belonging to nobody:
--   * a membership check-in (QR / manual)  → customer_id
--   * a place check-in                     → customer_email + place_id
-- Existing rows all have customer_id, so this validates without a rewrite.
alter table public.checkins
  drop constraint if exists checkins_subject_present_check;
alter table public.checkins
  add constraint checkins_subject_present_check check (
    customer_id is not null
    or (customer_email is not null and place_id is not null)
  );

-- THE ONCE-PER-DAY GUARD, for the new lane.
--
-- Postgres treats NULLs as distinct in a unique index, so the moment
-- customer_id can be NULL both existing uniques
-- (`checkins_customer_day_unique`, `checkins_shop_customer_date_unique`)
-- stop constraining place check-ins entirely — the same person could insert
-- unlimited rows for one place in one day. This restores the guard for rows
-- the old indexes no longer reach.
--
-- It is also the read index: `customer_email` leads, so a lookup on
-- (customer_email, place_id) uses this same index as a prefix. One index,
-- both jobs.
create unique index if not exists checkins_email_place_date_unique
  on public.checkins (customer_email, place_id, checkin_date)
  where customer_email is not null;
