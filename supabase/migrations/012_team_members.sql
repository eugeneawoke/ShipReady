create table team_members (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users not null,
  member_user_id uuid references auth.users,
  invited_email text not null,
  role text not null default 'member' check (role in ('member')),
  invite_token text unique,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index on team_members(owner_user_id);
create index on team_members(invite_token) where invite_token is not null;
create index on team_members(member_user_id) where member_user_id is not null;

alter table team_members enable row level security;

create policy owner_select on team_members
  for select
  using (owner_user_id = auth.uid());

create policy owner_insert on team_members
  for insert
  with check (owner_user_id = auth.uid());

create policy owner_delete on team_members
  for delete
  using (owner_user_id = auth.uid());

create policy member_select on team_members
  for select
  using (member_user_id = auth.uid() and accepted_at is not null);
