begin;

-- O vínculo professor-disciplina é uma decisão da Direção ou da Coordenação.
-- A consulta continua liberada pelas políticas de leitura existentes, mas
-- nenhum professor ou perfil administrativo global deve alterar esses dados
-- diretamente pelo PostgREST.
drop policy if exists teacher_subjects_write on public.teacher_subjects;
drop policy if exists teacher_subjects_admin_write on public.teacher_subjects;
drop policy if exists teacher_subjects_teacher_insert on public.teacher_subjects;
drop policy if exists teacher_subjects_teacher_delete on public.teacher_subjects;

create policy teacher_subjects_management_write
on public.teacher_subjects
for all
to authenticated
using (
  public.current_role() in ('DIRECTOR'::"UserRole", 'COORDINATOR'::"UserRole")
  and exists (
    select 1
    from public.teachers t
    join public.users u on u.id = t."userId"
    where t.id = public.teacher_subjects."teacherId"
      and public.can_access_institution(u."institutionId")
  )
  and exists (
    select 1
    from public.subjects s
    where s.id = public.teacher_subjects."subjectId"
      and public.can_access_institution(s."institutionId")
  )
)
with check (
  public.current_role() in ('DIRECTOR'::"UserRole", 'COORDINATOR'::"UserRole")
  and exists (
    select 1
    from public.teachers t
    join public.users u on u.id = t."userId"
    where t.id = public.teacher_subjects."teacherId"
      and public.can_access_institution(u."institutionId")
  )
  and exists (
    select 1
    from public.subjects s
    where s.id = public.teacher_subjects."subjectId"
      and public.can_access_institution(s."institutionId")
  )
);

commit;
