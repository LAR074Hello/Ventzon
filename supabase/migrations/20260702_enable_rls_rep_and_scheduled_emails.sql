-- ============================================================
-- Enable RLS on tables that were exposed via PostgREST
-- ------------------------------------------------------------
-- rep_profiles, rep_invites, and scheduled_emails had RLS disabled
-- with anon/authenticated grants present, making them readable and
-- writable via the public REST API (using only the anon key shipped
-- in the browser bundle). rep_invites in particular exposes a
-- sensitive `token` column used for rep onboarding invites.
--
-- All access to these tables happens server-side via the service
-- role key (see src/app/api/rep/*), which bypasses RLS entirely, so
-- enabling RLS with no policies is a pure lockdown with zero impact
-- on the app's own functionality.
-- ============================================================

ALTER TABLE public.rep_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rep_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_emails ENABLE ROW LEVEL SECURITY;
