ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subject_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS institutions_select_anon ON public.institutions;
DROP POLICY IF EXISTS institutions_select_auth ON public.institutions;
DROP POLICY IF EXISTS institutions_update ON public.institutions;

CREATE POLICY institutions_select_anon ON public.institutions
FOR SELECT TO anon
USING ("isActive" = true);

CREATE POLICY institutions_select_auth ON public.institutions
FOR SELECT TO authenticated
USING (public.can_access_institution(id));

CREATE POLICY institutions_update ON public.institutions
FOR UPDATE TO authenticated
USING (public.is_admin() AND public.can_access_institution(id))
WITH CHECK (public.is_admin() AND public.can_access_institution(id));

DROP POLICY IF EXISTS users_select ON public.users;
DROP POLICY IF EXISTS users_insert_self ON public.users;
DROP POLICY IF EXISTS users_insert_staff ON public.users;
DROP POLICY IF EXISTS users_update_self ON public.users;
DROP POLICY IF EXISTS users_update_staff ON public.users;

CREATE POLICY users_select ON public.users
FOR SELECT TO authenticated
USING (
  auth_user_id = auth.uid()
  OR (public.is_admin() AND public.can_access_institution("institutionId"))
);

CREATE POLICY users_insert_self ON public.users
FOR INSERT TO authenticated
WITH CHECK (
  auth_user_id = auth.uid()
  AND id = auth.uid()::text
  AND email = (auth.jwt() ->> 'email')
  AND EXISTS (SELECT 1 FROM public.institutions i WHERE i.id = "institutionId")
  AND role IN ('TEACHER'::"UserRole", 'STUDENT'::"UserRole", 'PARENT'::"UserRole")
);

CREATE POLICY users_insert_staff ON public.users
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin()
  AND public.can_access_institution("institutionId")
);

CREATE POLICY users_update_self ON public.users
FOR UPDATE TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY users_update_staff ON public.users
FOR UPDATE TO authenticated
USING (public.is_admin() AND public.can_access_institution("institutionId"))
WITH CHECK (public.is_admin() AND public.can_access_institution("institutionId"));

DROP POLICY IF EXISTS user_institutions_select ON public.user_institutions;
DROP POLICY IF EXISTS user_institutions_write ON public.user_institutions;

CREATE POLICY user_institutions_select ON public.user_institutions
FOR SELECT TO authenticated
USING (public.can_access_institution("institutionId"));

CREATE POLICY user_institutions_write ON public.user_institutions
FOR ALL TO authenticated
USING (public.is_admin() AND public.can_access_institution("institutionId"))
WITH CHECK (public.is_admin() AND public.can_access_institution("institutionId"));

DROP POLICY IF EXISTS teachers_select ON public.teachers;
DROP POLICY IF EXISTS teachers_write ON public.teachers;

CREATE POLICY teachers_select ON public.teachers
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = teachers."userId"
      AND public.can_access_institution(u."institutionId")
  )
);

CREATE POLICY teachers_write ON public.teachers
FOR ALL TO authenticated
USING (
  public.is_admin()
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = teachers."userId"
      AND public.can_access_institution(u."institutionId")
  )
)
WITH CHECK (
  public.is_admin()
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = teachers."userId"
      AND public.can_access_institution(u."institutionId")
  )
);

DROP POLICY IF EXISTS students_select ON public.students;
DROP POLICY IF EXISTS students_write ON public.students;

CREATE POLICY students_select ON public.students
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = students."userId"
      AND public.can_access_institution(u."institutionId")
  )
);

CREATE POLICY students_write ON public.students
FOR ALL TO authenticated
USING (
  public.is_admin()
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = students."userId"
      AND public.can_access_institution(u."institutionId")
  )
)
WITH CHECK (
  public.is_admin()
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = students."userId"
      AND public.can_access_institution(u."institutionId")
  )
);

DROP POLICY IF EXISTS parents_select ON public.parents;
DROP POLICY IF EXISTS parents_write ON public.parents;

CREATE POLICY parents_select ON public.parents
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = parents."userId"
      AND public.can_access_institution(u."institutionId")
  )
);

CREATE POLICY parents_write ON public.parents
FOR ALL TO authenticated
USING (
  public.is_admin()
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = parents."userId"
      AND public.can_access_institution(u."institutionId")
  )
)
WITH CHECK (
  public.is_admin()
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = parents."userId"
      AND public.can_access_institution(u."institutionId")
  )
);

