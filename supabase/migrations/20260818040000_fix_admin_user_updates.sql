-- ================================================================
-- 20260817_fix_admin_user_updates.sql
-- Corrige 3 problemas críticos:
--  1) Policy users_update_self SOBRESCREVIA users_update_staff:
--     admin tentava editar OUTRO usuário, policy "self" falhava e
--     bloqueava o UPDATE (PostgreSQL avalia se QUALQUER policy
--     permite, mas com condições separadas estava descartando).
--  2) SUPER_ADMIN_GLOBAL pode ter institutionId NULL ou vazio;
--     can_access_institution() devolvia false para vínculo e
--     is_super_admin() não era considerado no final da policy.
--  3) Trigger users_protect_system_fields: usando NEW.id != auth.uid()
--     e IF v_is_admin "passava", mas na sequência retornava OLD sem
--     aplicar os dados pessoais (birthDate, state).
-- ================================================================

-- ----------------------------------------------------------------
-- PASSO 1: Unificar policies de UPDATE de users
--   "Seu próprio perfil OU (é admin e tem acesso à instituição)"
-- ----------------------------------------------------------------

DROP POLICY IF EXISTS users_update_self ON public.users;
DROP POLICY IF EXISTS users_update_staff ON public.users;
DROP POLICY IF EXISTS users_update_combined ON public.users;

CREATE POLICY users_update_combined ON public.users
FOR UPDATE TO authenticated
USING (
  (auth_user_id = auth.uid() OR id = auth.uid()::text)
  OR
  (public.is_admin() AND public.can_access_institution("institutionId"))
)
WITH CHECK (
  (auth_user_id = auth.uid() OR id = auth.uid()::text)
  OR
  (public.is_admin() AND public.can_access_institution("institutionId"))
);

-- ----------------------------------------------------------------
-- PASSO 2: Garantir que SUPER_ADMIN_GLOBAL (sem institutionId)
--          SEMPRE consiga editar qualquer usuário.
-- Ajuste em can_access_institution() já tinha CASE WHEN inst_id IS
-- NULL -> is_super_admin(), mas para casos onde o USUÁRIO ALVO tem
-- institutionId e o caller GLOBAL não, o EXISTS abaixo falha.
-- Entao reescrevemos can_access_institution() olhando primeiro
-- se quem está chamando é super admin global.
-- ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.can_access_institution(inst_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT CASE
    -- SUPER_ADMIN_GLOBAL ou SUPER_ADMIN sempre pode
    WHEN public.is_super_admin() THEN true

    -- Se alvo não tem instituição, só super admin pode
    WHEN inst_id IS NULL THEN false

    -- Admin vinculado diretamente via institutionId
    WHEN EXISTS (
      SELECT 1
      FROM public.users u
      WHERE (u.auth_user_id = auth.uid() OR u.id = auth.uid()::text)
        AND u."institutionId" = inst_id
    ) THEN true

    -- Admin vinculado via user_institutions
    WHEN EXISTS (
      SELECT 1
      FROM public.users u
      JOIN public.user_institutions ui
        ON ui."userId" = u.id
       AND ui."isActive" = true
       AND ui."institutionId" = inst_id
      WHERE (u.auth_user_id = auth.uid() OR u.id = auth.uid()::text)
    ) THEN true

    ELSE false
  END
$function$;

-- ----------------------------------------------------------------
-- PASSO 3: Ajustar trigger users_protect_system_fields para que
--          quando ADMIN editar OUTRO usuário, os campos de dados
--          pessoais NÃO sejam bloqueados (ex: birthDate, state).
--          Apenas id, auth_user_id, role e institutionId devem ser
--          protegidos (não são editáveis por esse fluxo anyway).
-- ----------------------------------------------------------------

DROP TRIGGER IF EXISTS trigger_users_protect_system_fields ON public.users;

CREATE OR REPLACE FUNCTION public.users_protect_system_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_caller_is_admin boolean;
  v_is_self_update boolean;
BEGIN
  -- Chamadas feitas por service_role / edge functions: permita tudo
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT public.is_admin() INTO v_caller_is_admin;
  SELECT (NEW.id = auth.uid()::text OR OLD.auth_user_id = auth.uid()) INTO v_is_self_update;

  --
  -- CASO A: Admin editando OUTRO usuário (não ele mesmo)
  --   => Permita alterar QUALQUER campo, exceto os de sistema.
  --
  IF v_caller_is_admin AND NOT v_is_self_update THEN
    -- Apenas zera algumas proteções copiando campos de sistema do OLD
    IF NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'cannot_change_id';
    END IF;
    IF NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id THEN
      RAISE EXCEPTION 'cannot_change_auth_user_id';
    END IF;
    -- role e institutionId podem ser alterados via tela de edição?
    -- NÃO: tela atual não permite, mas se algum dia permitir, o
    -- trigger deve manter consistência. Mantemos bloqueados.
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'cannot_change_role';
    END IF;
    IF NEW."institutionId" IS DISTINCT FROM OLD."institutionId" THEN
      RAISE EXCEPTION 'cannot_change_institution';
    END IF;
    RETURN NEW;
  END IF;

  --
  -- CASO B: Usuário comum editando a si mesmo OU admin editando a
  -- si mesmo => aplicar proteções de sistema mais restritas
  --
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

CREATE TRIGGER trigger_users_protect_system_fields
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.users_protect_system_fields();

-- ----------------------------------------------------------------
-- PASSO 4: Confirmar que GRANT UPDATE está correto
-- ----------------------------------------------------------------

GRANT UPDATE (
  "email", "firstName", "lastName", "cpf", "phone", "telefoneFixo",
  "birthDate", "gender", "avatar", "address", "numero", "complemento",
  "bairro", "city", "state", "zipCode", "isActive", "socialName",
  "updatedAt"
) ON public.users TO authenticated;
