BEGIN;

-- A consulta de diretores para promoção de secretário acontece no cliente,
-- mas a política anterior permitia somente a leitura do próprio usuário.
-- Mantemos o escopo por instituição para administradores locais e o acesso
-- amplo somente para o administrador global.
CREATE OR REPLACE FUNCTION public.can_read_user_directory(
  target_user_id text,
  target_institution_id text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH caller AS (
    SELECT app_user.id, app_user.role, app_user."institutionId"
    FROM public.users app_user
    WHERE app_user.auth_user_id = auth.uid()
       OR app_user.id = auth.uid()::text
    ORDER BY CASE WHEN app_user.auth_user_id = auth.uid() THEN 0 ELSE 1 END
    LIMIT 1
  )
  SELECT EXISTS (
    SELECT 1
    FROM caller
    WHERE caller.id = target_user_id
       OR caller.role::text = 'SUPER_ADMIN_GLOBAL'
       OR (
         caller.role::text = ANY (
           ARRAY['SUPER_ADMIN', 'DIRECTOR', 'INSTITUTION_ADMIN', 'COORDINATOR']
         )
         AND target_institution_id IS NOT NULL
         AND (
           caller."institutionId" = target_institution_id
           OR EXISTS (
             SELECT 1
             FROM public.user_institutions link
             WHERE link."userId" = caller.id
               AND link."institutionId" = target_institution_id
               AND link."isActive" = true
           )
         )
       )
  )
$$;

REVOKE ALL ON FUNCTION public.can_read_user_directory(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_read_user_directory(text, text) TO authenticated;

DROP POLICY IF EXISTS users_select ON public.users;
CREATE POLICY users_select ON public.users
FOR SELECT TO authenticated
USING (public.can_read_user_directory(id, "institutionId"));

COMMIT;
