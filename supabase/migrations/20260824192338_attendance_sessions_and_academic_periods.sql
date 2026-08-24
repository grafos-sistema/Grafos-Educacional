BEGIN;

-- Cada lançamento representa uma aula específica da grade. As colunas são
-- inicialmente opcionais para preservar os registros antigos, que foram
-- criados antes de a grade fazer parte da chave da frequência.
ALTER TABLE public.attendances
  ADD COLUMN IF NOT EXISTS "classScheduleId" text,
  ADD COLUMN IF NOT EXISTS "academicPeriodId" text,
  ADD COLUMN IF NOT EXISTS "authorizationReason" text,
  ADD COLUMN IF NOT EXISTS "authorizedById" text;

ALTER TABLE public.teacher_attendances
  ADD COLUMN IF NOT EXISTS "classScheduleId" text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'attendances_classScheduleId_fkey'
  ) THEN
    ALTER TABLE public.attendances
      ADD CONSTRAINT "attendances_classScheduleId_fkey"
      FOREIGN KEY ("classScheduleId") REFERENCES public.class_schedules(id)
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'attendances_academicPeriodId_fkey'
  ) THEN
    ALTER TABLE public.attendances
      ADD CONSTRAINT "attendances_academicPeriodId_fkey"
      FOREIGN KEY ("academicPeriodId") REFERENCES public.academic_periods(id)
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'attendances_authorizedById_fkey'
  ) THEN
    ALTER TABLE public.attendances
      ADD CONSTRAINT "attendances_authorizedById_fkey"
      FOREIGN KEY ("authorizedById") REFERENCES public.users(id)
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'teacher_attendances_classScheduleId_fkey'
  ) THEN
    ALTER TABLE public.teacher_attendances
      ADD CONSTRAINT "teacher_attendances_classScheduleId_fkey"
      FOREIGN KEY ("classScheduleId") REFERENCES public.class_schedules(id)
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- A chave anterior permitia somente uma frequência por aluno/disciplina/dia.
-- A nova chave permite uma frequência para cada aula da mesma disciplina no
-- mesmo dia (por exemplo, dois horários de Matemática na segunda-feira).
DROP INDEX IF EXISTS public."attendances_studentId_classSubjectId_date_key";
CREATE UNIQUE INDEX IF NOT EXISTS "attendances_studentId_classScheduleId_date_key"
  ON public.attendances ("studentId", "classScheduleId", date);
CREATE UNIQUE INDEX IF NOT EXISTS "attendances_studentId_classSubjectId_date_legacy_key"
  ON public.attendances ("studentId", "classSubjectId", date)
  WHERE "classScheduleId" IS NULL;

DROP INDEX IF EXISTS public."teacher_attendances_teacherId_classSubjectId_date_key";
CREATE UNIQUE INDEX IF NOT EXISTS "teacher_attendances_teacherId_classScheduleId_date_key"
  ON public.teacher_attendances ("teacherId", "classScheduleId", date);
CREATE UNIQUE INDEX IF NOT EXISTS "teacher_attendances_teacherId_classSubjectId_date_legacy_key"
  ON public.teacher_attendances ("teacherId", "classSubjectId", date)
  WHERE "classScheduleId" IS NULL;

CREATE INDEX IF NOT EXISTS "attendances_classScheduleId_date_idx"
  ON public.attendances ("classScheduleId", date);
CREATE INDEX IF NOT EXISTS "attendances_academicPeriodId_date_idx"
  ON public.attendances ("academicPeriodId", date);
CREATE INDEX IF NOT EXISTS "attendances_authorizedById_idx"
  ON public.attendances ("authorizedById");
CREATE INDEX IF NOT EXISTS "teacher_attendances_classScheduleId_date_idx"
  ON public.teacher_attendances ("classScheduleId", date);

-- Preenche o bimestre automaticamente para registros históricos quando a
-- data estiver dentro de um período do ano letivo da turma. O vínculo da
-- aula não é inferido quando há mais de um horário possível no mesmo dia.
UPDATE public.attendances a
SET "academicPeriodId" = p.id
FROM public.classes c
JOIN public.academic_periods p
  ON p."academicYearId" = c."academicYearId"
WHERE a."classId" = c.id
  AND a."academicPeriodId" IS NULL
  AND a.date::date BETWEEN p."startDate"::date AND p."endDate"::date;