DROP POLICY IF EXISTS student_parents_select ON public.student_parents;
DROP POLICY IF EXISTS student_parents_write ON public.student_parents;

CREATE POLICY student_parents_select ON public.student_parents
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.students s
    JOIN public.users u ON u.id = s."userId"
    WHERE s.id = student_parents."studentId"
      AND public.can_access_institution(u."institutionId")
  )
);

CREATE POLICY student_parents_write ON public.student_parents
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS academic_years_select ON public.academic_years;
DROP POLICY IF EXISTS academic_years_write ON public.academic_years;

CREATE POLICY academic_years_select ON public.academic_years
FOR SELECT TO authenticated
USING (public.can_access_institution("institutionId"));

CREATE POLICY academic_years_write ON public.academic_years
FOR ALL TO authenticated
USING (public.is_admin() AND public.can_access_institution("institutionId"))
WITH CHECK (public.is_admin() AND public.can_access_institution("institutionId"));

DROP POLICY IF EXISTS academic_periods_select ON public.academic_periods;
DROP POLICY IF EXISTS academic_periods_write ON public.academic_periods;

CREATE POLICY academic_periods_select ON public.academic_periods
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.academic_years y
    WHERE y.id = academic_periods."academicYearId"
      AND public.can_access_institution(y."institutionId")
  )
);

CREATE POLICY academic_periods_write ON public.academic_periods
FOR ALL TO authenticated
USING (
  public.is_admin()
  AND EXISTS (
    SELECT 1
    FROM public.academic_years y
    WHERE y.id = academic_periods."academicYearId"
      AND public.can_access_institution(y."institutionId")
  )
)
WITH CHECK (
  public.is_admin()
  AND EXISTS (
    SELECT 1
    FROM public.academic_years y
    WHERE y.id = academic_periods."academicYearId"
      AND public.can_access_institution(y."institutionId")
  )
);

DROP POLICY IF EXISTS courses_select ON public.courses;
DROP POLICY IF EXISTS courses_write ON public.courses;

CREATE POLICY courses_select ON public.courses
FOR SELECT TO authenticated
USING (public.can_access_institution("institutionId"));

CREATE POLICY courses_write ON public.courses
FOR ALL TO authenticated
USING (public.is_admin() AND public.can_access_institution("institutionId"))
WITH CHECK (public.is_admin() AND public.can_access_institution("institutionId"));

DROP POLICY IF EXISTS classes_select ON public.classes;
DROP POLICY IF EXISTS classes_write ON public.classes;

CREATE POLICY classes_select ON public.classes
FOR SELECT TO authenticated
USING (public.can_access_institution("institutionId"));

CREATE POLICY classes_write ON public.classes
FOR ALL TO authenticated
USING (public.is_admin() AND public.can_access_institution("institutionId"))
WITH CHECK (public.is_admin() AND public.can_access_institution("institutionId"));

DROP POLICY IF EXISTS class_enrollments_select ON public.class_enrollments;
DROP POLICY IF EXISTS class_enrollments_write ON public.class_enrollments;

CREATE POLICY class_enrollments_select ON public.class_enrollments
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.classes c
    WHERE c.id = class_enrollments."classId"
      AND public.can_access_institution(c."institutionId")
  )
);

CREATE POLICY class_enrollments_write ON public.class_enrollments
FOR ALL TO authenticated
USING (
  public.is_admin()
  AND EXISTS (
    SELECT 1
    FROM public.classes c
    WHERE c.id = class_enrollments."classId"
      AND public.can_access_institution(c."institutionId")
  )
)
WITH CHECK (
  public.is_admin()
  AND EXISTS (
    SELECT 1
    FROM public.classes c
    WHERE c.id = class_enrollments."classId"
      AND public.can_access_institution(c."institutionId")
  )
);

DROP POLICY IF EXISTS subjects_select ON public.subjects;
DROP POLICY IF EXISTS subjects_write ON public.subjects;

CREATE POLICY subjects_select ON public.subjects
FOR SELECT TO authenticated
USING (public.can_access_institution("institutionId"));

