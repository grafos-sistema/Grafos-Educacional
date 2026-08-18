-- Permite que cada Anexo tenha seus próprios Anos Letivos.
-- Anos antigos permanecem com unitId nulo e continuam disponíveis
-- para os administradores institucionais.

ALTER TABLE public.academic_years
ADD COLUMN IF NOT EXISTS "unitId" text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'academic_years_unitId_fkey'
      AND conrelid = 'public.academic_years'::regclass
  ) THEN
    ALTER TABLE public.academic_years
      ADD CONSTRAINT "academic_years_unitId_fkey"
      FOREIGN KEY ("unitId")
      REFERENCES public.institution_units(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS academic_years_unit_id_idx
  ON public.academic_years ("unitId");

-- A instituição pode ter um ano legado sem Anexo ou um ano do mesmo
-- calendário em cada Anexo. Os dois cenários não devem colidir.
DROP INDEX IF EXISTS public."academic_years_institutionId_year_key";

CREATE UNIQUE INDEX IF NOT EXISTS academic_years_institution_year_global_key
  ON public.academic_years ("institutionId", "year")
  WHERE "unitId" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS academic_years_institution_year_unit_key
  ON public.academic_years ("institutionId", "year", "unitId")
  WHERE "unitId" IS NOT NULL;

CREATE OR REPLACE FUNCTION public.can_manage_academic_year(
  p_institution_id text,
  p_unit_id text
)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT CASE
    -- O Super Admin Global não administra Anos Letivos.
    WHEN public.current_role() = 'SUPER_ADMIN'::"UserRole" THEN true

    -- Administradores locais e coordenadores mantêm o acesso institucional.
    WHEN public.current_role() IN (
      'INSTITUTION_ADMIN'::"UserRole",
      'COORDINATOR'::"UserRole"
    ) THEN public.can_access_institution(p_institution_id)

    -- Diretor só pode atuar no Anexo que aponta para seu próprio usuário.
    WHEN public.current_role() = 'DIRECTOR'::"UserRole" THEN EXISTS (
      SELECT 1
      FROM public.institution_units iu
      WHERE iu.id = p_unit_id
        AND iu."institutionId" = p_institution_id
        AND iu."directorUserId" = public.current_app_user_id()
        AND iu."isActive" = true
    )

    ELSE false
  END
$function$;

ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS academic_years_select ON public.academic_years;
DROP POLICY IF EXISTS academic_years_write ON public.academic_years;

CREATE POLICY academic_years_select ON public.academic_years
FOR SELECT TO authenticated
USING (
  public.can_manage_academic_year("institutionId", "unitId")
);

CREATE POLICY academic_years_write ON public.academic_years
FOR ALL TO authenticated
USING (
  public.can_manage_academic_year("institutionId", "unitId")
)
WITH CHECK (
  public.can_manage_academic_year("institutionId", "unitId")
);
