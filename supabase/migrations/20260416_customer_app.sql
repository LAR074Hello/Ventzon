-- Device tokens for push notifications
create table if not exists device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  platform text not null default 'ios',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists device_tokens_user_id_idx on device_tokens(user_id);

-- RLS
alter table device_tokens enable row level security;

create policy "Users manage own device tokens"
  on device_tokens
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
