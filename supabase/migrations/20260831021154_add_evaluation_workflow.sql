BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EvaluationStatus') THEN
    CREATE TYPE public."EvaluationStatus" AS ENUM (
      'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ARCHIVED'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AssessmentSlot') THEN
    CREATE TYPE public."AssessmentSlot" AS ENUM ('VA1', 'VA2', 'VA3', 'VA4');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.evaluations (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title text NOT NULL,
  type text NOT NULL,
  slot public."AssessmentSlot" NOT NULL,
  description text,
  "examDate" timestamptz,
  "maxValue" double precision NOT NULL DEFAULT 10,
  "countsTowardsAverage" boolean NOT NULL DEFAULT true,
  status public."EvaluationStatus" NOT NULL DEFAULT 'DRAFT',
  "rejectionReason" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "approvedAt" timestamptz,
  "institutionId" text NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE ON UPDATE CASCADE,
  "classSubjectId" text NOT NULL REFERENCES public.class_subjects(id) ON DELETE CASCADE ON UPDATE CASCADE,
  "academicPeriodId" text NOT NULL REFERENCES public.academic_periods(id) ON DELETE CASCADE ON UPDATE CASCADE,
  "createdById" text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  "approvedById" text REFERENCES public.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT evaluations_max_value_check CHECK ("maxValue" > 0 AND "maxValue" <= 10),
  CONSTRAINT evaluations_unique_slot UNIQUE ("classSubjectId", "academicPeriodId", slot)
);

ALTER TABLE public.grades
  ADD COLUMN IF NOT EXISTS "evaluationId" text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'grades_evaluationId_fkey'
  ) THEN
    ALTER TABLE public.grades
      ADD CONSTRAINT "grades_evaluationId_fkey"
      FOREIGN KEY ("evaluationId") REFERENCES public.evaluations(id)
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS evaluations_institution_id_idx
  ON public.evaluations ("institutionId");
CREATE INDEX IF NOT EXISTS evaluations_class_period_idx
  ON public.evaluations ("classSubjectId", "academicPeriodId");
CREATE INDEX IF NOT EXISTS evaluations_status_idx
  ON public.evaluations (status);
CREATE INDEX IF NOT EXISTS evaluations_created_by_idx
  ON public.evaluations ("createdById");
CREATE INDEX IF NOT EXISTS grades_evaluation_id_idx
  ON public.grades ("evaluationId");

ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.evaluations FROM anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.evaluations TO authenticated;

DROP POLICY IF EXISTS evaluations_select ON public.evaluations;
CREATE POLICY evaluations_select
ON public.evaluations
FOR SELECT TO authenticated
USING (public.current_user_is_staff());

DROP POLICY IF EXISTS evaluations_insert ON public.evaluations;
CREATE POLICY evaluations_insert
ON public.evaluations
FOR INSERT TO authenticated
WITH CHECK (
  public.current_user_is_staff()
  AND EXISTS (
    SELECT 1
    FROM public.users caller
    WHERE (caller.auth_user_id = auth.uid() OR caller.id = auth.uid()::text)
      AND caller.id = "createdById"
      AND (
        caller.role::text = 'SUPER_ADMIN_GLOBAL'
        OR caller."institutionId" = "institutionId"
        OR EXISTS (
          SELECT 1 FROM public.user_institutions link
          WHERE link."userId" = caller.id
            AND link."institutionId" = "institutionId"
            AND link."isActive" = true
        )
      )
  )
);

DROP POLICY IF EXISTS evaluations_update ON public.evaluations;
CREATE POLICY evaluations_update
ON public.evaluations
FOR UPDATE TO authenticated
USING (public.current_user_is_staff())
WITH CHECK (public.current_user_is_staff());

CREATE OR REPLACE FUNCTION public.evaluations_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS evaluations_set_updated_at ON public.evaluations;
CREATE TRIGGER evaluations_set_updated_at
BEFORE UPDATE ON public.evaluations
FOR EACH ROW EXECUTE FUNCTION public.evaluations_set_updated_at();

COMMIT;
