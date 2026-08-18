begin;

-- Restrict membership visibility: user sees only their own memberships; admins can see/manage within institutions.
drop policy if exists user_institutions_select on public.user_institutions;
create policy user_institutions_select
on public.user_institutions
for select
to authenticated
using (
  ("userId" = public.current_app_user_id())
  or (public.is_admin() and public.can_access_institution("institutionId"))
);

-- Ensure self-updates keep the row tied to the authenticated user and require valid institution membership.
drop policy if exists users_update_self on public.users;
create policy users_update_self
on public.users
for update
to authenticated
using (auth_user_id = auth.uid())
with check (
  auth_user_id = auth.uid()
  and (
    public.is_admin()
    or exists (
      select 1
      from public.user_institutions ui
      where ui."userId" = public.users.id
        and ui."institutionId" = public.users."institutionId"
        and ui."isActive" = true
    )
  )
);

-- Allow institution switching only to institutions the user is a member of (keeps role/auth_user_id protection).
create or replace function public.users_protect_system_fields()
returns trigger
language plpgsql
set search_path to 'public', 'pg_temp'
as $$
declare
  v_is_admin boolean;
  v_can_switch boolean;
begin
  if auth.uid() is null then
    return new;
  end if;

  select public.is_admin() into v_is_admin;

  if v_is_admin then
    return new;
  end if;

  if new.id is distinct from old.id then
    raise exception 'cannot_change_id';
  end if;

  if new.auth_user_id is distinct from old.auth_user_id then
    raise exception 'cannot_change_auth_user_id';
  end if;

  if new.role is distinct from old.role then
    raise exception 'cannot_change_role';
  end if;

  if new."institutionId" is distinct from old."institutionId" then
    select exists (
      select 1
      from public.user_institutions ui
      where ui."userId" = old.id
        and ui."institutionId" = new."institutionId"
        and ui."isActive" = true
    ) into v_can_switch;

    if not v_can_switch then
      raise exception 'cannot_change_institution';
    end if;
  end if;

  return new;
end
$$;

commit;
