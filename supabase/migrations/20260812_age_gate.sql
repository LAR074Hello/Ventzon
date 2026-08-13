-- 13+ age gate for the consumer app (customer signup).
--
-- Lives on customer_profiles — NOT the merchant DOB/senior flow
-- (src/app/api/customer/dob operates on `customers` with its own MIN_AGE=10).
--
--   dob                 the self-reported date of birth of a verified (13+)
--                       user. Used only for the age gate.
--   underage_refused_at when an under-13 claim was refused. On refusal we
--                       deliberately do NOT store the claimed date of birth:
--                       retaining a child's DOB would itself be collecting
--                       personal information from an under-13, which COPPA
--                       restricts. The timestamp alone blocks re-submission.
--
-- Expand-only per CLAUDE.md §6: no drops, no constraints on existing rows.
ALTER TABLE public.customer_profiles
  ADD COLUMN IF NOT EXISTS dob date,
  ADD COLUMN IF NOT EXISTS underage_refused_at timestamptz;
