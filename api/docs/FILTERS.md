# Guia de Filtros Avançados

Este documento descreve como implementar e usar filtros avançados nos endpoints da API.

## Visão Geral

O sistema de filtros fornece:
- ✅ Busca textual em múltiplos campos
- ✅ Filtros de data (intervalos)
- ✅ Filtros booleanos (ativo/inativo)
- ✅ Filtros de comparação numérica
- ✅ Ordenação dinâmica
- ✅ Filtros em relações (nested)
- ✅ Operadores lógicos (AND, OR, NOT)

## DTOs Base

### QueryListDto

DTO base que combina paginação, busca e ordenação:

```typescript
import { QueryListDto } from '@/common/dto/query-list.dto';

export class QueryUsersDto extends QueryListDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;
}
```

**Parâmetros herdados:**
- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 10, máx: 100)
- `search`: Termo de busca
- `sortBy`: Campo para ordenação
- `sortOrder`: Direção (asc/desc, padrão: desc)

### DateRangeFilterDto

Para filtros de intervalo de datas:

```typescript
import { DateRangeFilterDto } from '@/common/dto';

export class QueryReportsDto extends DateRangeFilterDto {
  // fromDate e toDate já incluídos
}
```

### SearchFilterDto, SortFilterDto, ActiveFilterDto

DTOs específicos que podem ser compostos:

```typescript
export class QueryDto
  extends IntersectionType(
    SearchFilterDto,
    SortFilterDto,
    ActiveFilterDto,
  ) {}
```

## FilterBuilder

Classe utilitária para construir filtros Prisma dinamicamente:

### Uso Básico

```typescript
import { createFilterBuilder } from '@/common/utils/filter-builder.util';

const filterBuilder = createFilterBuilder<User>();

const where = filterBuilder
  .equals('role', 'TEACHER')
  .boolean('isActive', true)
  .contains('email', 'gmail.com')
  .build();

// Resultado:
// {
//   role: 'TEACHER',
//   isActive: true,
//   email: { contains: 'gmail.com', mode: 'insensitive' }
// }
```

### Métodos Disponíveis

#### equals(field, value)
Filtro de igualdade:
```typescript
filterBuilder.equals('role', 'TEACHER');
// { role: 'TEACHER' }
```

#### contains(field, value, caseInsensitive?)
Busca textual (LIKE):
```typescript
filterBuilder.contains('name', 'joão', true);
// { name: { contains: 'joão', mode: 'insensitive' } }
```

#### searchMultipleFields(fields, searchTerm, caseInsensitive?)
Busca em múltiplos campos (OR):
```typescript
filterBuilder.searchMultipleFields(
  ['firstName', 'lastName', 'email'],
  'joão'
);
// {
//   OR: [
//     { firstName: { contains: 'joão', mode: 'insensitive' } },
//     { lastName: { contains: 'joão', mode: 'insensitive' } },
//     { email: { contains: 'joão', mode: 'insensitive' } }
//   ]
// }
```

#### dateRange(field, fromDate?, toDate?)
Filtro de intervalo de datas:
```typescript
filterBuilder.dateRange('createdAt', '2024-01-01', '2024-12-31');
// {
//   createdAt: {
//     gte: Date('2024-01-01T00:00:00.000Z'),
//     lte: Date('2024-12-31T23:59:59.999Z')
//   }
// }
```

#### in(field, values)
Filtro IN (campo em lista):
```typescript
filterBuilder.in('role', ['TEACHER', 'COORDINATOR']);
// { role: { in: ['TEACHER', 'COORDINATOR'] } }
```

#### notIn(field, values)
Filtro NOT IN:
```typescript
filterBuilder.notIn('status', ['DELETED', 'ARCHIVED']);
// { status: { notIn: ['DELETED', 'ARCHIVED'] } }
```

#### compare(field, operator, value)
Comparação numérica:
```typescript
import { ComparisonOperator } from '@/common/dto';

filterBuilder.compare('age', ComparisonOperator.GREATER_THAN_OR_EQUAL, 18);
// { age: { gte: 18 } }
```

