CREATE OR REPLACE FUNCTION public.can_access_institution(inst_id text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.auth_user_id = auth.uid()
      AND (
        u.role = 'SUPER_ADMIN'::"UserRole"
        OR u."institutionId" = inst_id
      )
  )
$$;

DROP POLICY IF EXISTS teachers_select ON public.teachers;
DROP POLICY IF EXISTS teachers_write ON public.teachers;

CREATE POLICY teachers_select ON public.teachers
FOR SELECT TO authenticated
USING (
  "userId" = auth.uid()::text
  OR (
    public.is_admin()
    AND EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = teachers."userId"
        AND u."institutionId" = public.current_institution_id()
    )
  )
);

CREATE POLICY teachers_write ON public.teachers
FOR ALL TO authenticated
USING (
  public.is_admin()
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = teachers."userId"
      AND u."institutionId" = public.current_institution_id()
  )
)
WITH CHECK (
  public.is_admin()
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = teachers."userId"
      AND u."institutionId" = public.current_institution_id()
  )
);
