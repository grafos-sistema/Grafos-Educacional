# Guia de Paginação

Este documento descreve como implementar e usar paginação nos endpoints da API.

## DTOs Padrão

A API fornece DTOs reutilizáveis para paginação em `src/common/dto/pagination.dto.ts`:

### PaginationQueryDto

DTO para receber parâmetros de paginação em query strings:

```typescript
import { PaginationQueryDto } from '@/common/dto';

@Get()
findAll(@Query() pagination: PaginationQueryDto) {
  // pagination.page (padrão: 1)
  // pagination.limit (padrão: 10, máximo: 100)
}
```

**Parâmetros:**
- `page` (opcional): Número da página (começa em 1), padrão = 1
- `limit` (opcional): Itens por página (1-100), padrão = 10

### PaginatedResponseDto

DTO para resposta paginada padronizada:

```typescript
import { PaginatedResponseDto, createPaginationMeta } from '@/common/dto';

async findAll(page: number, limit: number) {
  const [data, totalItems] = await Promise.all([
    this.prisma.user.findMany({ skip: (page - 1) * limit, take: limit }),
    this.prisma.user.count(),
  ]);

  const meta = createPaginationMeta(page, limit, totalItems);
  return new PaginatedResponseDto(data, meta);
}
```

**Formato da resposta:**
```json
{
  "data": [
    { "id": "1", "name": "João" },
    { "id": "2", "name": "Maria" }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 100,
    "totalPages": 10,
    "hasPreviousPage": false,
    "hasNextPage": true
  }
}
```

## Helpers

### getPaginationParams()

Converte `page` e `limit` em parâmetros do Prisma:

```typescript
import { getPaginationParams } from '@/common/dto';

const { skip, take } = getPaginationParams(page, limit);

const users = await this.prisma.user.findMany({
  skip,  // (page - 1) * limit
  take,  // limit
});
```

### createPaginationMeta()

Cria metadados de paginação:

```typescript
import { createPaginationMeta } from '@/common/dto';

const meta = createPaginationMeta(page, limit, totalItems);
// Retorna: { page, limit, totalItems, totalPages, hasPreviousPage, hasNextPage }
```

## Implementação Completa

### Controller

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaginationQueryDto, PaginatedResponseDto } from '@/common/dto';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuários com paginação' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de usuários',
    type: PaginatedResponseDto<UserResponseDto>,
  })
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.usersService.findAll(pagination.page, pagination.limit);
  }
}
```

### Service

```typescript
import { Injectable } from '@nestjs/common';
import {
  PaginatedResponseDto,
  getPaginationParams,
  createPaginationMeta,
} from '@/common/dto';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 10): Promise<PaginatedResponseDto<User>> {
    // 1. Obter parâmetros do Prisma
    const { skip, take } = getPaginationParams(page, limit);

    // 2. Buscar dados e total em paralelo
    const [data, totalItems] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    // 3. Criar metadados
    const meta = createPaginationMeta(page, limit, totalItems);

    // 4. Retornar resposta paginada
    return new PaginatedResponseDto(data, meta);
  }
}
```

## Paginação com Filtros

Combine paginação com filtros estendendo o `PaginationQueryDto`:

```typescript
import { PaginationQueryDto } from '@/common/dto';
import { IsOptional, IsString, IsEnum } from 'class-validator';

export class QueryUsersDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
```

**Service com filtros:**

```typescript
async findAll(query: QueryUsersDto) {
  const { page, limit, search, role } = query;
  const { skip, take } = getPaginationParams(page, limit);

  // Construir filtros
  const where: Prisma.UserWhereInput = {};
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (role) {
    where.role = role;
  }

  // Buscar com filtros
  const [data, totalItems] = await Promise.all([
    this.prisma.user.findMany({ where, skip, take }),
    this.prisma.user.count({ where }),
  ]);

  const meta = createPaginationMeta(page, limit, totalItems);
  return new PaginatedResponseDto(data, meta);
}
```

## Exemplos de Uso

### Requisição Básica

```bash
GET /api/users
# Retorna primeira página com 10 itens
```

### Com Paginação

```bash
GET /api/users?page=2&limit=20
# Segunda página com 20 itens
```

### Com Filtros

```bash
GET /api/users?page=1&limit=10&search=joão&role=TEACHER
# Primeira página, 10 itens, filtrando por "joão" e role TEACHER
```

### Resposta Exemplo

```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "joao@escola.com",
      "firstName": "João",
      "lastName": "Silva",
      "role": "TEACHER"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 45,
    "totalPages": 5,
    "hasPreviousPage": false,
    "hasNextPage": true
  }
}
```

## Frontend - Consumindo APIs Paginadas

### React Query

```typescript
import { useQuery } from '@tanstack/react-query';

