ALTER TABLE public.question_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS question_categories_select ON public.question_categories;
DROP POLICY IF EXISTS question_categories_write ON public.question_categories;

CREATE POLICY question_categories_select ON public.question_categories
FOR SELECT TO authenticated
USING (public.can_access_institution("institutionId"));

CREATE POLICY question_categories_write ON public.question_categories
FOR ALL TO authenticated
USING (public.is_staff() AND public.can_access_institution("institutionId"))
WITH CHECK (public.is_staff() AND public.can_access_institution("institutionId"));

DROP POLICY IF EXISTS questions_select ON public.questions;
DROP POLICY IF EXISTS questions_write ON public.questions;

CREATE POLICY questions_select ON public.questions
FOR SELECT TO authenticated
USING (
  "isPublic" = true
  OR ("institutionId" IS NOT NULL AND public.can_access_institution("institutionId"))
);

CREATE POLICY questions_write ON public.questions
FOR ALL TO authenticated
USING (
  public.is_staff()
  AND (
    ("institutionId" IS NOT NULL AND public.can_access_institution("institutionId"))
    OR ("institutionId" IS NULL AND public.is_super_admin())
  )
)
WITH CHECK (
  public.is_staff()
  AND (
    ("institutionId" IS NOT NULL AND public.can_access_institution("institutionId"))
    OR ("institutionId" IS NULL AND public.is_super_admin())
  )
  AND "createdById" = public.current_app_user_id()
);

DROP POLICY IF EXISTS question_options_select ON public.question_options;
DROP POLICY IF EXISTS question_options_write ON public.question_options;

CREATE POLICY question_options_select ON public.question_options
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.questions q
    WHERE q.id = question_options."questionId"
      AND (
        q."isPublic" = true
        OR (q."institutionId" IS NOT NULL AND public.can_access_institution(q."institutionId"))
      )
  )
);

CREATE POLICY question_options_write ON public.question_options
FOR ALL TO authenticated
USING (
  public.is_staff()
  AND EXISTS (
    SELECT 1
    FROM public.questions q
    WHERE q.id = question_options."questionId"
      AND (
        (q."institutionId" IS NOT NULL AND public.can_access_institution(q."institutionId"))
        OR (q."institutionId" IS NULL AND public.is_super_admin())
      )
  )
)
WITH CHECK (
  public.is_staff()
  AND EXISTS (
    SELECT 1
    FROM public.questions q
    WHERE q.id = question_options."questionId"
      AND (
        (q."institutionId" IS NOT NULL AND public.can_access_institution(q."institutionId"))
        OR (q."institutionId" IS NULL AND public.is_super_admin())
      )
  )
);

DROP POLICY IF EXISTS activities_select ON public.activities;
DROP POLICY IF EXISTS activities_write ON public.activities;

CREATE POLICY activities_select ON public.activities
FOR SELECT TO authenticated
USING (public.can_access_institution("institutionId"));

CREATE POLICY activities_write ON public.activities
FOR ALL TO authenticated
USING (
  public.is_staff()
  AND public.can_access_institution("institutionId")
  AND (
    public.is_admin()
    OR "teacherId" = public.current_teacher_id()
  )
)
WITH CHECK (
  public.is_staff()
  AND public.can_access_institution("institutionId")
  AND (
    public.is_admin()
    OR "teacherId" = public.current_teacher_id()
  )
);

DROP POLICY IF EXISTS activity_questions_select ON public.activity_questions;
DROP POLICY IF EXISTS activity_questions_write ON public.activity_questions;

CREATE POLICY activity_questions_select ON public.activity_questions
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.activities a
    WHERE a.id = activity_questions."activityId"
      AND public.can_access_institution(a."institutionId")
  )
);

CREATE POLICY activity_questions_write ON public.activity_questions
FOR ALL TO authenticated
USING (
  public.is_staff()
  AND EXISTS (
    SELECT 1
    FROM public.activities a
    WHERE a.id = activity_questions."activityId"
      AND public.can_access_institution(a."institutionId")
      AND (public.is_admin() OR a."teacherId" = public.current_teacher_id())
  )
)
WITH CHECK (
  public.is_staff()
  AND EXISTS (
    SELECT 1
    FROM public.activities a
    WHERE a.id = activity_questions."activityId"
      AND public.can_access_institution(a."institutionId")
      AND (public.is_admin() OR a."teacherId" = public.current_teacher_id())
  )
);

DROP POLICY IF EXISTS attendances_select ON public.attendances;
DROP POLICY IF EXISTS attendances_write ON public.attendances;

CREATE POLICY attendances_select ON public.attendances
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.classes c
    WHERE c.id = attendances."classId"
      AND public.can_access_institution(c."institutionId")
  )
);

