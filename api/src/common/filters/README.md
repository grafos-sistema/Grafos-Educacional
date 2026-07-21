# Sistema de Tratamento de Erros

Este diretório contém filtros de exceção que fornecem mensagens de erro consistentes e amigáveis para a API.

## Filtros Disponíveis

### AllExceptionsFilter

Filtro global que captura **todas** as exceções da aplicação e as transforma em respostas HTTP padronizadas.

**Características:**
- Captura exceções HTTP do NestJS
- Trata erros do Prisma com mensagens amigáveis
- Formata erros de validação (class-validator)
- Oculta detalhes sensíveis em produção
- Loga todos os erros para debugging

**Tipos de erro tratados:**

#### 1. Erros HTTP (HttpException)
```typescript
throw new BadRequestException('Email inválido');
// Resposta:
{
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/auth/login",
  "method": "POST",
  "message": "Email inválido",
  "error": "Bad Request"
}
```

#### 2. Erros de Validação (class-validator)
```typescript
// DTO com validações que falham
{
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/users",
  "method": "POST",
  "message": [
    "Email é obrigatório",
    "Senha deve ter no mínimo 6 caracteres",
    "CPF inválido"
  ],
  "error": "Erro de Validação"
}
```

#### 3. Erros do Prisma

O filtro traduz códigos de erro do Prisma para mensagens amigáveis em português:

| Código | Status | Mensagem |
|--------|--------|----------|
| P2000 | 400 | Valor muito longo para o campo do banco de dados |
| P2002 | 409 | Já existe um registro com este(s) valor(es) para: {campo} |
| P2003 | 400 | Operação inválida. O registro {campo} não existe |
| P2011 | 400 | O campo {campo} é obrigatório e não pode ser vazio |
| P2014 | 400 | Operação inválida. Relação obrigatória não foi preenchida |
| P2024 | 408 | Tempo limite de conexão excedido. Tente novamente |
| P2025 | 404 | Registro não encontrado ou já foi removido |

**Exemplo de erro P2002 (duplicado):**
```typescript
// Tentando criar usuário com email duplicado
{
  "statusCode": 409,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/users",
  "method": "POST",
  "message": "Já existe um registro com este(s) valor(es) para: email",
  "error": "Erro no Banco de Dados"
}
```

## DTOs de Resposta de Erro

DTOs padronizados para documentar respostas de erro no Swagger:

### ErrorResponseDto
DTO base para todas as respostas de erro.

```typescript
import { ErrorResponseDto } from '@/common/dto';
```

### DTOs Específicos

- `BadRequestResponseDto` - 400
- `UnauthorizedResponseDto` - 401
- `ForbiddenResponseDto` - 403
- `NotFoundResponseDto` - 404
- `ConflictResponseDto` - 409
- `InternalServerErrorResponseDto` - 500

## Decorators para Documentação

Use os decorators para adicionar documentação de erros nos endpoints:

### @ApiCommonResponses()

Adiciona respostas comuns de erro (400, 401, 403, 500):

```typescript
import { ApiCommonResponses } from '@/common/decorators/api-common-responses.decorator';

@Controller('users')
export class UsersController {
  @Post()
  @ApiCommonResponses()
  @ApiResponse({ status: 201, description: 'Usuário criado' })
  create(@Body() dto: CreateUserDto) {
    // ...
  }
}
```

### @ApiNotFoundResponse()

Documenta resposta 404:

```typescript
import { ApiNotFoundResponse } from '@/common/decorators/api-common-responses.decorator';

@Get(':id')
@ApiNotFoundResponse('Usuário não encontrado')
getUser(@Param('id') id: string) {
  // ...
}
```

### @ApiConflictResponse()

Documenta resposta 409:

```typescript
import { ApiConflictResponse } from '@/common/decorators/api-common-responses.decorator';

@Post()
@ApiConflictResponse('Email já cadastrado')
create(@Body() dto: CreateUserDto) {
  // ...
}
```

## Exemplo Completo

```typescript
import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  ApiCommonResponses,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@/common/decorators/api-common-responses.decorator';

@ApiTags('users')
@Controller('users')
export class UsersController {
  @Post()
  @ApiOperation({ summary: 'Criar novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  @ApiCommonResponses()
  @ApiConflictResponse('Email já cadastrado')
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  @ApiResponse({ status: 200, description: 'Usuário encontrado' })
  @ApiCommonResponses()
  @ApiNotFoundResponse('Usuário não encontrado')
  getById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
```

## Modo Produção

Em produção (`NODE_ENV=production`), erros internos (500) ocultam detalhes sensíveis:

```typescript
// Desenvolvimento
{
  "statusCode": 500,
  "message": "Cannot read property 'id' of undefined",
  "error": "Internal Server Error"
}

// Produção
{
  "statusCode": 500,
  "message": "Ocorreu um erro interno. Tente novamente mais tarde.",
  "error": "Internal Server Error"
}
```

## Logs

Todos os erros são logados no console com detalhes completos:

```
[AllExceptionsFilter] Prisma Error [P2002]: Já existe um registro com este(s) valor(es) para: email
```

```
[AllExceptionsFilter] Unexpected Error: Cannot read property 'id' of undefined
  at UsersService.create (/app/src/users/users.service.ts:15:20)
  ...
```

## Lançando Erros Personalizados

### Erros HTTP Simples

```typescript
import { NotFoundException, BadRequestException } from '@nestjs/common';

// 404
throw new NotFoundException('Usuário não encontrado');

// 400
throw new BadRequestException('Email inválido');

// 409
throw new ConflictException('Email já cadastrado');

// 403
throw new ForbiddenException('Você não tem permissão');

// 401
throw new UnauthorizedException('Token inválido');
```

### Erros com Múltiplas Mensagens

```typescript
throw new BadRequestException([
  'Email é obrigatório',
  'Senha deve ter no mínimo 6 caracteres'
]);
```

### Erros do Prisma

Os erros do Prisma são automaticamente capturados e traduzidos. Não é necessário tratá-los manualmente:

```typescript
// Isso lançará automaticamente erro 409 com mensagem amigável
await this.prisma.user.create({
  data: { email: 'duplicado@email.com' }
});
```

## Boas Práticas

1. **Use exceções HTTP apropriadas** para cada situação
2. **Forneça mensagens claras** que ajudem o usuário a entender o problema
3. **Documente todas as respostas** de erro nos endpoints usando decorators
4. **Não exponha informações sensíveis** nas mensagens de erro
5. **Use validações no DTO** sempre que possível (elas geram mensagens automáticas)

## Testando Erros

Para testar respostas de erro:

```bash
# Erro de validação
curl -X POST http://localhost:3333/api/users \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid"}'

# Erro 404
curl http://localhost:3333/api/users/999999

# Erro 409 (duplicado)
curl -X POST http://localhost:3333/api/users \
  -H "Content-Type: application/json" \
  -d '{"email": "existing@email.com", ...}'
```
