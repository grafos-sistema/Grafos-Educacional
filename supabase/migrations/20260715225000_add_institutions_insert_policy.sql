DROP POLICY IF EXISTS institutions_insert ON public.institutions;

CREATE POLICY institutions_insert ON public.institutions
FOR INSERT TO authenticated
WITH CHECK (public.is_super_admin());
