alter table profiles
  add column if not exists first_utm_source text,
  add column if not exists first_utm_medium text,
  add column if not exists first_utm_campaign text,
  add column if not exists first_referral_code text,
  add column if not exists first_promo_code text,
  add column if not exists last_utm_source text,
  add column if not exists last_utm_medium text,
  add column if not exists last_utm_campaign text,
  add column if not exists last_referral_code text,
  add column if not exists last_promo_code text,
  add column if not exists plan_source text not null default 'manual',
  add column if not exists plan_expires_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_plan_source_check'
      and conrelid = 'profiles'::regclass
  ) then
    alter table profiles
      add constraint profiles_plan_source_check
      check (plan_source in ('manual', 'billing', 'beta_grant', 'referral', 'promo'));
  end if;
end $$;

create table if not exists growth_campaigns (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = lower(code) and code ~ '^[a-z0-9][a-z0-9._-]{0,63}$'),
  name text not null,
  description text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  default_plan text not null default 'pro' check (default_plan in ('free', 'pro', 'agency')),
  grant_days integer not null default 30 check (grant_days > 0),
  max_grants integer check (max_grants is null or max_grants > 0),
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists referral_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = lower(code) and code ~ '^[a-z0-9][a-z0-9._-]{0,63}$'),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid references growth_campaigns(id) on delete set null,
  is_active boolean not null default true,
  max_uses integer check (max_uses is null or max_uses > 0),
  grant_days integer check (grant_days is null or grant_days > 0),
  uses_count integer not null default 0 check (uses_count >= 0),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists growth_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id text,
  campaign_id uuid references growth_campaigns(id) on delete set null,
  referral_code_id uuid references referral_codes(id) on delete set null,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  referral_code text,
  promo_code text,
  landing_path text,
  referrer text,
  user_agent text,
  ip_hash text,
  attribution jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (user_id is not null or anonymous_id is not null)
);

create table if not exists beta_access_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid references growth_campaigns(id) on delete set null,
  referral_code_id uuid references referral_codes(id) on delete set null,
  granted_plan text not null default 'pro' check (granted_plan in ('pro', 'agency')),
  grant_reason text not null,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists growth_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id text,
  visit_id uuid references growth_visits(id) on delete set null,
  campaign_id uuid references growth_campaigns(id) on delete set null,
  referral_code_id uuid references referral_codes(id) on delete set null,
  event_name text not null,
  event_properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (user_id is not null or anonymous_id is not null)
);

create index if not exists growth_campaigns_created_at_idx on growth_campaigns(created_at);
create index if not exists growth_campaigns_utm_source_campaign_idx on growth_campaigns(utm_source, utm_campaign);
create index if not exists growth_campaigns_active_idx on growth_campaigns(is_active) where is_active = true;

create index if not exists referral_codes_created_at_idx on referral_codes(created_at);
create index if not exists referral_codes_owner_user_id_idx on referral_codes(owner_user_id);
create index if not exists referral_codes_campaign_id_idx on referral_codes(campaign_id);
create index if not exists referral_codes_code_idx on referral_codes(code);
create index if not exists referral_codes_active_idx on referral_codes(code) where is_active = true;

create index if not exists growth_visits_created_at_idx on growth_visits(created_at);
create index if not exists growth_visits_user_id_idx on growth_visits(user_id) where user_id is not null;
create index if not exists growth_visits_anonymous_id_idx on growth_visits(anonymous_id) where anonymous_id is not null;
create index if not exists growth_visits_utm_source_campaign_idx on growth_visits(utm_source, utm_campaign);
create index if not exists growth_visits_campaign_id_idx on growth_visits(campaign_id);
create index if not exists growth_visits_referral_code_id_idx on growth_visits(referral_code_id);
create index if not exists growth_visits_referral_code_idx on growth_visits(referral_code) where referral_code is not null;