CREATE POLICY subjects_write ON public.subjects
FOR ALL TO authenticated
USING (public.is_admin() AND public.can_access_institution("institutionId"))
WITH CHECK (public.is_admin() AND public.can_access_institution("institutionId"));

DROP POLICY IF EXISTS class_subjects_select ON public.class_subjects;
DROP POLICY IF EXISTS class_subjects_write ON public.class_subjects;

CREATE POLICY class_subjects_select ON public.class_subjects
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.classes c
    WHERE c.id = class_subjects."classId"
      AND public.can_access_institution(c."institutionId")
  )
);

CREATE POLICY class_subjects_write ON public.class_subjects
FOR ALL TO authenticated
USING (
  public.is_admin()
  AND EXISTS (
    SELECT 1
    FROM public.classes c
    WHERE c.id = class_subjects."classId"
      AND public.can_access_institution(c."institutionId")
  )
)
WITH CHECK (
  public.is_admin()
  AND EXISTS (
    SELECT 1
    FROM public.classes c
    WHERE c.id = class_subjects."classId"
      AND public.can_access_institution(c."institutionId")
  )
);

DROP POLICY IF EXISTS class_schedules_select ON public.class_schedules;
DROP POLICY IF EXISTS class_schedules_write ON public.class_schedules;

CREATE POLICY class_schedules_select ON public.class_schedules
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.classes c
    WHERE c.id = class_schedules."classId"
      AND public.can_access_institution(c."institutionId")
  )
);

CREATE POLICY class_schedules_write ON public.class_schedules
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS class_subject_requests_select ON public.class_subject_requests;
DROP POLICY IF EXISTS class_subject_requests_write ON public.class_subject_requests;

CREATE POLICY class_subject_requests_select ON public.class_subject_requests
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.classes c
    WHERE c.id = class_subject_requests."classId"
      AND public.can_access_institution(c."institutionId")
  )
);

CREATE POLICY class_subject_requests_write ON public.class_subject_requests
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS announcements_select ON public.announcements;
DROP POLICY IF EXISTS announcements_write ON public.announcements;

CREATE POLICY announcements_select ON public.announcements
FOR SELECT TO authenticated
USING (
  "institutionId" IS NULL
  OR public.can_access_institution("institutionId")
);

CREATE POLICY announcements_write ON public.announcements
FOR ALL TO authenticated
USING (
  public.is_staff()
  AND ("institutionId" IS NULL OR public.can_access_institution("institutionId"))
)
WITH CHECK (
  public.is_staff()
  AND ("institutionId" IS NULL OR public.can_access_institution("institutionId"))
  AND "createdById" = public.current_app_user_id()
);

DROP POLICY IF EXISTS notifications_select ON public.notifications;
DROP POLICY IF EXISTS notifications_insert_staff ON public.notifications;
DROP POLICY IF EXISTS notifications_update_self ON public.notifications;

CREATE POLICY notifications_select ON public.notifications
FOR SELECT TO authenticated
USING (
  "userId" = public.current_app_user_id()
  OR (
    public.is_admin()
    AND EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = notifications."userId"
        AND public.can_access_institution(u."institutionId")
    )
  )
);

CREATE POLICY notifications_insert_staff ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (
  public.is_staff()
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = notifications."userId"
      AND public.can_access_institution(u."institutionId")
  )
);

CREATE POLICY notifications_update_self ON public.notifications
FOR UPDATE TO authenticated
USING ("userId" = public.current_app_user_id())
WITH CHECK ("userId" = public.current_app_user_id());

DROP POLICY IF EXISTS events_select ON public.events;
DROP POLICY IF EXISTS events_write ON public.events;

CREATE POLICY events_select ON public.events
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.academic_years y
    WHERE y.id = events."academicYearId"
      AND public.can_access_institution(y."institutionId")
  )
);

CREATE POLICY events_write ON public.events
FOR ALL TO authenticated
USING (
  public.is_admin()
  AND EXISTS (
    SELECT 1
    FROM public.academic_years y
    WHERE y.id = events."academicYearId"
      AND public.can_access_institution(y."institutionId")
  )
)
WITH CHECK (
  public.is_admin()
  AND EXISTS (
    SELECT 1
    FROM public.academic_years y
    WHERE y.id = events."academicYearId"
      AND public.can_access_institution(y."institutionId")
  )
);
