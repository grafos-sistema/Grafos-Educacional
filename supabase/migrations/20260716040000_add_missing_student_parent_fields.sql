-- Adiciona colunas faltantes na tabela de Estudantes
ALTER TABLE "public"."students" 
  ADD COLUMN IF NOT EXISTS "modalidade" TEXT,
  ADD COLUMN IF NOT EXISTS "turno" TEXT,
  ADD COLUMN IF NOT EXISTS "observacoes" TEXT;

-- Adiciona colunas faltantes no Vínculo de Responsáveis
ALTER TABLE "public"."student_parents"
  ADD COLUMN IF NOT EXISTS "notificacoes" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "podeRetirar" BOOLEAN NOT NULL DEFAULT false;

-- Adiciona coluna de whatsapp na tabela de Usuários (usada para responsáveis e outros)
ALTER TABLE "public"."users"
  ADD COLUMN IF NOT EXISTS "whatsapp" TEXT;
