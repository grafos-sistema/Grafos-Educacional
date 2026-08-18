begin;

-- Tighten teacher_subjects visibility and allow teachers to manage their own subject mappings.
drop policy if exists teacher_subjects_select on public.teacher_subjects;
drop policy if exists teacher_subjects_write on public.teacher_subjects;

create policy teacher_subjects_select
on public.teacher_subjects
for select
to authenticated
using (
  ("teacherId" = public.current_teacher_id())
  or (
    public.is_admin()
    and exists (
      select 1
      from public.teachers t
      join public.users u on u.id = t."userId"
      where t.id = public.teacher_subjects."teacherId"
        and public.can_access_institution(u."institutionId")
    )
  )
);

create policy teacher_subjects_admin_write
on public.teacher_subjects
for all
to authenticated
using (
  public.is_admin()
  and exists (
    select 1
    from public.teachers t
    join public.users u on u.id = t."userId"
    where t.id = public.teacher_subjects."teacherId"
      and public.can_access_institution(u."institutionId")
  )
)
with check (
  public.is_admin()
  and exists (
    select 1
    from public.teachers t
    join public.users u on u.id = t."userId"
    where t.id = public.teacher_subjects."teacherId"
      and public.can_access_institution(u."institutionId")
  )
);

create policy teacher_subjects_teacher_insert
on public.teacher_subjects
for insert
to authenticated
with check (
  public.teacher_subjects."teacherId" = public.current_teacher_id()
  and exists (
    select 1
    from public.subjects s
    where s.id = public.teacher_subjects."subjectId"
      and public.can_access_institution(s."institutionId")
  )
);

create policy teacher_subjects_teacher_delete
on public.teacher_subjects
for delete
to authenticated
using (
  public.teacher_subjects."teacherId" = public.current_teacher_id()
);

commit;
