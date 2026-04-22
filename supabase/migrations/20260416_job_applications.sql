create table if not exists job_applications (
  id uuid primary key default gen_random_uuid(),
  role text not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  city text,
  linkedin_url text,
  authorized_to_work text,
  requires_sponsorship text,
  over_18 text,
  felony_disclosure text,
  felony_explanation text,
  available_full_summer text,
  start_date date,
  sales_experience text,
  why_ventzon text,
  submitted_at timestamptz not null default now()
);

create index if not exists job_applications_role_idx on job_applications(role);
create index if not exists job_applications_submitted_at_idx on job_applications(submitted_at desc);
