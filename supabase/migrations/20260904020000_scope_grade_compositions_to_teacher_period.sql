BEGIN;

-- A composição deixa de ser repetida para cada disciplina/turma e passa a
-- representar a regra escolhida pelo professor para todo o período acadêmico.
ALTER TABLE public.grade_compositions
  ADD COLUMN IF NOT EXISTS "teacherId" text
    REFERENCES public.teachers(id) ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE public.grade_compositions AS composition
SET "teacherId" = class_subject."teacherId"
FROM public.class_subjects AS class_subject
WHERE composition."classSubjectId" = class_subject.id
  AND composition."teacherId" IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.grade_compositions
    WHERE "teacherId" IS NULL
  ) THEN
    RAISE EXCEPTION
      'Não foi possível migrar as composições: existe registro sem professor responsável';
  END IF;

  IF EXISTS (
    SELECT "teacherId", "academicPeriodId"
    FROM public.grade_compositions
    GROUP BY "teacherId", "academicPeriodId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Não foi possível migrar as composições: existe mais de uma composição para o mesmo professor e período';
  END IF;
END $$;

ALTER TABLE public.grade_compositions
  ALTER COLUMN "teacherId" SET NOT NULL;

ALTER TABLE public.grade_compositions
  ALTER COLUMN "classSubjectId" DROP NOT NULL;

ALTER TABLE public.grade_compositions
  DROP CONSTRAINT IF EXISTS grade_compositions_unique_class_period;

ALTER TABLE public.grade_compositions
  ADD CONSTRAINT grade_compositions_unique_teacher_period
  UNIQUE ("teacherId", "academicPeriodId");

CREATE INDEX IF NOT EXISTS grade_compositions_teacher_idx
  ON public.grade_compositions ("teacherId");

COMMENT ON TABLE public.grade_compositions IS
  'Composição de avaliações definida por professor e período acadêmico';

COMMIT;
