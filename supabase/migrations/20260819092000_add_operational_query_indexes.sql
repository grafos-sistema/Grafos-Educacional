-- Índices compostos para os filtros mais frequentes da API.
-- Todos são aditivos e idempotentes para não alterar dados existentes.

CREATE INDEX IF NOT EXISTS class_schedules_subject_day_time_idx
  ON public.class_schedules ("classSubjectId", "dayOfWeek", "startTime", "endTime");

CREATE INDEX IF NOT EXISTS grades_subject_period_student_idx
  ON public.grades ("classSubjectId", "academicPeriodId", "studentId");

CREATE INDEX IF NOT EXISTS announcements_institution_published_date_idx
  ON public.announcements ("institutionId", "isPublished", "publishedAt" DESC);

CREATE INDEX IF NOT EXISTS announcements_created_by_idx
  ON public.announcements ("createdById");

CREATE INDEX IF NOT EXISTS notifications_user_status_sent_idx
  ON public.notifications ("userId", status, "sentAt" DESC);

CREATE INDEX IF NOT EXISTS notifications_sent_by_idx
  ON public.notifications ("sentById");

CREATE INDEX IF NOT EXISTS events_year_date_range_idx
  ON public.events ("academicYearId", "startDate", "endDate");

CREATE INDEX IF NOT EXISTS class_subject_requests_reviewed_by_idx
  ON public.class_subject_requests ("reviewedById");

CREATE INDEX IF NOT EXISTS lesson_plans_created_by_idx
  ON public.lesson_plans ("createdById");

CREATE INDEX IF NOT EXISTS lesson_plans_approved_by_idx
  ON public.lesson_plans ("approvedById");