-- Atualiza as funções auxiliares usadas pelo RLS. Escritas diretas pelo
-- cliente precisam informar a aula e o período; exceções autorizadas são
-- lançadas pela API autenticada, que grava a justificativa e o autorizador.
CREATE OR REPLACE FUNCTION public.can_write_attendance(
  target_class_id text,
  target_class_subject_id text,
  target_teacher_id text,
  target_student_id text,
  target_schedule_id text,
  target_period_id text,
  target_date date
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH request_context AS (
    SELECT (select auth.uid()) AS auth_id
  ), caller AS (
    SELECT u.id, u.role, u."institutionId"
    FROM public.users u
    CROSS JOIN request_context context
    WHERE u.auth_user_id = context.auth_id
       OR u.id = context.auth_id::text
    ORDER BY CASE WHEN u.auth_user_id = context.auth_id THEN 0 ELSE 1 END
    LIMIT 1
  ), target AS (
    SELECT c.id, c."institutionId", cs."teacherId", c."academicYearId",
           s.id AS student_id
    FROM public.classes c
    JOIN public.class_subjects cs
      ON cs.id = target_class_subject_id
     AND cs."classId" = c.id
    JOIN public.students s
      ON s.id = target_student_id
    JOIN public.users student_user
      ON student_user.id = s."userId"
     AND student_user."institutionId" = c."institutionId"
    WHERE c.id = target_class_id
  ), valid_period AS (
    SELECT 1
    FROM target t
    JOIN public.academic_periods p
      ON p.id = target_period_id
     AND p."academicYearId" = t."academicYearId"
     AND target_date BETWEEN p."startDate"::date AND p."endDate"::date
  ), valid_schedule AS (
    SELECT 1
    FROM target t
    JOIN public.class_schedules sched
      ON sched.id = target_schedule_id
     AND sched."classId" = t.id
     AND sched."classSubjectId" = target_class_subject_id
  )
  SELECT EXISTS (
    SELECT 1
    FROM caller
    JOIN target ON true
    WHERE caller.role::text = ANY (ARRAY[
      'SUPER_ADMIN_GLOBAL', 'SUPER_ADMIN', 'DIRECTOR',
      'INSTITUTION_ADMIN', 'COORDINATOR', 'TEACHER'
    ])
    AND (
      caller.role::text = 'SUPER_ADMIN_GLOBAL'
      OR target."institutionId" = caller."institutionId"
      OR EXISTS (
        SELECT 1 FROM public.user_institutions link
        WHERE link."userId" = caller.id
          AND link."institutionId" = target."institutionId"
          AND link."isActive" = true
      )
    )
    AND (
      caller.role::text <> 'TEACHER'
      OR (target."teacherId" = target_teacher_id
          AND EXISTS (
            SELECT 1 FROM public.teachers teacher
            WHERE teacher.id = target_teacher_id
              AND teacher."userId" = caller.id
          ))
    )
    AND target_schedule_id IS NOT NULL
    AND target_period_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM valid_period)
    AND EXISTS (SELECT 1 FROM valid_schedule)
  )
$$;

REVOKE ALL ON FUNCTION public.can_write_attendance(text, text, text, text, text, text, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_write_attendance(text, text, text, text, text, text, date) TO authenticated;

DROP POLICY IF EXISTS attendances_insert ON public.attendances;
DROP POLICY IF EXISTS attendances_update ON public.attendances;
DROP POLICY IF EXISTS attendances_delete ON public.attendances;

CREATE POLICY attendances_insert
ON public.attendances
FOR INSERT TO authenticated
WITH CHECK (
  public.can_write_attendance(
    "classId", "classSubjectId", "teacherId", "studentId",
    "classScheduleId", "academicPeriodId", "date"::date
  )
);

CREATE POLICY attendances_update
ON public.attendances
FOR UPDATE TO authenticated
USING (
  public.can_write_attendance(
    "classId", "classSubjectId", "teacherId", "studentId",
    "classScheduleId", "academicPeriodId", "date"::date
  )
)
WITH CHECK (
  public.can_write_attendance(
    "classId", "classSubjectId", "teacherId", "studentId",
    "classScheduleId", "academicPeriodId", "date"::date
  )
);

CREATE POLICY attendances_delete
ON public.attendances
FOR DELETE TO authenticated
USING (
  public.can_write_attendance(
    "classId", "classSubjectId", "teacherId", "studentId",
    "classScheduleId", "academicPeriodId", "date"::date
  )
);

COMMIT;
