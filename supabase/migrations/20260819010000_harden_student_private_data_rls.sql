BEGIN;

ALTER TABLE public.student_health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_transportation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.student_health_records;
DROP POLICY IF EXISTS "Enable insert access for all authenticated users" ON public.student_health_records;
DROP POLICY IF EXISTS "Enable update access for all authenticated users" ON public.student_health_records;
DROP POLICY IF EXISTS "Enable delete access for all authenticated users" ON public.student_health_records;
DROP POLICY IF EXISTS student_health_records_select ON public.student_health_records;
DROP POLICY IF EXISTS student_health_records_write ON public.student_health_records;

CREATE POLICY student_health_records_select
ON public.student_health_records
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.students student
    JOIN public.users student_user ON student_user.id = student."userId"
    WHERE student.id = student_health_records."studentId"
      AND (
        student."userId" = public.current_app_user_id()
        OR (
          public.is_staff()
          AND public.can_access_institution(student_user."institutionId")
        )
        OR EXISTS (
          SELECT 1
          FROM public.student_parents student_parent
          JOIN public.parents parent ON parent.id = student_parent."parentId"
          WHERE student_parent."studentId" = student.id
            AND parent."userId" = public.current_app_user_id()
        )
      )
  )
);

CREATE POLICY student_health_records_write
ON public.student_health_records
FOR ALL TO authenticated
USING (
  public.is_admin()
  AND EXISTS (
    SELECT 1
    FROM public.students student
    JOIN public.users student_user ON student_user.id = student."userId"
    WHERE student.id = student_health_records."studentId"
      AND public.can_access_institution(student_user."institutionId")
  )
)
WITH CHECK (
  public.is_admin()
  AND EXISTS (
    SELECT 1
    FROM public.students student
    JOIN public.users student_user ON student_user.id = student."userId"
    WHERE student.id = student_health_records."studentId"
      AND public.can_access_institution(student_user."institutionId")
  )
);

DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.student_transportation;
DROP POLICY IF EXISTS "Enable insert access for all authenticated users" ON public.student_transportation;
DROP POLICY IF EXISTS "Enable update access for all authenticated users" ON public.student_transportation;
DROP POLICY IF EXISTS "Enable delete access for all authenticated users" ON public.student_transportation;
DROP POLICY IF EXISTS student_transportation_select ON public.student_transportation;
DROP POLICY IF EXISTS student_transportation_write ON public.student_transportation;

CREATE POLICY student_transportation_select
ON public.student_transportation
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.students student
    JOIN public.users student_user ON student_user.id = student."userId"
    WHERE student.id = student_transportation."studentId"
      AND (
        student."userId" = public.current_app_user_id()
        OR (
          public.is_staff()
          AND public.can_access_institution(student_user."institutionId")
        )
        OR EXISTS (
          SELECT 1
          FROM public.student_parents student_parent
          JOIN public.parents parent ON parent.id = student_parent."parentId"
          WHERE student_parent."studentId" = student.id
            AND parent."userId" = public.current_app_user_id()
        )
      )
  )
);

CREATE POLICY student_transportation_write
ON public.student_transportation
FOR ALL TO authenticated
USING (
  public.is_admin()
  AND EXISTS (
    SELECT 1
    FROM public.students student
    JOIN public.users student_user ON student_user.id = student."userId"
    WHERE student.id = student_transportation."studentId"
      AND public.can_access_institution(student_user."institutionId")
  )
)
WITH CHECK (
  public.is_admin()
  AND EXISTS (
    SELECT 1
    FROM public.students student
    JOIN public.users student_user ON student_user.id = student."userId"
    WHERE student.id = student_transportation."studentId"
      AND public.can_access_institution(student_user."institutionId")
  )
);

COMMIT;
