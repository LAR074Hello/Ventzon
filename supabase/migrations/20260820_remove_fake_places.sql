-- ============================================================
-- Remove fake (OSM + seed) locations — production cleanup.
--
-- DELETES DATA. This migration is intentionally NOT applied to production
-- until the impact has been reviewed. Run the dry-run first:
--   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/dry-run-fake-places.mjs
-- and review the counts, then apply this migration.
--
-- REMOVED:  places where source IN ('osm', 'seed') — the ~3,600 imported
--           OpenStreetMap POIs (and any dev seed rows). These are not real
--           merchant businesses; they only make the app look populated.
--
-- PRESERVED: places where source = 'merchant' (one per real merchant
--           account, backfilled from shops). Real claims stay. Shops,
--           shop_settings, memberships and reward data are untouched.
--
-- POSTS/CHECK-INS AFFECTED:
--   * Place-lane check-ins (customer_id NULL) that point at a deleted place
--     are REMOVED — they cannot survive because ON DELETE SET NULL would
--     violate checkins_subject_present_check, which requires customer_id,
--     or customer_email + place_id.
--   * Posts whose ONLY anchor is a deleted place (place_id set, shop_slug
--     NULL) become plain community posts (post_kind = community) BEFORE
--     the delete, so the FK nulling never leaves a business-kind row with
--     no anchor (which the feed would hide).
-- ============================================================

-- 1. Place-lane check-ins that only exist because of a fake place.
delete from public.checkins
where customer_id is null
  and place_id in (
    select id from public.places where source in ('osm', 'seed')
  );

-- 2. Posts anchored ONLY to a fake place become plain community posts.
update public.posts
set post_kind = 'community'
where shop_slug is null
  and place_id in (
    select id from public.places where source in ('osm', 'seed')
  );

-- 3. The fake places themselves. posts/checkins.place_id are ON DELETE
--    SET NULL, so surviving rows keep their merchant anchors.
delete from public.places
where source in ('osm', 'seed');
