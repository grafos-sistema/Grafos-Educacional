# GitHub + Supabase: CI/CD

O repositório agora possui dois workflows:

- `CI`: valida o contrato das migrations e compila API, frontend e landing em Pull Requests e em `main`.
- `Deploy Supabase`: em um push para `main` que altere `supabase/`, executa `db push` e publica todas as Edge Functions.

O deploy de produção usa `concurrency` para impedir que duas execuções apliquem migrations ao mesmo tempo.

## Configuração no GitHub

Crie o Environment `production` em **Settings → Environments** e, idealmente, configure um aprovador obrigatório antes do deploy.

Adicione estes Secrets no Environment `production`:

| Secret | Valor |
| --- | --- |
| `SUPABASE_ACCESS_TOKEN` | Personal Access Token do Supabase. Não use a service role key. |
| `SUPABASE_DB_PASSWORD` | Senha do banco do projeto Supabase. |
| `SUPABASE_PROJECT_REF` | `hwbnmnbieqcxbejtbsdu` |

O token deve ser criado no painel da conta do Supabase, em **Account → Access Tokens**. A senha do banco pode ser consultada ou redefinida nas configurações do projeto.

Depois, proteja a branch `main` exigindo os checks `Validate Supabase migrations`, `Build API`, `Build frontend` e `Build landing` antes do merge.

## Fluxo de trabalho

Crie migrations localmente com o CLI:

```bash
supabase migration new nome_da_alteracao
supabase db reset
supabase db push --dry-run
```

Faça commit da migration e abra um Pull Request. Após o merge em `main`, o workflow aplica somente migrations ainda ausentes no histórico remoto e publica as Edge Functions.

Não use `supabase db reset --linked` em produção: esse comando é destrutivo e deve ficar restrito a ambientes descartáveis.

## Atenção às migrations legadas

O diretório atual contém migrations antigas que não seguem o padrão oficial `YYYYMMDDHHmmss_nome.sql`, incluindo arquivos com timestamps de 8 dígitos e arquivos sem timestamp. O workflow bloqueia o deploy até que isso seja reconciliado.

Não renomeie esses arquivos automaticamente: o Supabase compara os timestamps locais com `supabase_migrations.schema_migrations`, e uma renomeação pode fazer uma alteração já aplicada parecer nova.

Faça a reconciliação uma única vez, com acesso ao projeto correto:

```bash
supabase link --project-ref hwbnmnbieqcxbejtbsdu
supabase migration list
supabase db push --dry-run
```

Compare o histórico remoto com o Git. Para migrations já aplicadas, use `supabase migration repair` somente com o timestamp confirmado no banco; para alterações ainda não aplicadas, crie novos arquivos com timestamp de 14 dígitos. Depois rode `supabase db reset` localmente e faça o merge dessa correção.

## Deploy da aplicação

Este workflow publica o projeto Supabase. O monorepo também contém API NestJS, frontend Next.js e landing, com referências a Railway, Vercel e Docker em arquivos diferentes. Como o provedor de produção da aplicação não está definido univocamente no repositório, o deploy desses serviços continua sendo configurado no provedor escolhido:

- Vercel: conecte o repositório e defina `frontend` ou `landing` como Root Directory; pushes e merges passam a gerar deployments automáticos.
- Railway: conecte o repositório e defina `api` como Root Directory.
- Docker/Swarm: configure o registry e o acesso ao servidor antes de automatizar `docker stack deploy`.

Não configure o GitHub Actions do Supabase e a integração nativa do Supabase para publicar a mesma branch ao mesmo tempo; escolha um único mecanismo para evitar deploy duplicado.
