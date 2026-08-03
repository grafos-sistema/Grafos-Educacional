CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.current_role() IN ('SUPER_ADMIN_GLOBAL'::"UserRole", 'SUPER_ADMIN'::"UserRole")
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.current_role() IN (
    'SUPER_ADMIN_GLOBAL'::"UserRole",
    'SUPER_ADMIN'::"UserRole",
    'DIRECTOR'::"UserRole",
    'INSTITUTION_ADMIN'::"UserRole",
    'COORDINATOR'::"UserRole"
  )
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.current_role() IN (
    'SUPER_ADMIN_GLOBAL'::"UserRole",
    'SUPER_ADMIN'::"UserRole",
    'DIRECTOR'::"UserRole",
    'INSTITUTION_ADMIN'::"UserRole",
    'COORDINATOR'::"UserRole",
    'TEACHER'::"UserRole"
  )
$$;

CREATE OR REPLACE FUNCTION public.can_access_institution(inst_id text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN public.is_super_admin() THEN true
    ELSE EXISTS (
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
  END
$$;

DROP POLICY IF EXISTS support_tickets_super_admin_select ON public.support_tickets;
CREATE POLICY support_tickets_super_admin_select
ON public.support_tickets
FOR SELECT
TO authenticated
USING (public.is_super_admin());

DROP POLICY IF EXISTS support_tickets_super_admin_update ON public.support_tickets;
CREATE POLICY support_tickets_super_admin_update
ON public.support_tickets
FOR UPDATE
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS support_tickets_bucket_super_admin_select ON storage.objects;
CREATE POLICY support_tickets_bucket_super_admin_select
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'support-tickets'
  AND public.is_super_admin()
);

ALTER TABLE public.institution_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_units ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS institution_units_select ON public.institution_units;
CREATE POLICY institution_units_select ON public.institution_units
FOR SELECT TO authenticated
USING (public.can_access_institution("institutionId"));

DROP POLICY IF EXISTS institution_units_write ON public.institution_units;
CREATE POLICY institution_units_write ON public.institution_units
FOR ALL TO authenticated
USING (public.is_admin() AND public.can_access_institution("institutionId"))
WITH CHECK (public.is_admin() AND public.can_access_institution("institutionId"));

DROP POLICY IF EXISTS institution_documents_select ON public.institution_documents;
CREATE POLICY institution_documents_select ON public.institution_documents
FOR SELECT TO authenticated
USING (public.can_access_institution("institutionId"));

DROP POLICY IF EXISTS institution_documents_write ON public.institution_documents;
CREATE POLICY institution_documents_write ON public.institution_documents
FOR ALL TO authenticated
USING (public.is_admin() AND public.can_access_institution("institutionId"))
WITH CHECK (public.is_admin() AND public.can_access_institution("institutionId"));

DROP POLICY IF EXISTS user_units_select ON public.user_units;
CREATE POLICY user_units_select ON public.user_units
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.institution_units iu
    WHERE iu.id = user_units."unitId"
      AND public.can_access_institution(iu."institutionId")
  )
);

DROP POLICY IF EXISTS user_units_write ON public.user_units;
CREATE POLICY user_units_write ON public.user_units
FOR ALL TO authenticated
USING (
  public.is_admin()
  AND EXISTS (
    SELECT 1
    FROM public.institution_units iu
    WHERE iu.id = user_units."unitId"
      AND public.can_access_institution(iu."institutionId")
  )
)
WITH CHECK (
  public.is_admin()
  AND EXISTS (
    SELECT 1
    FROM public.institution_units iu
    WHERE iu.id = user_units."unitId"
      AND public.can_access_institution(iu."institutionId")
  )
);
