ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_user_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND indexname = 'users_auth_user_id_key'
  ) THEN
    CREATE UNIQUE INDEX users_auth_user_id_key ON public.users(auth_user_id);
  END IF;
END
$$;

ALTER TABLE public.users ALTER COLUMN "password" DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT u.id
  FROM public.users u
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_institution_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT u."institutionId"
  FROM public.users u
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_role()
RETURNS "UserRole"
LANGUAGE sql
STABLE
AS $$
  SELECT u.role
  FROM public.users u
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.current_role() = 'SUPER_ADMIN'::"UserRole"
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.current_role() IN ('SUPER_ADMIN'::"UserRole", 'INSTITUTION_ADMIN'::"UserRole", 'COORDINATOR'::"UserRole")
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.current_role() IN ('SUPER_ADMIN'::"UserRole", 'INSTITUTION_ADMIN'::"UserRole", 'COORDINATOR'::"UserRole", 'TEACHER'::"UserRole")
$$;

CREATE OR REPLACE FUNCTION public.current_teacher_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT t.id
  FROM public.users u
  JOIN public.teachers t ON t."userId" = u.id
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_student_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT s.id
  FROM public.users u
  JOIN public.students s ON s."userId" = u.id
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_parent_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT p.id
  FROM public.users u
  JOIN public.parents p ON p."userId" = u.id
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1
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

CREATE OR REPLACE FUNCTION public.users_protect_system_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT public.is_admin() INTO v_is_admin;

  IF v_is_admin THEN
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
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'users_protect_system_fields'
  ) THEN
    CREATE TRIGGER users_protect_system_fields
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.users_protect_system_fields();
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.create_profile(
  institution_id text,
  role "UserRole",
  first_name text,
  last_name text,
  requested_profile_type text DEFAULT NULL,
  cpf text DEFAULT NULL,
  phone text DEFAULT NULL
)
RETURNS public.users
LANGUAGE plpgsql
AS $$
DECLARE
  v_email text;
  v_row public.users;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  v_email := auth.jwt() ->> 'email';

  IF v_email IS NULL THEN
    RAISE EXCEPTION 'missing_email';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.institutions i WHERE i.id = institution_id) THEN
    RAISE EXCEPTION 'invalid_institution';
  END IF;

  INSERT INTO public.users (
    id,
    auth_user_id,
    email,
    password,
    role,
    "firstName",
    "lastName",
    name,
    "institutionId",
    "requestedProfileType",
    "createdAt",
    "updatedAt",
    cpf,
    phone
  ) VALUES (
    auth.uid()::text,
    auth.uid(),
    v_email,
    NULL,
    role,
    first_name,
    last_name,
    first_name || ' ' || last_name,
    institution_id,
    requested_profile_type,
    NOW(),
    NOW(),
    cpf,
    phone
  )
  ON CONFLICT (auth_user_id) DO UPDATE
  SET
    "firstName" = EXCLUDED."firstName",
    "lastName" = EXCLUDED."lastName",
    name = EXCLUDED.name,
    "requestedProfileType" = EXCLUDED."requestedProfileType",
    cpf = COALESCE(public.users.cpf, EXCLUDED.cpf),
    phone = COALESCE(public.users.phone, EXCLUDED.phone),
    "updatedAt" = NOW()
  RETURNING * INTO v_row;

  RETURN v_row;
END
$$;
