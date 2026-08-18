-- SUPER_ADMIN_GLOBAL pode ser um usuário global, sem instituição vinculada.
-- A operação é idempotente para permitir execução segura pelo CI.
ALTER TABLE public.users
  ALTER COLUMN "institutionId" DROP NOT NULL;
