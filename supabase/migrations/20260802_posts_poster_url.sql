-- Poster frames for video posts.
--
-- EXPAND ONLY: one nullable column. Deployed code that has never heard of it
-- keeps working, and every existing video post reads as poster_url IS NULL,
-- which the UI already has to handle for posts made before this shipped.
--
-- Why it matters beyond polish: a video tile renders blank until it decodes,
-- and Chrome will not decode the `video/quicktime` an iPhone records AT ALL —
-- so an Android or desktop viewer currently sees an empty rectangle where a
-- post should be. The poster is the difference between a feed and a grid of
-- holes on every non-Apple device.
--
-- Captured client-side from the video itself (lib/poster-frame.ts) and stored
-- in the same public `posts` bucket. It is a frame of a video the user chose to
-- publish, so it carries no privacy exposure the post does not already have —
-- and it is drawn from the ALREADY-STRIPPED file, so it cannot reintroduce the
-- metadata the strip removed.

alter table public.posts
  add column if not exists poster_url text;
