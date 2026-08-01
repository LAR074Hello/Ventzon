-- Restore the promotions status guard — on BOTH databases this time.
--
-- Supersedes the last statement of `20260801_reconcile_dev_to_production.sql`,
-- which dropped this CHECK from dev to satisfy a blanket "production wins".
--
-- The rule was too broad, and the corrected principle is worth stating because
-- it will come up again:
--
--   **Production wins where live data conforms to it. Never drop a guard to
--   satisfy a diff.**
--
-- Reconciliation is for removing divergence, not for levelling down. Dev being
-- STRICTER than production is the harmless direction — it fails on a laptop and
-- passes in front of users. Dev being LOOSER is the dangerous one, and it is
-- what this whole exercise started from. Deleting a constraint to turn a diff
-- green converts the safe direction into no direction at all.
--
-- Both tables hold 0 rows, so adding it to production cannot fail validation
-- and cannot reject an existing row.
--
-- The drop-then-add sequence a fresh rebuild will perform is deliberate: the
-- earlier migration is left as the record of what was actually applied, rather
-- than rewritten to look like the decision was right the first time.

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'promotions_status_check'
      and conrelid = 'public.promotions'::regclass
  ) then
    alter table public.promotions
      add constraint promotions_status_check
      check (status = any (array['draft'::text, 'approved'::text, 'rejected'::text]));
  end if;
end $$;
