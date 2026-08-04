alter table public.institutions
add column if not exists website text;

create table if not exists public.institution_units (
  id text primary key,
  name text not null,
  code text,
  slug text,
  type text,
  "managerName" text,
  "directorUserId" text references public.users(id) on delete set null,
  address text,
  numero text,
  complemento text,
  city text,
  state text,
  "zipCode" text,
  phone text,
  email text,
  website text,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "institutionId" text not null references public.institutions(id) on delete cascade
);

create index if not exists institution_units_institution_id_idx
  on public.institution_units ("institutionId");

create index if not exists institution_units_director_user_id_idx
  on public.institution_units ("directorUserId");

alter table public.institution_units enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'institution_units'
      and policyname = 'institution_units_select'
  ) then
    create policy institution_units_select
      on public.institution_units
      for select
      to authenticated
      using (is_global_admin() or can_access_institution("institutionId"));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'institution_units'
      and policyname = 'institution_units_insert'
  ) then
    create policy institution_units_insert
      on public.institution_units
      for insert
      to authenticated
      with check (is_global_admin() or can_access_institution("institutionId"));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'institution_units'
      and policyname = 'institution_units_update'
  ) then
    create policy institution_units_update
      on public.institution_units
      for update
      to authenticated
      using (is_global_admin() or can_access_institution("institutionId"))
      with check (is_global_admin() or can_access_institution("institutionId"));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'institution_units'
      and policyname = 'institution_units_delete'
  ) then
    create policy institution_units_delete
      on public.institution_units
      for delete
      to authenticated
      using (is_global_admin() or can_access_institution("institutionId"));
  end if;
end $$;

alter table public.institution_units
add column if not exists "managerName" text,
add column if not exists "directorUserId" text references public.users(id) on delete set null,
add column if not exists numero text,
add column if not exists complemento text,
add column if not exists website text;
