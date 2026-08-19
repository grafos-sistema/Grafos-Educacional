BEGIN;

CREATE OR REPLACE FUNCTION public.is_global_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT public.current_role()::text = 'SUPER_ADMIN_GLOBAL'
$$;

CREATE OR REPLACE FUNCTION public.can_access_institution(inst_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT public.is_global_admin()
    OR EXISTS (
      SELECT 1
      FROM public.users user_record
      WHERE (
          user_record.auth_user_id = auth.uid()
          OR user_record.id = auth.uid()::text
        )
        AND inst_id IS NOT NULL
        AND (
          user_record."institutionId" = inst_id
          OR EXISTS (
            SELECT 1
            FROM public.user_institutions user_institution
            WHERE user_institution."userId" = user_record.id
              AND user_institution."institutionId" = inst_id
              AND user_institution."isActive" = true
          )
        )
    )
$$;

DROP POLICY IF EXISTS institutions_insert ON public.institutions;
CREATE POLICY institutions_insert
ON public.institutions
FOR INSERT TO authenticated
WITH CHECK (public.is_global_admin());

DROP POLICY IF EXISTS support_tickets_super_admin_select ON public.support_tickets;
CREATE POLICY support_tickets_global_admin_select
ON public.support_tickets
FOR SELECT TO authenticated
USING (public.is_global_admin());

DROP POLICY IF EXISTS support_tickets_super_admin_update ON public.support_tickets;
CREATE POLICY support_tickets_global_admin_update
ON public.support_tickets
FOR UPDATE TO authenticated
USING (public.is_global_admin())
WITH CHECK (public.is_global_admin());

DROP POLICY IF EXISTS support_tickets_bucket_super_admin_select ON storage.objects;
CREATE POLICY support_tickets_bucket_global_admin_select
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'support-tickets'
  AND public.is_global_admin()
);

COMMIT;
