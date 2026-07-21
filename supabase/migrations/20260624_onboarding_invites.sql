CREATE TABLE IF NOT EXISTS public.institution_invites (
  id text PRIMARY KEY,
  code text NOT NULL,
  "institutionId" text NOT NULL REFERENCES public.institutions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  role "UserRole" NOT NULL,
  email text,
  "expiresAt" timestamp(3),
  "usedAt" timestamp(3),
  "createdById" text NOT NULL REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  "usedById" text REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'institution_invites'
      AND indexname = 'institution_invites_code_key'
  ) THEN
    CREATE UNIQUE INDEX institution_invites_code_key ON public.institution_invites(code);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS institution_invites_institutionId_idx ON public.institution_invites("institutionId");
CREATE INDEX IF NOT EXISTS institution_invites_createdById_idx ON public.institution_invites("createdById");
CREATE INDEX IF NOT EXISTS institution_invites_usedById_idx ON public.institution_invites("usedById");
CREATE INDEX IF NOT EXISTS institution_invites_email_idx ON public.institution_invites(email);

ALTER TABLE public.institution_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS institution_invites_select ON public.institution_invites;
DROP POLICY IF EXISTS institution_invites_write ON public.institution_invites;

CREATE POLICY institution_invites_select ON public.institution_invites
FOR SELECT TO authenticated
USING (
  public.is_admin()
  AND public.can_access_institution("institutionId")
);

CREATE POLICY institution_invites_write ON public.institution_invites
FOR ALL TO authenticated
USING (
  public.is_admin()
  AND public.can_access_institution("institutionId")
)
WITH CHECK (
  public.is_admin()
  AND public.can_access_institution("institutionId")
);

DROP POLICY IF EXISTS users_insert_self ON public.users;

REVOKE EXECUTE ON FUNCTION public.create_profile(text, "UserRole", text, text, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_profile(text, "UserRole", text, text, text, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_profile(text, "UserRole", text, text, text, text, text) TO service_role;