CREATE POLICY attendances_write ON public.attendances
FOR ALL TO authenticated
USING (
  public.is_staff()
  AND EXISTS (
    SELECT 1
    FROM public.classes c
    WHERE c.id = attendances."classId"
      AND public.can_access_institution(c."institutionId")
  )
  AND (public.is_admin() OR attendances."teacherId" = public.current_teacher_id())
)
WITH CHECK (
  public.is_staff()
  AND EXISTS (
    SELECT 1
    FROM public.classes c
    WHERE c.id = attendances."classId"
      AND public.can_access_institution(c."institutionId")
  )
  AND (public.is_admin() OR attendances."teacherId" = public.current_teacher_id())
);

DROP POLICY IF EXISTS lesson_contents_select ON public.lesson_contents;
DROP POLICY IF EXISTS lesson_contents_write ON public.lesson_contents;

CREATE POLICY lesson_contents_select ON public.lesson_contents
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.class_subjects cs
    JOIN public.classes c ON c.id = cs."classId"
    WHERE cs.id = lesson_contents."classSubjectId"
      AND public.can_access_institution(c."institutionId")
  )
);

CREATE POLICY lesson_contents_write ON public.lesson_contents
FOR ALL TO authenticated
USING (
  public.is_staff()
  AND (public.is_admin() OR lesson_contents."teacherId" = public.current_teacher_id())
  AND EXISTS (
    SELECT 1
    FROM public.class_subjects cs
    JOIN public.classes c ON c.id = cs."classId"
    WHERE cs.id = lesson_contents."classSubjectId"
      AND public.can_access_institution(c."institutionId")
  )
)
WITH CHECK (
  public.is_staff()
  AND (public.is_admin() OR lesson_contents."teacherId" = public.current_teacher_id())
  AND EXISTS (
    SELECT 1
    FROM public.class_subjects cs
    JOIN public.classes c ON c.id = cs."classId"
    WHERE cs.id = lesson_contents."classSubjectId"
      AND public.can_access_institution(c."institutionId")
  )
);

DROP POLICY IF EXISTS lesson_plans_select ON public.lesson_plans;
DROP POLICY IF EXISTS lesson_plans_write ON public.lesson_plans;

CREATE POLICY lesson_plans_select ON public.lesson_plans
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.academic_periods p
    JOIN public.academic_years y ON y.id = p."academicYearId"
    WHERE p.id = lesson_plans."academicPeriodId"
      AND public.can_access_institution(y."institutionId")
  )
);

CREATE POLICY lesson_plans_write ON public.lesson_plans
FOR ALL TO authenticated
USING (
  public.is_staff()
  AND EXISTS (
    SELECT 1
    FROM public.academic_periods p
    JOIN public.academic_years y ON y.id = p."academicYearId"
    WHERE p.id = lesson_plans."academicPeriodId"
      AND public.can_access_institution(y."institutionId")
  )
  AND (
    public.is_admin()
    OR lesson_plans."teacherId" = public.current_teacher_id()
  )
)
WITH CHECK (
  public.is_staff()
  AND EXISTS (
    SELECT 1
    FROM public.academic_periods p
    JOIN public.academic_years y ON y.id = p."academicYearId"
    WHERE p.id = lesson_plans."academicPeriodId"
      AND public.can_access_institution(y."institutionId")
  )
);

DROP POLICY IF EXISTS grades_select ON public.grades;
DROP POLICY IF EXISTS grades_write ON public.grades;

CREATE POLICY grades_select ON public.grades
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.academic_periods p
    JOIN public.academic_years y ON y.id = p."academicYearId"
    WHERE p.id = grades."academicPeriodId"
      AND public.can_access_institution(y."institutionId")
  )
);

CREATE POLICY grades_write ON public.grades
FOR ALL TO authenticated
USING (
  public.is_staff()
  AND EXISTS (
    SELECT 1
    FROM public.academic_periods p
    JOIN public.academic_years y ON y.id = p."academicYearId"
    WHERE p.id = grades."academicPeriodId"
      AND public.can_access_institution(y."institutionId")
  )
  AND (public.is_admin() OR grades."teacherId" = public.current_teacher_id())
)
WITH CHECK (
  public.is_staff()
  AND (public.is_admin() OR grades."teacherId" = public.current_teacher_id())
);

DROP POLICY IF EXISTS assignments_select ON public.assignments;
DROP POLICY IF EXISTS assignments_write ON public.assignments;

CREATE POLICY assignments_select ON public.assignments
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.class_subjects cs
    JOIN public.classes c ON c.id = cs."classId"
    WHERE cs.id = assignments."classSubjectId"
      AND public.can_access_institution(c."institutionId")
  )
);

