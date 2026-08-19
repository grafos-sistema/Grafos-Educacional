-- Fecha acessos diretos que permitiam enumerar questões ou manipular registros
-- acadêmicos fora dos fluxos validados pela API.

-- Compatibilidade com políticas antigas: o antigo SUPER_ADMIN é local e não
-- deve receber o alcance irrestrito reservado ao SUPER_ADMIN_GLOBAL.
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT public.is_global_admin()
$$;

DROP POLICY IF EXISTS questions_select ON public.questions;
CREATE POLICY questions_select
ON public.questions
FOR SELECT TO authenticated
USING (
  public.is_staff()
  AND (
    "isPublic" = true
    OR ("institutionId" IS NOT NULL AND public.can_access_institution("institutionId"))
  )
);

DROP POLICY IF EXISTS question_options_select ON public.question_options;
CREATE POLICY question_options_select
ON public.question_options
FOR SELECT TO authenticated
USING (
  public.is_staff()
  AND EXISTS (
    SELECT 1
    FROM public.questions q
    WHERE q.id = question_options."questionId"
      AND (
        q."isPublic" = true
        OR (q."institutionId" IS NOT NULL AND public.can_access_institution(q."institutionId"))
      )
  )
);

DROP POLICY IF EXISTS activities_select ON public.activities;
CREATE POLICY activities_select
ON public.activities
FOR SELECT TO authenticated
USING (public.is_staff() AND public.can_access_institution("institutionId"));

DROP POLICY IF EXISTS lesson_plans_select ON public.lesson_plans;
CREATE POLICY lesson_plans_select
ON public.lesson_plans
FOR SELECT TO authenticated
USING (
  public.is_staff()
  AND EXISTS (
    SELECT 1
    FROM public.academic_periods p
    JOIN public.academic_years y ON y.id = p."academicYearId"
    WHERE p.id = lesson_plans."academicPeriodId"
      AND public.can_access_institution(y."institutionId")
  )
);

DROP POLICY IF EXISTS teacher_attendances_select ON public.teacher_attendances;
CREATE POLICY teacher_attendances_select
ON public.teacher_attendances
FOR SELECT TO authenticated
USING (
  public.is_staff()
  AND EXISTS (
    SELECT 1
    FROM public.classes c
    WHERE c.id = teacher_attendances."classId"
      AND public.can_access_institution(c."institutionId")
  )
);

DROP POLICY IF EXISTS assignments_select ON public.assignments;
CREATE POLICY assignments_select
ON public.assignments
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.class_subjects cs
    JOIN public.classes c ON c.id = cs."classId"
    WHERE cs.id = assignments."classSubjectId"
      AND (
        (public.is_staff() AND public.can_access_institution(c."institutionId"))
        OR (
          EXISTS (
            SELECT 1
            FROM public.class_enrollments ce
            WHERE ce."classId" = c.id
              AND ce.status = 'ENROLLED'
              AND (
                ce."studentId" = public.current_student_id()
                OR EXISTS (
                  SELECT 1
                  FROM public.student_parents sp
                  WHERE sp."studentId" = ce."studentId"
                    AND sp."parentId" = public.current_parent_id()
                )
              )
          )
        )
      )
  )
);

DROP POLICY IF EXISTS assignment_submissions_insert_student ON public.assignment_submissions;
CREATE POLICY assignment_submissions_insert_student
ON public.assignment_submissions
FOR INSERT TO authenticated
WITH CHECK (
  assignment_submissions."studentId" = public.current_student_id()
  AND EXISTS (
    SELECT 1
    FROM public.assignments a
    JOIN public.class_subjects cs ON cs.id = a."classSubjectId"
    JOIN public.class_enrollments ce ON ce."classId" = cs."classId"
    WHERE a.id = assignment_submissions."assignmentId"
      AND ce."studentId" = assignment_submissions."studentId"
      AND ce.status = 'ENROLLED'
  )
);

CREATE OR REPLACE FUNCTION public.current_student_is_assigned_to_exam(target_exam_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.exam_assignments ea
    WHERE ea."examId" = target_exam_id
      AND (
        ea."studentId" = public.current_student_id()
        OR EXISTS (
          SELECT 1
          FROM public.class_enrollments ce
          WHERE ce."classId" = ea."classId"
            AND ce."studentId" = public.current_student_id()
            AND ce.status = 'ENROLLED'
        )
      )
  )
$$;

