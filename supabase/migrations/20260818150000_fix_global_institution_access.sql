BEGIN;

-- The recursive RLS repair migration accidentally removed the global role from
-- can_access_institution. Restore the global access rule and keep institution
-- unit policies explicit so annex locations can be read and edited reliably.
CREATE OR REPLACE FUNCTION public.can_access_institution(inst_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT public.is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.auth_user_id = auth.uid()
        AND (
          u."institutionId" = inst_id
          OR EXISTS (
            SELECT 1
            FROM public.user_institutions ui
            WHERE ui."userId" = u.id
              AND ui."institutionId" = inst_id
              AND ui."isActive" = true
          )
        )
    )
$$;

ALTER TABLE public.institution_units ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS institution_units_select ON public.institution_units;
CREATE POLICY institution_units_select
ON public.institution_units
FOR SELECT TO authenticated
USING (public.can_access_institution("institutionId"));

DROP POLICY IF EXISTS institution_units_insert ON public.institution_units;
CREATE POLICY institution_units_insert
ON public.institution_units
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin()
  AND public.can_access_institution("institutionId")
);

DROP POLICY IF EXISTS institution_units_update ON public.institution_units;
CREATE POLICY institution_units_update
ON public.institution_units
FOR UPDATE TO authenticated
USING (
  public.is_admin()
  AND public.can_access_institution("institutionId")
)
WITH CHECK (
  public.is_admin()
  AND public.can_access_institution("institutionId")
);

DROP POLICY IF EXISTS institution_units_delete ON public.institution_units;
CREATE POLICY institution_units_delete
ON public.institution_units
FOR DELETE TO authenticated
USING (
  public.is_admin()
  AND public.can_access_institution("institutionId")
);

COMMIT;
