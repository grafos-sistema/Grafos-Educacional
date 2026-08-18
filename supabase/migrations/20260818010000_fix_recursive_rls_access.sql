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

DROP POLICY IF EXISTS user_institutions_select ON public.user_institutions;
DROP POLICY IF EXISTS user_institutions_write ON public.user_institutions;

CREATE POLICY user_institutions_select ON public.user_institutions
FOR SELECT TO authenticated
USING (
  "userId" = public.current_app_user_id()
  OR (
    public.is_admin()
    AND "institutionId" = public.current_institution_id()
  )
);

CREATE POLICY user_institutions_write ON public.user_institutions
FOR ALL TO authenticated
USING (
  public.is_admin()
  AND "institutionId" = public.current_institution_id()
)
WITH CHECK (
  public.is_admin()
  AND "institutionId" = public.current_institution_id()
);

DROP POLICY IF EXISTS teachers_select ON public.teachers;
DROP POLICY IF EXISTS teachers_write ON public.teachers;

CREATE POLICY teachers_select ON public.teachers
FOR SELECT TO authenticated
USING (
  "userId" = public.current_app_user_id()
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

DROP POLICY IF EXISTS classes_select ON public.classes;
DROP POLICY IF EXISTS classes_write ON public.classes;

CREATE POLICY classes_select ON public.classes
FOR SELECT TO authenticated
USING (
  "institutionId" = public.current_institution_id()
);

CREATE POLICY classes_write ON public.classes
FOR ALL TO authenticated
USING (
  public.is_admin()
  AND "institutionId" = public.current_institution_id()
)
WITH CHECK (
  public.is_admin()
  AND "institutionId" = public.current_institution_id()
);

DROP POLICY IF EXISTS notifications_select ON public.notifications;
DROP POLICY IF EXISTS notifications_insert_staff ON public.notifications;

CREATE POLICY notifications_select ON public.notifications
FOR SELECT TO authenticated
USING (
  "userId" = public.current_app_user_id()
  OR (
    public.is_admin()
    AND EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = notifications."userId"
        AND u."institutionId" = public.current_institution_id()
    )
  )
);

CREATE POLICY notifications_insert_staff ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (
  public.is_staff()
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = notifications."userId"
      AND u."institutionId" = public.current_institution_id()
  )
);
