create table api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  key_hash text not null unique,
  plan text not null default 'free',
  daily_limit int not null default 10,
  calls_today int not null default 0,
  last_reset_at date not null default current_date,
  created_at timestamptz default now(),
  label text
);

create index on api_keys(key_hash);

alter table api_keys enable row level security;

create policy "Users can read own api keys"
  on api_keys for select
  using (auth.uid() = user_id);

create policy "Users can insert own api keys"
  on api_keys for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own api keys"
  on api_keys for delete
  using (auth.uid() = user_id);
