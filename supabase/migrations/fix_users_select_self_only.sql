DROP POLICY IF EXISTS users_select ON public.users;

CREATE POLICY users_select ON public.users
FOR SELECT TO authenticated
USING (
  auth_user_id = auth.uid()
);
