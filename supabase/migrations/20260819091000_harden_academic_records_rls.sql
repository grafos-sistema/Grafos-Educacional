BEGIN;

-- These SECURITY DEFINER helpers deliberately read the ownership graph without
-- re-entering RLS policies. The caller identity still comes exclusively from
-- auth.uid(), and the fixed search_path prevents object-shadowing attacks.
CREATE OR REPLACE FUNCTION public.can_read_student_record(target_student_id text)
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
    SELECT student.id, student."userId", student_user."institutionId"
    FROM public.students student
    JOIN public.users student_user ON student_user.id = student."userId"
    WHERE student.id = target_student_id
  )
  SELECT EXISTS (
    SELECT 1
    FROM caller
    CROSS JOIN target
    WHERE caller.role::text = 'SUPER_ADMIN_GLOBAL'
       OR target."userId" = caller.id
       OR (
         caller.role::text = ANY (
           ARRAY['SUPER_ADMIN', 'DIRECTOR', 'INSTITUTION_ADMIN', 'COORDINATOR', 'TEACHER']
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
       OR EXISTS (
         SELECT 1
         FROM public.student_parents student_parent
         JOIN public.parents parent ON parent.id = student_parent."parentId"
         WHERE student_parent."studentId" = target.id
           AND parent."userId" = caller.id
       )
  )
$$;

CREATE OR REPLACE FUNCTION public.can_read_parent_record(target_parent_id text)
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
    SELECT parent.id, parent."userId", parent_user."institutionId"
    FROM public.parents parent
    JOIN public.users parent_user ON parent_user.id = parent."userId"
    WHERE parent.id = target_parent_id
  )
  SELECT EXISTS (
    SELECT 1
    FROM caller
    CROSS JOIN target
    WHERE caller.role::text = 'SUPER_ADMIN_GLOBAL'
       OR target."userId" = caller.id
       OR (
         caller.role::text = ANY (
           ARRAY['SUPER_ADMIN', 'DIRECTOR', 'INSTITUTION_ADMIN', 'COORDINATOR', 'TEACHER']
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
       OR EXISTS (
         SELECT 1
         FROM public.student_parents student_parent
         JOIN public.students student ON student.id = student_parent."studentId"
         WHERE student_parent."parentId" = target.id
           AND student."userId" = caller.id
       )
  )
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users app_user
    WHERE (app_user.auth_user_id = auth.uid() OR app_user.id = auth.uid()::text)
      AND app_user.role::text = ANY (
        ARRAY['SUPER_ADMIN_GLOBAL', 'SUPER_ADMIN', 'DIRECTOR', 'INSTITUTION_ADMIN', 'COORDINATOR', 'TEACHER']
      )
  )
$$;

REVOKE ALL ON FUNCTION public.can_read_student_record(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_read_parent_record(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_is_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_read_student_record(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_read_parent_record(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_staff() TO authenticated;

DROP POLICY IF EXISTS students_select ON public.students;
CREATE POLICY students_select
ON public.students
FOR SELECT TO authenticated
USING (public.can_read_student_record(id));

DROP POLICY IF EXISTS parents_select ON public.parents;
CREATE POLICY parents_select
ON public.parents
FOR SELECT TO authenticated
USING (public.can_read_parent_record(id));

DROP POLICY IF EXISTS student_parents_select ON public.student_parents;
CREATE POLICY student_parents_select
ON public.student_parents
FOR SELECT TO authenticated
USING (
  public.can_read_student_record("studentId")
  OR public.can_read_parent_record("parentId")
);

DROP POLICY IF EXISTS class_enrollments_select ON public.class_enrollments;
CREATE POLICY class_enrollments_select
ON public.class_enrollments
FOR SELECT TO authenticated
USING (public.can_read_student_record("studentId"));

DROP POLICY IF EXISTS attendances_select ON public.attendances;
CREATE POLICY attendances_select
ON public.attendances
FOR SELECT TO authenticated
USING (public.can_read_student_record("studentId"));

DROP POLICY IF EXISTS grades_select ON public.grades;
CREATE POLICY grades_select
ON public.grades
FOR SELECT TO authenticated
USING (
  public.can_read_student_record("studentId")
  AND (
    public.current_user_is_staff()
    OR (
      status::text IN ('PUBLISHED', 'FINAL')
      AND "isVisibleToStudents" = true
    )
  )
);

DROP POLICY IF EXISTS student_observations_select ON public.student_observations;
CREATE POLICY student_observations_select
ON public.student_observations
FOR SELECT TO authenticated
USING (
  public.can_read_student_record("studentId")
  AND (public.current_user_is_staff() OR "isPrivate" = false)
);

ALTER TABLE public.grades
  ALTER COLUMN "isVisibleToStudents" SET DEFAULT false;

COMMIT;
