# Guia de Segurança

Este documento descreve as práticas e medidas de segurança implementadas neste projeto.

## Medidas Implementadas

### 1. Autenticação e Autorização

- **JWT (JSON Web Tokens)**: Tokens assinados com segurança usando HS256
- **Guards globais**: JwtAuthGuard e RolesGuard aplicados em todas as rotas
- **Role-based access control (RBAC)**: Controle de acesso baseado em funções
- **Password hashing**: Senhas com bcrypt (10 rounds)

### 2. Rate Limiting

- **ThrottlerGuard**: Proteção contra força bruta e DDoS
- **Configuração padrão**: 10 requisições por minuto por IP
- **Configurável por ambiente**: Via variáveis de ambiente

### 3. Proteção contra Injeções

- **SQL Injection**: Prevenido pelo Prisma ORM (queries parametrizadas)
- **XSS (Cross-Site Scripting)**: Sanitização de inputs com SanitizePipe
- **NoSQL Injection**: Validação de DTOs com class-validator

### 4. Headers de Segurança

Implementado via `SecurityHeadersMiddleware`:

- `X-Frame-Options: DENY` - Previne clickjacking
- `X-XSS-Protection: 1; mode=block` - Proteção XSS
- `X-Content-Type-Options: nosniff` - Previne MIME sniffing
- `Content-Security-Policy` - Controla recursos carregados
- `Strict-Transport-Security` - HSTS (apenas em produção)
- `Referrer-Policy` - Controla informações de referrer

### 5. Validação de Dados

- **class-validator**: Validação declarativa de DTOs
- **class-transformer**: Transformação segura de dados
- **SanitizePipe**: Sanitização adicional de inputs

### 6. Logging de Segurança

- **SecurityLoggerInterceptor**: Registra eventos sensíveis
- **Logs de autenticação**: Falhas de login e acesso negado
- **Detecção de requisições lentas**: Possíveis ataques DoS
- **Logs de IP e User-Agent**: Rastreabilidade

## Boas Práticas

### Variáveis de Ambiente

```env
# Nunca commitar o arquivo .env
# Use senhas fortes e aleatórias
JWT_SECRET=<senha-forte-aleatória-256-bits>
DATABASE_URL=postgresql://user:password@localhost:5432/db

# Rate limiting
THROTTLE_TTL=60000  # 1 minuto
THROTTLE_LIMIT=10   # 10 requisições
```

### Uso do Decorator @Sanitize()

```typescript
import { Sanitize } from './common/decorators/sanitize.decorator';

@Controller('users')
export class UsersController {
  @Post()
  @Sanitize() // Sanitiza inputs automaticamente
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}
```

### Proteção de Rotas Sensíveis

```typescript
@Get('admin/users')
@Roles(UserRole.SUPER_ADMIN) // Apenas super admin
@UseGuards(JwtAuthGuard, RolesGuard)
getAdminUsers() {
  return this.usersService.findAll();
}
```

## Checklist de Segurança

### Antes do Deploy

- [ ] Atualizar todas as dependências
- [ ] Executar `npm audit` e corrigir vulnerabilidades
- [ ] Verificar variáveis de ambiente em produção
- [ ] Configurar HTTPS/TLS
- [ ] Habilitar CORS apenas para domínios autorizados
- [ ] Revisar permissões de usuários e roles
- [ ] Configurar backups do banco de dados
- [ ] Testar rate limiting
- [ ] Verificar logs de segurança

### Monitoramento Contínuo

- [ ] Revisar logs de segurança regularmente
- [ ] Monitorar tentativas de acesso não autorizado
- [ ] Verificar updates de segurança do NestJS e dependências
- [ ] Realizar auditorias de segurança periodicamente
- [ ] Manter documentação atualizada

## Vulnerabilidades Conhecidas

Para reportar vulnerabilidades de segurança, entre em contato com a equipe de desenvolvimento.

## Referências

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security](https://docs.nestjs.com/security/helmet)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
