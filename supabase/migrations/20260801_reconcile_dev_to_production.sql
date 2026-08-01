-- Reconcile dev toward production, so dev stops being the looser environment.
--
-- The schema-diff check found three divergences on its first run. Two of them
-- are constraints that PRODUCTION enforces and dev did not, which is the
-- dangerous direction: code that violates them passes locally and fails
-- against real users. Every earlier drift was "production is missing
-- something"; this is the reverse, and it is the one that produces a green
-- local run and a live error.
--
-- Idempotent throughout, and a no-op against production.

-- ── 1. Constraints production has and dev lacked ────────────────────
--
-- Without the FK, dev accepts a message addressed to a shop that does not
-- exist. Without the CHECK, dev accepts a zero or negative commission. Both
-- fail in production. Neither appears in any migration, so both were applied
-- to production by hand at some point and never written down — which is
-- exactly why they only surfaced through a diff.
--
-- Verified before writing: dev holds 0 messages and 0 commission logs, so
-- neither constraint can fail validation here.

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'messages_shop_slug_fkey'
      and conrelid = 'public.messages'::regclass
  ) then
    alter table public.messages
      add constraint messages_shop_slug_fkey
      foreign key (shop_slug) references public.shops(slug) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'rep_commission_logs_amount_check'
      and conrelid = 'public.rep_commission_logs'::regclass
  ) then
    alter table public.rep_commission_logs
      add constraint rep_commission_logs_amount_check check (amount > 0);
  end if;
end $$;

-- ── 1b. Same index name, different definition ───────────────────────
--
-- `rep_commission_logs_logged_at_idx` is `btree (logged_at)` on dev and
-- `btree (logged_at DESC)` on production. Identical names, identical counts,
-- different indexes — invisible to any check that compares names or totals,
-- which is the argument for the snapshot storing `indexdef` rather than a list
-- of names. The rep portal orders commissions newest-first, so production's
-- DESC is the correct one and dev is rebuilt to match.

drop index if exists public.rep_commission_logs_logged_at_idx;
create index if not exists rep_commission_logs_logged_at_idx
  on public.rep_commission_logs (logged_at desc);

-- ── 2. promotions: production is the canonical shape ────────────────
--
-- `20260218_promotions.sql` describes a review workflow — created_by,
-- approved_at, rejected_at, reject_reason, updated_at — that production never
-- received, because the feature never shipped. Production carries `audience`,
-- `name` and `sent_at` instead. Neither side was a superset, so the table had
-- no canonical shape at all; dev held the union.
--
-- DECISION (2026-08-01): production wins. It is what live data conforms to.
-- This migration makes dev match it and, by existing, gives the resulting
-- shape a definition in the repo rather than only in the live database.
--
-- Safe: both tables hold 0 rows. Nothing is lost that any row ever used.
--
-- ⚠ THIS SURFACES A REAL BREAKAGE, it does not cause one. Three routes write
-- or read the dropped columns —
--   src/app/api/promotions/route.ts            (created_by, reject_reason,
--                                               approved_at, rejected_at)
--   src/app/api/promotions/[id]/approve/route.ts (approved_at, updated_at)
--   src/app/api/promotions/[id]/reject/route.ts  (reject_reason, rejected_at,
--                                               updated_at)
-- — and those columns do not exist in production, so all three are ALREADY
-- broken against it. Dev was hiding that. They are merchant surfaces and
-- deferred until after beta, so they stay as they are; this note is here so
-- the failure is understood rather than rediscovered.

alter table public.promotions drop column if exists created_by;
alter table public.promotions drop column if exists reject_reason;
alter table public.promotions drop column if exists approved_at;
alter table public.promotions drop column if exists rejected_at;
alter table public.promotions drop column if exists updated_at;

alter table public.promotions alter column created_at drop not null;
alter table public.promotions alter column status     drop not null;

-- Production enforces the FK to shops; dev did not.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'promotions_shop_slug_fkey'
      and conrelid = 'public.promotions'::regclass
  ) then
    alter table public.promotions
      add constraint promotions_shop_slug_fkey
      foreign key (shop_slug) references public.shops(slug) on delete cascade;
  end if;
end $$;

-- The one place "production wins" costs something. Dev enforced
-- CHECK (status in ('draft','approved','rejected')) and production does not,
-- so dev is being deliberately loosened here to reach parity.
--
-- Dev being STRICTER is the harmless direction — it fails locally and passes
-- in production — so this is a real guard traded for a clean diff. Both tables
-- are empty, which means adding the CHECK to PRODUCTION instead would have been
-- strictly better and equally safe. Recommended as a follow-up rather than done
-- here, because "production wins" was the decision and quietly making it
-- "production wins except where I disagreed" is how a decision record stops
-- being trustworthy.
alter table public.promotions drop constraint if exists promotions_status_check;
