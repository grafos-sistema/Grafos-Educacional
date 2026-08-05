# Debug Session: menu-nav-bounce
- **Status**: [OPEN]
- **Issue**: Clique no menu lateral navega e “volta” para a página anterior; frequentemente só funciona no 2º clique.
- **Debug Server**: http://127.0.0.1:7777/event
- **Log File**: .dbg/trae-debug-log-menu-nav-bounce.ndjson

## Reproduction Steps
1. Iniciar o Debug Server local.
2. Abrir o sistema em produção com `?dbg=1` (ex.: `https://grafoseducacional.com.br/communication?dbg=1`).
3. Logar com qualquer role.
4. A partir do menu lateral, clicar em um item diferente (ex.: “Professores”).
5. Observar se volta para a rota anterior.
6. Enviar o arquivo `.dbg/trae-debug-log-menu-nav-bounce.ndjson`.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | Middleware está negando a rota (roleRoutes/matcher) e redirecionando para a rota anterior/dash, causando “bounce”. | High | Low | Pending |
| B | Algum guard client-side (layout/provider) está rodando após mudança de pathname e forçando redirect (ex.: para dashboard/communication). | High | Med | Pending |
| C | Cookie `userRole` (activeProfile) está inconsistente com o role real do usuário no momento do clique, então o middleware decide errado e redireciona. | Med | Med | Pending |
| D | Duplo handler de clique (capturing + onClick do Link) dispara navegação e depois cancela/volta via `router`/`startNavigation`/`stopNavigation`. | Med | Low | Pending |
| E | Service Worker/cache está servindo resposta/redirect “antigo” e revertendo a navegação. | Low | Med | Pending |

## Log Evidence
- Pending

## Verification Conclusion
- Pending (needs pre-fix logs)
