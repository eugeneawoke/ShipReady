create table if not exists waitlist_emails (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  name       text,
  created_at timestamptz not null default now()
);

alter table waitlist_emails enable row level security;
