# Supabase bootstrap

Estas migrations foram espelhadas a partir de `api/prisma/migrations` para permitir subir um projeto `Supabase` novo com o mesmo schema relacional atual do backend.

## O que esta pasta cobre

- Criação de tabelas, enums, indices e foreign keys.
- Evolução incremental do schema na mesma ordem usada pelo `Prisma`.
- Compatibilidade com um banco `Postgres` vazio.

## O que esta pasta ainda nao cobre

- `Supabase Auth`
- politicas de `RLS`
- buckets de `Storage`
- seeds iniciais
- troca de ids `TEXT` para `UUID`

## Observacoes importantes

- O schema atual usa ids como `TEXT`, espelhando o modelo existente do `Prisma`. Isso preserva compatibilidade com o backend atual, mas nao aproveita ids nativos `UUID` do banco.
- Se a proxima etapa for acessar o banco direto pelo frontend usando `supabase-js`, vale planejar uma segunda rodada de migrations para:
  - conectar `users` ao `auth.users`
  - habilitar `RLS`
  - revisar geracao de ids no banco
  - criar policies por instituicao e perfil

## Como aplicar

Opcao 1: `Supabase CLI`

```bash
supabase db push
```

Opcao 2: executar os arquivos de `supabase/migrations` em ordem cronologica no projeto novo.
