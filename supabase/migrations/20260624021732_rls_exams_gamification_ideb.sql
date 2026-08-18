ALTER TABLE public.saeb_descriptors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideb_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideb_indicators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS saeb_descriptors_select ON public.saeb_descriptors;
DROP POLICY IF EXISTS saeb_descriptors_write ON public.saeb_descriptors;

CREATE POLICY saeb_descriptors_select ON public.saeb_descriptors
FOR SELECT TO authenticated
USING (true);

CREATE POLICY saeb_descriptors_write ON public.saeb_descriptors
FOR ALL TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS exams_select ON public.exams;
DROP POLICY IF EXISTS exams_write ON public.exams;

CREATE POLICY exams_select ON public.exams
FOR SELECT TO authenticated
USING (public.can_access_institution("institutionId"));

CREATE POLICY exams_write ON public.exams
FOR ALL TO authenticated
USING (
  public.is_staff()
  AND public.can_access_institution("institutionId")
  AND (public.is_admin() OR "createdById" = public.current_teacher_id())
)
WITH CHECK (
  public.is_staff()
  AND public.can_access_institution("institutionId")
);

DROP POLICY IF EXISTS exam_questions_select ON public.exam_questions;
DROP POLICY IF EXISTS exam_questions_write ON public.exam_questions;

CREATE POLICY exam_questions_select ON public.exam_questions
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.exams e
    WHERE e.id = exam_questions."examId"
      AND public.can_access_institution(e."institutionId")
  )
);

CREATE POLICY exam_questions_write ON public.exam_questions
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
    WHERE e.id = exam_questions."examId"
      AND public.can_access_institution(e."institutionId")
      AND (public.is_admin() OR e."createdById" = public.current_teacher_id())
  )
);

DROP POLICY IF EXISTS exam_assignments_select ON public.exam_assignments;
DROP POLICY IF EXISTS exam_assignments_write ON public.exam_assignments;

CREATE POLICY exam_assignments_select ON public.exam_assignments
FOR SELECT TO authenticated
USING (
  exam_assignments."studentId" IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.students s
    WHERE s.id = exam_assignments."studentId"
      AND s.id = public.current_student_id()
  )
  OR (
    public.is_staff()
    AND EXISTS (
      SELECT 1
      FROM public.exams e
      WHERE e.id = exam_assignments."examId"
        AND public.can_access_institution(e."institutionId")
    )
  )
);

CREATE POLICY exam_assignments_write ON public.exam_assignments
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
  AND EXISTS (
    SELECT 1
    FROM public.exams e
    WHERE e.id = exam_assignments."examId"
      AND public.can_access_institution(e."institutionId")
      AND (public.is_admin() OR e."createdById" = public.current_teacher_id())
  )
);

DROP POLICY IF EXISTS exam_attempts_select ON public.exam_attempts;
DROP POLICY IF EXISTS exam_attempts_insert_student ON public.exam_attempts;
DROP POLICY IF EXISTS exam_attempts_update_student ON public.exam_attempts;

CREATE POLICY exam_attempts_select ON public.exam_attempts
FOR SELECT TO authenticated
USING (
  exam_attempts."studentId" = public.current_student_id()
  OR (
    public.is_staff()
    AND EXISTS (
      SELECT 1
      FROM public.exams e
      WHERE e.id = exam_attempts."examId"
        AND public.can_access_institution(e."institutionId")
    )
  )
);

CREATE POLICY exam_attempts_insert_student ON public.exam_attempts
FOR INSERT TO authenticated
WITH CHECK (
  exam_attempts."studentId" = public.current_student_id()
  AND EXISTS (
    SELECT 1
    FROM public.exams e
    WHERE e.id = exam_attempts."examId"
      AND public.can_access_institution(e."institutionId")
  )
);

CREATE POLICY exam_attempts_update_student ON public.exam_attempts
FOR UPDATE TO authenticated
USING (exam_attempts."studentId" = public.current_student_id())
WITH CHECK (exam_attempts."studentId" = public.current_student_id());

