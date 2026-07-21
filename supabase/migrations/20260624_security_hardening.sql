ALTER FUNCTION public.current_app_user_id() SET search_path = public, pg_temp;
ALTER FUNCTION public.current_institution_id() SET search_path = public, pg_temp;
ALTER FUNCTION public.current_role() SET search_path = public, pg_temp;
ALTER FUNCTION public.is_super_admin() SET search_path = public, pg_temp;
ALTER FUNCTION public.is_admin() SET search_path = public, pg_temp;
ALTER FUNCTION public.is_staff() SET search_path = public, pg_temp;
ALTER FUNCTION public.current_teacher_id() SET search_path = public, pg_temp;
ALTER FUNCTION public.current_student_id() SET search_path = public, pg_temp;
ALTER FUNCTION public.current_parent_id() SET search_path = public, pg_temp;
ALTER FUNCTION public.can_access_institution(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.users_protect_system_fields() SET search_path = public, pg_temp;
ALTER FUNCTION public.create_profile(text, "UserRole", text, text, text, text, text) SET search_path = public, pg_temp;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'rls_auto_enable'
  ) THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated';
  END IF;
END
$$;
