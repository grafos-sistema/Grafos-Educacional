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