function UsersList() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, limit],
    queryFn: () => api.get(`/users?page=${page}&limit=${limit}`),
  });

  return (
    <div>
      {data?.data.map(user => (
        <UserCard key={user.id} user={user} />
      ))}

      <Pagination
        currentPage={data?.meta.page}
        totalPages={data?.meta.totalPages}
        onPageChange={setPage}
        hasNext={data?.meta.hasNextPage}
        hasPrevious={data?.meta.hasPreviousPage}
      />
    </div>
  );
}
```

### TypeScript Types

```typescript
interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// Uso
const response: PaginatedResponse<User> = await api.get('/users');
```

## Boas Práticas

### 1. Sempre use paginação em listas grandes

```typescript
// ❌ Ruim - Pode retornar milhares de registros
@Get()
async findAll() {
  return this.prisma.user.findMany();
}

// ✅ Bom - Paginação obrigatória
@Get()
async findAll(@Query() pagination: PaginationQueryDto) {
  const { skip, take } = getPaginationParams(pagination.page, pagination.limit);
  // ...
}
```

### 2. Limite o máximo de itens por página

O `PaginationQueryDto` já limita em 100 itens. Se precisar de limites customizados:

```typescript
@Max(50, { message: 'Limite máximo é 50' })
limit?: number = 10;
```

### 3. Use índices no banco de dados

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  createdAt DateTime @default(now())

  @@index([createdAt])  // Para ordenação
  @@index([role])       // Para filtros comuns
}
```

### 4. Busque dados e total em paralelo

```typescript
// ✅ Bom - Executa em paralelo
const [data, totalItems] = await Promise.all([
  this.prisma.user.findMany({ skip, take }),
  this.prisma.user.count(),
]);

// ❌ Evite - Executa sequencialmente
const data = await this.prisma.user.findMany({ skip, take });
const totalItems = await this.prisma.user.count();
```

### 5. Ordenação consistente

Sempre defina uma ordenação para resultados consistentes:

```typescript
this.prisma.user.findMany({
  skip,
  take,
  orderBy: { createdAt: 'desc' },  // ✅
});
```

### 6. Documente os limites no Swagger

```typescript
@ApiQuery({
  name: 'page',
  required: false,
  description: 'Número da página (mín: 1)',
  example: 1,
})
@ApiQuery({
  name: 'limit',
  required: false,
  description: 'Itens por página (mín: 1, máx: 100)',
  example: 10,
})
```

## Performance

### Contagem Eficiente

Para grandes datasets, considere usar aproximações:

```typescript
// Conta exata (lenta em grandes tabelas)
const total = await this.prisma.user.count();

// Aproximação (rápida)
const total = await this.prisma.$queryRaw`
  SELECT reltuples::bigint AS estimate
  FROM pg_class
  WHERE relname = 'User'
`;
```

### Cursor-based Pagination

Para listas muito grandes ou feeds infinitos:

```typescript
// Mais eficiente que offset/limit para grandes volumes
const users = await this.prisma.user.findMany({
  take: 10,
  cursor: lastUserId ? { id: lastUserId } : undefined,
  skip: lastUserId ? 1 : 0,
  orderBy: { id: 'asc' },
});
```

## Migração de Endpoints Existentes

Se você tem endpoints sem paginação, migre assim:

### Antes

```typescript
@Get()
findAll() {
  return this.service.findAll();
}
```

### Depois

```typescript
@Get()
findAll(@Query() pagination: PaginationQueryDto) {
  return this.service.findAll(pagination.page, pagination.limit);
}
```

E no service, implemente a lógica de paginação conforme mostrado acima.

## Troubleshooting

### Erro: "totalPages é NaN"

Verifique se o `totalItems` está sendo passado corretamente:

```typescript
const meta = createPaginationMeta(page, limit, totalItems);  // ✅
const meta = createPaginationMeta(page, limit, undefined);   // ❌
```

### Erro: "skip deve ser número"

Use `getPaginationParams` ou converta para número:

```typescript
const { skip, take } = getPaginationParams(+page, +limit);  // ✅
```

### Páginas vazias

Certifique-se de que a página solicitada existe:

```typescript
const totalPages = Math.ceil(totalItems / limit);
if (page > totalPages && totalPages > 0) {
  throw new BadRequestException(`Página ${page} não existe. Total de páginas: ${totalPages}`);
}
```