DROP POLICY IF EXISTS exam_answers_select ON public.exam_answers;
DROP POLICY IF EXISTS exam_answers_insert_student ON public.exam_answers;

CREATE POLICY exam_answers_select ON public.exam_answers
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.exam_attempts ea
    WHERE ea.id = exam_answers."attemptId"
      AND (
        ea."studentId" = public.current_student_id()
        OR (
          public.is_staff()
          AND EXISTS (
            SELECT 1
            FROM public.exams e
            WHERE e.id = ea."examId"
              AND public.can_access_institution(e."institutionId")
          )
        )
      )
  )
);

CREATE POLICY exam_answers_insert_student ON public.exam_answers
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.exam_attempts ea
    WHERE ea.id = exam_answers."attemptId"
      AND ea."studentId" = public.current_student_id()
  )
);

DROP POLICY IF EXISTS badges_select ON public.badges;
DROP POLICY IF EXISTS badges_write ON public.badges;

CREATE POLICY badges_select ON public.badges
FOR SELECT TO authenticated
USING (true);

CREATE POLICY badges_write ON public.badges
FOR ALL TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS achievements_select ON public.achievements;
DROP POLICY IF EXISTS achievements_write ON public.achievements;

CREATE POLICY achievements_select ON public.achievements
FOR SELECT TO authenticated
USING (
  achievements."userId" = public.current_app_user_id()
  OR (
    public.is_admin()
    AND EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = achievements."userId"
        AND public.can_access_institution(u."institutionId")
    )
  )
);

CREATE POLICY achievements_write ON public.achievements
FOR ALL TO authenticated
USING (public.is_staff())
WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS rankings_select ON public.rankings;
DROP POLICY IF EXISTS rankings_write ON public.rankings;

CREATE POLICY rankings_select ON public.rankings
FOR SELECT TO authenticated
USING (
  ("institutionId" IS NOT NULL AND public.can_access_institution("institutionId"))
  OR ("institutionId" IS NULL AND public.is_super_admin())
);

CREATE POLICY rankings_write ON public.rankings
FOR ALL TO authenticated
USING (
  public.is_staff()
  AND ("institutionId" IS NULL OR public.can_access_institution("institutionId"))
)
WITH CHECK (
  public.is_staff()
  AND ("institutionId" IS NULL OR public.can_access_institution("institutionId"))
);

DROP POLICY IF EXISTS points_transactions_select ON public.points_transactions;
DROP POLICY IF EXISTS points_transactions_write ON public.points_transactions;

CREATE POLICY points_transactions_select ON public.points_transactions
FOR SELECT TO authenticated
USING (
  points_transactions."userId" = public.current_app_user_id()
  OR (
    public.is_admin()
    AND EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = points_transactions."userId"
        AND public.can_access_institution(u."institutionId")
    )
  )
);

CREATE POLICY points_transactions_write ON public.points_transactions
FOR ALL TO authenticated
USING (public.is_staff())
WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS ideb_targets_select ON public.ideb_targets;
DROP POLICY IF EXISTS ideb_targets_write ON public.ideb_targets;

CREATE POLICY ideb_targets_select ON public.ideb_targets
FOR SELECT TO authenticated
USING (public.can_access_institution("institutionId"));

CREATE POLICY ideb_targets_write ON public.ideb_targets
FOR ALL TO authenticated
USING (public.is_admin() AND public.can_access_institution("institutionId"))
WITH CHECK (public.is_admin() AND public.can_access_institution("institutionId"));

DROP POLICY IF EXISTS ideb_indicators_select ON public.ideb_indicators;
DROP POLICY IF EXISTS ideb_indicators_write ON public.ideb_indicators;

CREATE POLICY ideb_indicators_select ON public.ideb_indicators
FOR SELECT TO authenticated
USING (public.can_access_institution("institutionId"));

CREATE POLICY ideb_indicators_write ON public.ideb_indicators
FOR ALL TO authenticated
USING (public.is_admin() AND public.can_access_institution("institutionId"))
WITH CHECK (public.is_admin() AND public.can_access_institution("institutionId"));