CREATE POLICY assignments_write ON public.assignments
FOR ALL TO authenticated
USING (
  public.is_staff()
  AND (public.is_admin() OR assignments."teacherId" = public.current_teacher_id())
  AND EXISTS (
    SELECT 1
    FROM public.class_subjects cs
    JOIN public.classes c ON c.id = cs."classId"
    WHERE cs.id = assignments."classSubjectId"
      AND public.can_access_institution(c."institutionId")
  )
)
WITH CHECK (
  public.is_staff()
  AND (public.is_admin() OR assignments."teacherId" = public.current_teacher_id())
  AND EXISTS (
    SELECT 1
    FROM public.class_subjects cs
    JOIN public.classes c ON c.id = cs."classId"
    WHERE cs.id = assignments."classSubjectId"
      AND public.can_access_institution(c."institutionId")
  )
);

DROP POLICY IF EXISTS assignment_submissions_select ON public.assignment_submissions;
DROP POLICY IF EXISTS assignment_submissions_insert_student ON public.assignment_submissions;

CREATE POLICY assignment_submissions_select ON public.assignment_submissions
FOR SELECT TO authenticated
USING (
  assignment_submissions."studentId" = public.current_student_id()
  OR (
    public.is_staff()
    AND EXISTS (
      SELECT 1
      FROM public.assignments a
      JOIN public.class_subjects cs ON cs.id = a."classSubjectId"
      JOIN public.classes c ON c.id = cs."classId"
      WHERE a.id = assignment_submissions."assignmentId"
        AND public.can_access_institution(c."institutionId")
    )
  )
);

CREATE POLICY assignment_submissions_insert_student ON public.assignment_submissions
FOR INSERT TO authenticated
WITH CHECK (
  assignment_submissions."studentId" = public.current_student_id()
);

DROP POLICY IF EXISTS student_observations_select ON public.student_observations;
DROP POLICY IF EXISTS student_observations_write ON public.student_observations;

CREATE POLICY student_observations_select ON public.student_observations
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.students s
    JOIN public.users u ON u.id = s."userId"
    WHERE s.id = student_observations."studentId"
      AND public.can_access_institution(u."institutionId")
  )
);

CREATE POLICY student_observations_write ON public.student_observations
FOR ALL TO authenticated
USING (
  public.is_staff()
  AND (public.is_admin() OR student_observations."teacherId" = public.current_teacher_id())
)
WITH CHECK (
  public.is_staff()
  AND (public.is_admin() OR student_observations."teacherId" = public.current_teacher_id())
);

DROP POLICY IF EXISTS teacher_subjects_select ON public.teacher_subjects;
DROP POLICY IF EXISTS teacher_subjects_write ON public.teacher_subjects;

CREATE POLICY teacher_subjects_select ON public.teacher_subjects
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.teachers t
    JOIN public.users u ON u.id = t."userId"
    WHERE t.id = teacher_subjects."teacherId"
      AND public.can_access_institution(u."institutionId")
  )
);

CREATE POLICY teacher_subjects_write ON public.teacher_subjects
FOR ALL TO authenticated
USING (
  public.is_admin()
  AND EXISTS (
    SELECT 1
    FROM public.teachers t
    JOIN public.users u ON u.id = t."userId"
    WHERE t.id = teacher_subjects."teacherId"
      AND public.can_access_institution(u."institutionId")
  )
)
WITH CHECK (
  public.is_admin()
  AND EXISTS (
    SELECT 1
    FROM public.teachers t
    JOIN public.users u ON u.id = t."userId"
    WHERE t.id = teacher_subjects."teacherId"
      AND public.can_access_institution(u."institutionId")
  )
);

DROP POLICY IF EXISTS teacher_attendances_select ON public.teacher_attendances;
DROP POLICY IF EXISTS teacher_attendances_write ON public.teacher_attendances;

CREATE POLICY teacher_attendances_select ON public.teacher_attendances
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.classes c
    WHERE c.id = teacher_attendances."classId"
      AND public.can_access_institution(c."institutionId")
  )
);

CREATE POLICY teacher_attendances_write ON public.teacher_attendances
FOR ALL TO authenticated
USING (
  public.is_staff()
  AND EXISTS (
    SELECT 1
    FROM public.classes c
    WHERE c.id = teacher_attendances."classId"
      AND public.can_access_institution(c."institutionId")
  )
  AND (public.is_admin() OR teacher_attendances."teacherId" = public.current_teacher_id())
)
WITH CHECK (
  public.is_staff()
  AND (public.is_admin() OR teacher_attendances."teacherId" = public.current_teacher_id())
);
