-- ============================================================
-- Demo store support (2026-08-20).
--
-- App Store review needs a populated, clearly-labelled demo merchant.
-- is_demo marks it so real analytics can exclude it and the demo can be
-- torn down cleanly (scripts/teardown-demo-store.mjs).
-- ============================================================
alter table public.shops
  add column if not exists is_demo boolean not null default false;
