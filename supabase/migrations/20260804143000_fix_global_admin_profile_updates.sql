CREATE OR REPLACE FUNCTION public.current_role()
RETURNS "UserRole"
LANGUAGE sql
STABLE
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT u.role
  FROM public.users u
  WHERE u.auth_user_id = auth.uid()
     OR u.id = auth.uid()::text
  ORDER BY CASE WHEN u.auth_user_id = auth.uid() THEN 0 ELSE 1 END
  LIMIT 1
$function$;

CREATE OR REPLACE FUNCTION public.current_institution_id()
RETURNS text
LANGUAGE sql
STABLE
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT u."institutionId"
  FROM public.users u
  WHERE u.auth_user_id = auth.uid()
     OR u.id = auth.uid()::text
  ORDER BY CASE WHEN u.auth_user_id = auth.uid() THEN 0 ELSE 1 END
  LIMIT 1
$function$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT public.current_role()::text = ANY (ARRAY['SUPER_ADMIN_GLOBAL', 'SUPER_ADMIN'])
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT public.current_role()::text = ANY (
    ARRAY[
      'SUPER_ADMIN_GLOBAL',
      'SUPER_ADMIN',
      'DIRECTOR',
      'INSTITUTION_ADMIN',
      'COORDINATOR'
    ]
  )
$function$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT public.current_role()::text = ANY (
    ARRAY[
      'SUPER_ADMIN_GLOBAL',
      'SUPER_ADMIN',
      'DIRECTOR',
      'INSTITUTION_ADMIN',
      'COORDINATOR',
      'TEACHER'
    ]
  )
$function$;

CREATE OR REPLACE FUNCTION public.can_access_institution(inst_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT CASE
    WHEN inst_id IS NULL THEN public.is_super_admin()
    WHEN public.is_super_admin() THEN true
    ELSE EXISTS (
      SELECT 1
      FROM public.users u
      WHERE (u.auth_user_id = auth.uid() OR u.id = auth.uid()::text)
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
$function$;

CREATE OR REPLACE FUNCTION public.users_protect_system_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_is_admin boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT public.is_admin() INTO v_is_admin;

  IF v_is_admin AND NEW.id IS DISTINCT FROM auth.uid()::text THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'cannot_change_id';
  END IF;

  IF NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id THEN
    RAISE EXCEPTION 'cannot_change_auth_user_id';
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'cannot_change_role';
  END IF;

  IF NEW."institutionId" IS DISTINCT FROM OLD."institutionId" THEN
    RAISE EXCEPTION 'cannot_change_institution';
  END IF;

  RETURN NEW;
END
$function$;

UPDATE public.users u
SET auth_user_id = u.id::uuid
WHERE u.auth_user_id IS NULL
  AND u.id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  AND EXISTS (
    SELECT 1
    FROM auth.users au
    WHERE au.id = u.id::uuid
  );

DROP POLICY IF EXISTS users_update_self ON public.users;

CREATE POLICY users_update_self ON public.users
FOR UPDATE TO authenticated
USING (
  auth_user_id = auth.uid()
  OR id = auth.uid()::text
)
WITH CHECK (
  auth_user_id = auth.uid()
  OR id = auth.uid()::text
);
