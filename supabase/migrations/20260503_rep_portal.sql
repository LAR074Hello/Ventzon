-- Rep portal: profiles, invites, and shop claiming

CREATE TABLE rep_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email text NOT NULL,
  full_name text NOT NULL,
  city text,
  invited_by_email text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE rep_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  full_name text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  invited_by_email text,
  used_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '14 days'),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shops ADD COLUMN IF NOT EXISTS rep_id uuid REFERENCES rep_profiles(id) ON DELETE SET NULL;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS rep_claimed_at timestamptz;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rep_profiles_user_id ON rep_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_shops_rep_id ON shops(rep_id);
CREATE INDEX IF NOT EXISTS idx_rep_invites_token ON rep_invites(token);
