-- Vincula alunos importados às turmas quando a planilha trouxe os dados
-- textuais da matrícula, mas não trouxe um ID interno de turma.
-- A operação é idempotente e não altera vínculos ativos já existentes.
WITH candidates AS (
  SELECT
    s."id" AS "studentId",
    c."id" AS "classId",
    ROW_NUMBER() OVER (
      PARTITION BY s."id"
      ORDER BY c."id"
    ) AS "matchNumber"
  FROM public."students" s
  JOIN public."users" u ON u."id" = s."userId"
  JOIN public."classes" c
    ON c."institutionId" = u."institutionId"
   AND c."isActive" = true
  JOIN public."courses" co
    ON co."id" = c."courseId"
   AND lower(trim(co."name")) = lower(trim(s."curso"))
  JOIN public."academic_years" ay
    ON ay."id" = c."academicYearId"
   AND ay."year"::text = trim(s."anoLetivo")
  WHERE s."turma" IS NOT NULL
    AND s."curso" IS NOT NULL
    AND s."serie" IS NOT NULL
    AND (
      lower(trim(c."name")) = lower(trim(s."turma"))
      OR lower(trim(c."name")) LIKE '% ' || lower(trim(s."turma"))
    )
    AND lower(trim(c."grade")) = lower(trim(s."serie"))
    AND (
      s."turno" IS NULL
      OR lower(trim(c."shift")) = lower(trim(s."turno"))
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public."class_enrollments" current_enrollment
      WHERE current_enrollment."studentId" = s."id"
        AND current_enrollment."isActive" = true
    )
)
INSERT INTO public."class_enrollments" (
  "id",
  "enrollmentDate",
  "isActive",
  "createdAt",
  "updatedAt",
  "classId",
  "studentId"
)
SELECT
  gen_random_uuid()::text,
  now(),
  true,
  now(),
  now(),
  "classId",
  "studentId"
FROM candidates
WHERE "matchNumber" = 1
ON CONFLICT ("classId", "studentId") DO NOTHING;
