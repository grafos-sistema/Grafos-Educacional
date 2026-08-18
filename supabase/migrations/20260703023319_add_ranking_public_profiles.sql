CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS public.ranking_public_profiles (
  "userId" text PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  "institutionId" text NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  "firstName" text NOT NULL,
  "lastName" text NOT NULL DEFAULT '',
  avatar text,
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ranking_public_profiles_institution_idx
  ON public.ranking_public_profiles ("institutionId");

ALTER TABLE public.ranking_public_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ranking_public_profiles_select ON public.ranking_public_profiles;

CREATE POLICY ranking_public_profiles_select ON public.ranking_public_profiles
FOR SELECT TO authenticated
USING (public.can_access_institution("institutionId"));

GRANT SELECT ON public.ranking_public_profiles TO authenticated;

CREATE OR REPLACE FUNCTION private.sync_ranking_public_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.ranking_public_profiles
    WHERE "userId" = OLD.id;

    RETURN OLD;
  END IF;

  INSERT INTO public.ranking_public_profiles (
    "userId",
    "institutionId",
    "firstName",
    "lastName",
    avatar,
    "updatedAt"
  ) VALUES (
    NEW.id,
    NEW."institutionId",
    NEW."firstName",
    COALESCE(NEW."lastName", ''),
    NEW.avatar,
    now()
  )
  ON CONFLICT ("userId") DO UPDATE
  SET
    "institutionId" = EXCLUDED."institutionId",
    "firstName" = EXCLUDED."firstName",
    "lastName" = EXCLUDED."lastName",
    avatar = EXCLUDED.avatar,
    "updatedAt" = now();

  RETURN NEW;
END
$$;

REVOKE ALL ON FUNCTION private.sync_ranking_public_profile() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.sync_ranking_public_profile() FROM anon;
REVOKE ALL ON FUNCTION private.sync_ranking_public_profile() FROM authenticated;

DROP TRIGGER IF EXISTS sync_ranking_public_profile_on_users ON public.users;

CREATE TRIGGER sync_ranking_public_profile_on_users
AFTER INSERT OR UPDATE OF "institutionId", "firstName", "lastName", avatar
OR DELETE ON public.users
FOR EACH ROW
EXECUTE FUNCTION private.sync_ranking_public_profile();

INSERT INTO public.ranking_public_profiles (
  "userId",
  "institutionId",
  "firstName",
  "lastName",
  avatar,
  "updatedAt"
)
SELECT
  u.id,
  u."institutionId",
  u."firstName",
  COALESCE(u."lastName", ''),
  u.avatar,
  now()
FROM public.users u
ON CONFLICT ("userId") DO UPDATE
SET
  "institutionId" = EXCLUDED."institutionId",
  "firstName" = EXCLUDED."firstName",
  "lastName" = EXCLUDED."lastName",
  avatar = EXCLUDED.avatar,
  "updatedAt" = now();