**Operadores disponíveis:**
- `EQUALS` (eq)
- `NOT_EQUALS` (ne)
- `GREATER_THAN` (gt)
- `GREATER_THAN_OR_EQUAL` (gte)
- `LESS_THAN` (lt)
- `LESS_THAN_OR_EQUAL` (lte)

#### boolean(field, value?)
Filtro booleano:
```typescript
filterBuilder.boolean('isActive', true);
// { isActive: true }
```

#### relation(field, filters)
Filtro em relações (nested):
```typescript
filterBuilder.relation('institution', {
  name: { contains: 'Escola' }
});
// {
//   institution: {
//     name: { contains: 'Escola' }
//   }
// }
```

#### and(conditions), or(conditions), not(condition)
Operadores lógicos:
```typescript
filterBuilder
  .or([
    { role: 'TEACHER' },
    { role: 'COORDINATOR' }
  ])
  .and([
    { isActive: true },
    { emailVerified: true }
  ]);
```

## Exemplo Completo

### Controller

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuários com filtros' })
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }
}
```

### DTO

```typescript
import { QueryListDto } from '@/common/dto/query-list.dto';
import { IsOptional, IsEnum, IsUUID, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Type } from 'class-transformer';

export class QueryUsersDto extends QueryListDto {
  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  institutionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
```

### Service

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  createFilterBuilder,
  buildOrderBy,
} from '@/common/utils/filter-builder.util';
import {
  PaginatedResponseDto,
  getPaginationParams,
  createPaginationMeta,
} from '@/common/dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryUsersDto): Promise<PaginatedResponseDto<User>> {
    // 1. Construir filtros
    const filterBuilder = createFilterBuilder<User>();

    // Busca em múltiplos campos
    if (query.search) {
      filterBuilder.searchMultipleFields(
        ['firstName', 'lastName', 'email'],
        query.search,
      );
    }

    // Filtros específicos
    filterBuilder
      .equals('role', query.role)
      .boolean('isActive', query.isActive)
      .equals('institutionId', query.institutionId)
      .dateRange('createdAt', query.fromDate, query.toDate);

    const where = filterBuilder.build();

    // 2. Paginação
    const { skip, take } = getPaginationParams(query.page, query.limit);

    // 3. Ordenação
    const orderBy = buildOrderBy(
      query.sortBy || 'createdAt',
      query.sortOrder,
    );

    // 4. Executar queries
    const [data, totalItems] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // 5. Retornar resposta paginada
    const meta = createPaginationMeta(query.page, query.limit, totalItems);
    return new PaginatedResponseDto(data, meta);
  }
}
```

## Exemplos de Requisições

### Busca simples
```bash
GET /api/users?search=joão
```

### Filtros específicos
```bash
GET /api/users?role=TEACHER&isActive=true
```

### Com paginação e ordenação
```bash
GET /api/users?page=2&limit=20&sortBy=createdAt&sortOrder=desc
```

### Intervalo de datas
```bash
GET /api/users?fromDate=2024-01-01&toDate=2024-12-31
```

### Combinação completa
```bash
GET /api/users?search=joão&role=TEACHER&isActive=true&page=1&limit=10&sortBy=firstName&sortOrder=asc&fromDate=2024-01-01
```

## Filtros em Relações

Para filtrar por campos de relações:

```typescript
// DTO
export class QueryStudentsDto extends QueryListDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  className?: string;  // Nome da turma

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  institutionId?: string;
}

// Service
async findAll(query: QueryStudentsDto) {
  const filterBuilder = createFilterBuilder<Student>();

  // Busca em campos do próprio modelo
  if (query.search) {
    filterBuilder.searchMultipleFields(
      ['firstName', 'lastName', 'registrationNumber'],
      query.search,
    );
  }

  // Filtro em relação
  if (query.className) {
    filterBuilder.relation('classEnrollments', {
      some: {
        class: {
          name: { contains: query.className, mode: 'insensitive' }
        }
      }
    });
  }

  const where = filterBuilder.build();
  // ... resto da implementação
}
```

## Filtros Complexos com AND/OR

Para queries mais complexas:

```typescript
// Encontrar usuários que são:
// (TEACHER OU COORDINATOR) E (ativo) E (criado em 2024)

const filterBuilder = createFilterBuilder<User>();

filterBuilder
  .or([
    { role: 'TEACHER' },
    { role: 'COORDINATOR' }
  ])
  .and([
    { isActive: true },
    {
      createdAt: {
        gte: new Date('2024-01-01'),
        lt: new Date('2025-01-01')
      }
    }
  ]);

const where = filterBuilder.build();
// {
//   OR: [
//     { role: 'TEACHER' },
//     { role: 'COORDINATOR' }
//   ],
//   AND: [
//     { isActive: true },
//     { createdAt: { gte: Date(...), lt: Date(...) } }
//   ]
// }
```

## Ordenação Avançada

### Ordenação simples
```typescript
const orderBy = buildOrderBy('createdAt', 'desc');
// { createdAt: 'desc' }
```

### Ordenação em relações (nested)
```typescript
const orderBy = buildOrderBy('institution.name', 'asc');
// { institution: { name: 'asc' } }
```

### Múltiplas ordenações
```typescript
const orderBy = [
  { isActive: 'desc' },
  { createdAt: 'desc' },
];
```

## Boas Práticas

### 1. Sempre valide entradas

Use decorators de validação nos DTOs:
```typescript
@IsOptional()
@IsEnum(UserRole)
role?: UserRole;
```

### 2. Use type-safety

O FilterBuilder é genérico e type-safe:
```typescript
const filterBuilder = createFilterBuilder<User>();  // ✅
filterBuilder.equals('role', 'TEACHER');           // ✅
filterBuilder.equals('invalidField', 'value');     // ❌ Erro TypeScript
```

### 3. Construa índices adequados

Para queries com filtros, crie índices:
```prisma
model User {
  @@index([role, isActive])
  @@index([createdAt])
  @@index([institutionId, role])
}
```

### 4. Limite campos retornados

Use `select` para retornar apenas campos necessários:
```typescript
this.prisma.user.findMany({
  where,
  select: {
    id: true,
    email: true,
    firstName: true,
    // Não retorne senhas ou dados sensíveis
  },
});
```

### 5. Documente filtros disponíveis

Use `@ApiPropertyOptional` com descrições claras:
```typescript
@ApiPropertyOptional({
  description: 'Filtrar por role do usuário',
  enum: UserRole,
  example: 'TEACHER',
})
role?: UserRole;
```

## Performance

### Use contagens condicionais

Para grandes datasets:
```typescript
// Se não precisa do total exato:
const totalItems = query.page === 1
  ? await this.prisma.user.count({ where })
  : undefined;

// Retorne totalItems como null ou estimativa
```

### Cache de queries frequentes

Para filtros comuns:
```typescript
@Cache()
@Get()
findAll(@Query() query: QueryUsersDto) {
  // ...
}
```

## Troubleshooting

### Erro: "Cannot read property 'contains' of undefined"

Verifique se o campo existe no modelo Prisma.

### Busca não funciona (case-insensitive)

Certifique-se de usar `mode: 'insensitive'`:
```typescript
filterBuilder.contains('name', 'joão', true);  // ✅
```

### Filtros em relações não funcionam

Use a estrutura correta:
```typescript
filterBuilder.relation('posts', {
  some: {  // ou every, none
    published: true
  }
});
```

## Recursos Adicionais

- [Documentação Prisma - Filtering](https://www.prisma.io/docs/concepts/components/prisma-client/filtering-and-sorting)
- [NestJS Query Parameters](https://docs.nestjs.com/controllers#request-payloads)
- Guia de Paginação: `/docs/PAGINATION.md`