REVOKE ALL ON FUNCTION public.current_student_is_assigned_to_exam(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_student_is_assigned_to_exam(text) TO authenticated;

DROP POLICY IF EXISTS exams_select ON public.exams;
CREATE POLICY exams_select
ON public.exams
FOR SELECT TO authenticated
USING (
  (public.is_staff() AND public.can_access_institution("institutionId"))
  OR (
    status = 'PUBLISHED'
    AND public.current_student_is_assigned_to_exam(exams.id)
  )
);

DROP POLICY IF EXISTS exams_write ON public.exams;
CREATE POLICY exams_write
ON public.exams
FOR ALL TO authenticated
USING (
  public.is_staff()
  AND public.can_access_institution("institutionId")
  AND (public.is_admin() OR "createdById" = public.current_teacher_id())
)
WITH CHECK (
  public.is_staff()
  AND public.can_access_institution("institutionId")
  AND (public.is_admin() OR "createdById" = public.current_teacher_id())
);

DROP POLICY IF EXISTS exam_questions_select ON public.exam_questions;
CREATE POLICY exam_questions_select
ON public.exam_questions
FOR SELECT TO authenticated
USING (
  public.is_staff()
  AND EXISTS (
    SELECT 1
    FROM public.exams e
    WHERE e.id = exam_questions."examId"
      AND public.can_access_institution(e."institutionId")
  )
);

DROP POLICY IF EXISTS exam_questions_write ON public.exam_questions;
CREATE POLICY exam_questions_write
ON public.exam_questions
FOR ALL TO authenticated
USING (
  public.is_staff()
  AND EXISTS (
    SELECT 1
    FROM public.exams e
    WHERE e.id = exam_questions."examId"
      AND public.can_access_institution(e."institutionId")
      AND (public.is_admin() OR e."createdById" = public.current_teacher_id())
  )
)
WITH CHECK (
  public.is_staff()
  AND EXISTS (
    SELECT 1
    FROM public.exams e
    JOIN public.questions q ON q.id = exam_questions."questionId"
    WHERE e.id = exam_questions."examId"
      AND public.can_access_institution(e."institutionId")
      AND (public.is_admin() OR e."createdById" = public.current_teacher_id())
      AND (q."isPublic" = true OR q."institutionId" = e."institutionId")
  )
);

DROP POLICY IF EXISTS exam_assignments_write ON public.exam_assignments;
CREATE POLICY exam_assignments_write
ON public.exam_assignments
FOR ALL TO authenticated
USING (
  public.is_staff()
  AND EXISTS (
    SELECT 1
    FROM public.exams e
    WHERE e.id = exam_assignments."examId"
      AND public.can_access_institution(e."institutionId")
      AND (public.is_admin() OR e."createdById" = public.current_teacher_id())
  )
)
WITH CHECK (
  public.is_staff()
  AND (exam_assignments."studentId" IS NOT NULL OR exam_assignments."classId" IS NOT NULL)
  AND EXISTS (
    SELECT 1
    FROM public.exams e
    WHERE e.id = exam_assignments."examId"
      AND public.can_access_institution(e."institutionId")
      AND (public.is_admin() OR e."createdById" = public.current_teacher_id())
      AND (
        exam_assignments."studentId" IS NULL
        OR EXISTS (
          SELECT 1
          FROM public.students s
          JOIN public.users u ON u.id = s."userId"
          WHERE s.id = exam_assignments."studentId"
            AND u."institutionId" = e."institutionId"
        )
      )
      AND (
        exam_assignments."classId" IS NULL
        OR EXISTS (
          SELECT 1
          FROM public.classes c
          WHERE c.id = exam_assignments."classId"
            AND c."institutionId" = e."institutionId"
        )
      )
  )
);

-- Tentativas e respostas passam exclusivamente pela API, que valida
-- publicação, prazo, vínculo com turma e integridade da questão.
DROP POLICY IF EXISTS exam_attempts_insert_student ON public.exam_attempts;
DROP POLICY IF EXISTS exam_attempts_update_student ON public.exam_attempts;
DROP POLICY IF EXISTS exam_answers_insert_student ON public.exam_answers;
REVOKE INSERT, UPDATE, DELETE ON public.exam_attempts FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.exam_answers FROM authenticated;

DROP POLICY IF EXISTS achievements_write ON public.achievements;
CREATE POLICY achievements_write
ON public.achievements
FOR ALL TO authenticated
USING (
  public.is_staff()
  AND EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = achievements."userId"
      AND public.can_access_institution(u."institutionId")
  )
)
WITH CHECK (
  public.is_staff()
  AND EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = achievements."userId"
      AND public.can_access_institution(u."institutionId")
  )
);

DROP POLICY IF EXISTS points_transactions_write ON public.points_transactions;
CREATE POLICY points_transactions_write
ON public.points_transactions
FOR ALL TO authenticated
USING (
  public.is_staff()
  AND EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = points_transactions."userId"
      AND public.can_access_institution(u."institutionId")
  )
)
WITH CHECK (
  public.is_staff()
  AND EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = points_transactions."userId"
      AND public.can_access_institution(u."institutionId")
  )
);

DROP POLICY IF EXISTS rankings_write ON public.rankings;
CREATE POLICY rankings_write
ON public.rankings
FOR ALL TO authenticated
USING (
  public.is_staff()
  AND EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = rankings."userId"
      AND public.can_access_institution(u."institutionId")
  )
  AND (
    ("institutionId" IS NULL AND public.is_super_admin())
    OR ("institutionId" IS NOT NULL AND public.can_access_institution("institutionId"))
  )
)
WITH CHECK (
  public.is_staff()
  AND EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = rankings."userId"
      AND public.can_access_institution(u."institutionId")
      AND (rankings."institutionId" IS NULL OR u."institutionId" = rankings."institutionId")
  )
  AND (
    ("institutionId" IS NULL AND public.is_super_admin())
    OR ("institutionId" IS NOT NULL AND public.can_access_institution("institutionId"))
  )
);