create index if not exists beta_access_grants_created_at_idx on beta_access_grants(created_at);
create index if not exists beta_access_grants_user_id_idx on beta_access_grants(user_id);
create index if not exists beta_access_grants_campaign_id_idx on beta_access_grants(campaign_id);
create index if not exists beta_access_grants_referral_code_id_idx on beta_access_grants(referral_code_id);
create index if not exists beta_access_grants_active_idx on beta_access_grants(user_id, expires_at)
  where revoked_at is null;

create index if not exists growth_events_created_at_idx on growth_events(created_at);
create index if not exists growth_events_user_id_idx on growth_events(user_id) where user_id is not null;
create index if not exists growth_events_anonymous_id_idx on growth_events(anonymous_id) where anonymous_id is not null;
create index if not exists growth_events_campaign_id_idx on growth_events(campaign_id);
create index if not exists growth_events_referral_code_id_idx on growth_events(referral_code_id);
create index if not exists growth_events_event_name_created_at_idx on growth_events(event_name, created_at);

alter table growth_campaigns enable row level security;
alter table referral_codes enable row level security;
alter table growth_visits enable row level security;
alter table beta_access_grants enable row level security;
alter table growth_events enable row level security;

drop policy if exists "users can read own profile" on profiles;
create policy "users can read own profile" on profiles
  for select to authenticated
  using ((select auth.uid()) is not null and id = (select auth.uid()));

drop policy if exists "service role can update profiles" on profiles;
drop policy if exists profiles_service_manage on profiles;
create policy profiles_service_manage on profiles
  for all to service_role
  using (true)
  with check (true);

drop policy if exists growth_campaigns_service_manage on growth_campaigns;
create policy growth_campaigns_service_manage on growth_campaigns
  for all to service_role
  using (true)
  with check (true);

drop policy if exists referral_codes_owner_select on referral_codes;
create policy referral_codes_owner_select on referral_codes
  for select to authenticated
  using ((select auth.uid()) is not null and owner_user_id = (select auth.uid()));

drop policy if exists referral_codes_service_manage on referral_codes;
create policy referral_codes_service_manage on referral_codes
  for all to service_role
  using (true)
  with check (true);

drop policy if exists growth_visits_service_manage on growth_visits;
create policy growth_visits_service_manage on growth_visits
  for all to service_role
  using (true)
  with check (true);

drop policy if exists beta_access_grants_user_select on beta_access_grants;
create policy beta_access_grants_user_select on beta_access_grants
  for select to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists beta_access_grants_service_manage on beta_access_grants;
create policy beta_access_grants_service_manage on beta_access_grants
  for all to service_role
  using (true)
  with check (true);

drop policy if exists growth_events_authenticated_insert_own on growth_events;
drop policy if exists growth_events_anonymous_insert on growth_events;

drop policy if exists growth_events_service_manage on growth_events;
create policy growth_events_service_manage on growth_events
  for all to service_role
  using (true)
  with check (true);

