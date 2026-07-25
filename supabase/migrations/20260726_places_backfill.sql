-- Slice 1.3 — Migration B: backfill one place per existing shop.
--
-- Idempotent and re-runnable: `on conflict (slug) do nothing`. Safe to run
-- twice, safe to run after new shops have been created.
--
-- slug is copied verbatim from shops.slug so it is a stable join key for the
-- 573 existing shop_slug references. From this point the place slug is
-- frozen (see the trigger in the expand migration) even though shops.slug
-- technically is not — the place is the identity that outlives the claim.

insert into public.places (
  slug, name, address, latitude, longitude,
  claimed_by, claimed_at, verification_tier, source
)
select
  s.slug,
  coalesce(nullif(trim(ss.shop_name), ''), initcap(replace(s.slug, '-', ' '))) as name,
  s.address,
  s.latitude,
  s.longitude,
  s.id                    as claimed_by,
  s.created_at            as claimed_at,
  -- Every existing shop is by definition claimed; paying ones are
  -- subscribed. Slice 1.5 builds the flow that can change these.
  case when s.is_paid then 'subscribed' else 'claimed' end as verification_tier,
  'merchant'              as source
from public.shops s
left join public.shop_settings ss on ss.shop_slug = s.slug
on conflict (slug) do nothing;
