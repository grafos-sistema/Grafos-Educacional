BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'GradeCompositionStatus'
  ) THEN
    CREATE TYPE public."GradeCompositionStatus" AS ENUM (
      'PENDING_APPROVAL', 'APPROVED', 'CHANGES_REQUESTED'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.grade_compositions (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "assessmentCount" integer NOT NULL,
  "va1Weight" integer NOT NULL,
  "va2Weight" integer,
  "va3Weight" integer,
  "va4Weight" integer,
  status public."GradeCompositionStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
  "reviewNote" text,
  "submittedAt" timestamptz NOT NULL DEFAULT now(),
  "reviewedAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "classSubjectId" text NOT NULL REFERENCES public.class_subjects(id) ON DELETE CASCADE ON UPDATE CASCADE,
  "academicPeriodId" text NOT NULL REFERENCES public.academic_periods(id) ON DELETE CASCADE ON UPDATE CASCADE,
  "submittedById" text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  "reviewedById" text REFERENCES public.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT grade_compositions_assessment_count_check
    CHECK ("assessmentCount" BETWEEN 1 AND 4),
  CONSTRAINT grade_compositions_weights_range_check
    CHECK (
      "va1Weight" BETWEEN 1 AND 100
      AND ("va2Weight" IS NULL OR "va2Weight" BETWEEN 1 AND 100)
      AND ("va3Weight" IS NULL OR "va3Weight" BETWEEN 1 AND 100)
      AND ("va4Weight" IS NULL OR "va4Weight" BETWEEN 1 AND 100)
    ),
  CONSTRAINT grade_compositions_weights_sum_check
    CHECK (
      "va1Weight"
      + COALESCE("va2Weight", 0)
      + COALESCE("va3Weight", 0)
      + COALESCE("va4Weight", 0) = 100
    ),
  CONSTRAINT grade_compositions_unique_class_period
    UNIQUE ("classSubjectId", "academicPeriodId")
);

CREATE INDEX IF NOT EXISTS grade_compositions_status_idx
  ON public.grade_compositions (status);
CREATE INDEX IF NOT EXISTS grade_compositions_submitted_by_idx
  ON public.grade_compositions ("submittedById");
CREATE INDEX IF NOT EXISTS grade_compositions_reviewed_by_idx
  ON public.grade_compositions ("reviewedById");

ALTER TABLE public.grade_compositions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.grade_compositions FROM anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.grade_compositions TO authenticated;

DROP POLICY IF EXISTS grade_compositions_select ON public.grade_compositions;
CREATE POLICY grade_compositions_select
ON public.grade_compositions
FOR SELECT TO authenticated
USING (public.current_user_is_staff());

DROP POLICY IF EXISTS grade_compositions_insert ON public.grade_compositions;
CREATE POLICY grade_compositions_insert
ON public.grade_compositions
FOR INSERT TO authenticated
WITH CHECK (public.current_user_is_staff());

DROP POLICY IF EXISTS grade_compositions_update ON public.grade_compositions;
CREATE POLICY grade_compositions_update
ON public.grade_compositions
FOR UPDATE TO authenticated
USING (public.current_user_is_staff())
WITH CHECK (public.current_user_is_staff());

CREATE OR REPLACE FUNCTION public.grade_compositions_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS grade_compositions_set_updated_at ON public.grade_compositions;
CREATE TRIGGER grade_compositions_set_updated_at
BEFORE UPDATE ON public.grade_compositions
FOR EACH ROW EXECUTE FUNCTION public.grade_compositions_set_updated_at();

COMMIT;
