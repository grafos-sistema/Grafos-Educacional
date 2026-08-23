BEGIN;

-- O cadastro do aluno usa upsert no navegador. Esta função verifica o
-- administrador e a instituição sem reentrar nas políticas de RLS da tabela
-- users, evitando falsos bloqueios para o administrador global.
CREATE OR REPLACE FUNCTION public.can_write_student_record(target_student_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH caller AS (
    SELECT app_user.id, app_user.role, app_user."institutionId"
    FROM public.users app_user
    WHERE app_user.auth_user_id = auth.uid()
       OR app_user.id = auth.uid()::text
    ORDER BY CASE WHEN app_user.auth_user_id = auth.uid() THEN 0 ELSE 1 END
    LIMIT 1
  ), target AS (
    SELECT student.id, student_user."institutionId"
    FROM public.students student
    JOIN public.users student_user ON student_user.id = student."userId"
    WHERE student.id = target_student_id
  )
  SELECT EXISTS (
    SELECT 1
    FROM caller
    CROSS JOIN target
    WHERE caller.role::text = 'SUPER_ADMIN_GLOBAL'
       OR (
         caller.role::text = ANY (
           ARRAY['SUPER_ADMIN', 'DIRECTOR', 'INSTITUTION_ADMIN', 'COORDINATOR']
         )
         AND (
           caller."institutionId" = target."institutionId"
           OR EXISTS (
             SELECT 1
             FROM public.user_institutions link
             WHERE link."userId" = caller.id
               AND link."institutionId" = target."institutionId"
               AND link."isActive" = true
           )
         )
       )
  )
$$;

REVOKE ALL ON FUNCTION public.can_write_student_record(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_write_student_record(text) TO authenticated;

DROP POLICY IF EXISTS student_health_records_write ON public.student_health_records;
CREATE POLICY student_health_records_write
ON public.student_health_records
FOR ALL TO authenticated
USING (public.can_write_student_record("studentId"))
WITH CHECK (public.can_write_student_record("studentId"));

COMMIT;
