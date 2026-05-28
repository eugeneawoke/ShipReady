-- supabase/migrations/021_oauth_integrations.sql
create table oauth_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  provider text not null,
  access_token text not null,
  refresh_token text,
  scope text,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, provider)
);

alter table oauth_integrations enable row level security;

create policy "Users manage own integrations"
  on oauth_integrations
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on column oauth_integrations.provider is 'google | yandex | bing';
