# Debug Session: infinite-loading-local
- **Status**: [OPEN]
- **Issue**: Carregamento infinito no localhost após login / navegação inicial (sem erros visíveis).
- **Debug Server**: http://127.0.0.1:7777/event
- **Log File**: .dbg/trae-debug-log-infinite-loading-local.ndjson

## Reproduction Steps
1. Subir `api` (Nest) e `frontend` (Next) em localhost.
2. Acessar `/security` e efetuar login como `SUPER_ADMIN_GLOBAL`.
3. Observar tela com carregamento infinito (skeleton/blank/redirect).

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | Loop de redirect (middleware) mantém o browser alternando entre rotas e nunca monta o App. | High | Low | Pending |
| B | `AuthProvider.initAuth()` fica preso em uma promise (Supabase `getUser` / `users` select), mantendo `isLoading=true` e layout preso no skeleton. | High | Low | Pending |
| C | `AuthProvider` loga/desloga por falha de leitura no Supabase (RLS/perm) e o layout fica em ciclo de skeleton → redirect. | Med | Low | Pending |
| D | `AuthenticatedNavigationProvider` mantém `isNavigating=true` por evento de router não finalizado e a UI fica sempre no skeleton de navegação. | Med | Med | Pending |
| E | O frontend está chamando um endpoint que fica pendente (hang) e bloqueia o bootstrap do estado (ex.: profile/institutions) sem erro. | Med | Med | Pending |

## Log Evidence
[Pending]

## Verification Conclusion
[Pending]
