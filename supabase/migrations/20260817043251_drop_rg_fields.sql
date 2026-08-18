-- Remove campos de RG, Órgão Emissor, UF, Data de Emissão, Nacionalidade e Naturalidade
-- Esses campos foram removidos do sistema pois o CPF é o único documento necessário

ALTER TABLE "users"
  DROP COLUMN IF EXISTS "rg",
  DROP COLUMN IF EXISTS "rgEmissor",
  DROP COLUMN IF EXISTS "rgEmissao",
  DROP COLUMN IF EXISTS "nacionalidade",
  DROP COLUMN IF EXISTS "naturalidade";
