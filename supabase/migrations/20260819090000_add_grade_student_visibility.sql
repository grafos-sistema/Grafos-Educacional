ALTER TABLE public.grades
  ADD COLUMN IF NOT EXISTS "isVisibleToStudents" boolean NOT NULL DEFAULT true;