create or replace function grant_beta_access_from_growth_attribution(
  p_user_id uuid,
  p_campaign_slug text default null,
  p_referral_code text default null,
  p_promo_code text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campaign_input text;
  v_referral_input text;
  v_promo_input text;
  v_campaign growth_campaigns%rowtype;
  v_referral referral_codes%rowtype;
  v_referral_id uuid := null;
  v_existing_grant_id uuid;
  v_active_grants integer;
  v_grant_days integer;
  v_grant_reason text;
  v_new_grant_id uuid;
begin
  if p_user_id is null then
    return null;
  end if;

  v_campaign_input := lower(trim(coalesce(p_campaign_slug, '')));
  v_referral_input := lower(trim(coalesce(p_referral_code, '')));
  v_promo_input := lower(trim(coalesce(p_promo_code, '')));

  if v_campaign_input !~ '^[a-z0-9][a-z0-9._-]{0,63}$' then
    v_campaign_input := null;
  end if;
  if v_referral_input !~ '^[a-z0-9][a-z0-9._-]{0,63}$' then
    v_referral_input := null;
  end if;
  if v_promo_input !~ '^[a-z0-9][a-z0-9._-]{0,63}$' then
    v_promo_input := null;
  end if;

  if v_campaign_input is null and v_referral_input is null and v_promo_input is null then
    return null;
  end if;

  perform pg_advisory_xact_lock(hashtext('growth_grant_user'), hashtext(p_user_id::text));

  if v_referral_input is not null then
    select *
      into v_referral
      from referral_codes
      where code = v_referral_input
        and is_active = true
        and (expires_at is null or expires_at > now())
      for update;

    if found
      and v_referral.campaign_id is not null
      and (v_referral.max_uses is null or v_referral.uses_count < v_referral.max_uses)
    then
      select *
        into v_campaign
        from growth_campaigns
        where id = v_referral.campaign_id
          and is_active = true
          and default_plan in ('pro', 'agency')
          and (starts_at is null or starts_at <= now())
          and (expires_at is null or expires_at > now())
        for update;

      if found then
        v_referral_id := v_referral.id;
        v_grant_days := coalesce(v_referral.grant_days, v_campaign.grant_days);
        v_grant_reason := 'referral:' || v_referral.code;
      end if;
    end if;
  end if;

  if v_campaign.id is null and v_promo_input is not null then
    select *
      into v_campaign
      from growth_campaigns
      where code = v_promo_input
        and is_active = true
        and default_plan in ('pro', 'agency')
        and (starts_at is null or starts_at <= now())
        and (expires_at is null or expires_at > now())
      for update;

    if found then
      v_grant_days := v_campaign.grant_days;
      v_grant_reason := 'promo:' || v_campaign.code;
    end if;
  end if;

  if v_campaign.id is null and v_campaign_input is not null then
    select *
      into v_campaign
      from growth_campaigns
      where code = v_campaign_input
        and is_active = true
        and default_plan in ('pro', 'agency')
        and (starts_at is null or starts_at <= now())
        and (expires_at is null or expires_at > now())
      for update;

    if found then
      v_grant_days := v_campaign.grant_days;
      v_grant_reason := 'campaign:' || v_campaign.code;
    end if;
  end if;

  if v_campaign.id is null then
    return null;
  end if;

  perform pg_advisory_xact_lock(hashtext('growth_grant_campaign'), hashtext(v_campaign.id::text));
  if v_referral_id is not null then
    perform pg_advisory_xact_lock(hashtext('growth_grant_referral'), hashtext(v_referral_id::text));
  end if;

  select id
    into v_existing_grant_id
    from beta_access_grants
    where user_id = p_user_id
      and campaign_id = v_campaign.id
      and revoked_at is null
      and starts_at <= now()
      and (expires_at is null or expires_at > now())
      and (
        (v_referral_id is null and referral_code_id is null)
        or referral_code_id = v_referral_id
      )
    order by created_at desc
    limit 1;

  if v_existing_grant_id is not null then
    return v_existing_grant_id;
  end if;

  if v_referral_id is not null then
    select *
      into v_referral
      from referral_codes
      where id = v_referral_id
      for update;

    if v_referral.max_uses is not null and v_referral.uses_count >= v_referral.max_uses then
      return null;
    end if;
  end if;

  if v_campaign.max_grants is not null then
    select count(*)::integer
      into v_active_grants
      from beta_access_grants
      where campaign_id = v_campaign.id
        and revoked_at is null
        and starts_at <= now()
        and (expires_at is null or expires_at > now());

    if v_active_grants >= v_campaign.max_grants then
      return null;
    end if;
  end if;

  insert into beta_access_grants (
    user_id,
    campaign_id,
    referral_code_id,
    granted_plan,
    grant_reason,
    starts_at,
    expires_at
  )
  values (
    p_user_id,
    v_campaign.id,
    v_referral_id,
    v_campaign.default_plan,
    v_grant_reason,
    now(),
    now() + make_interval(days => v_grant_days)
  )
  returning id into v_new_grant_id;

  if v_referral_id is not null then
    update referral_codes
      set uses_count = uses_count + 1
      where id = v_referral_id;
  end if;

  return v_new_grant_id;
end;
$$;

revoke all on function grant_beta_access_from_growth_attribution(uuid, text, text, text) from public;
grant execute on function grant_beta_access_from_growth_attribution(uuid, text, text, text) to service_role;
