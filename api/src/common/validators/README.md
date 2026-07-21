# Validadores Customizados

Este diretório contém validadores customizados para a aplicação, utilizando `class-validator`.

## Validadores Disponíveis

### 1. `@IsCPF()`
Valida CPF brasileiro (Cadastro de Pessoa Física).

**Características:**
- Aceita CPF com ou sem formatação (123.456.789-01 ou 12345678901)
- Remove caracteres não numéricos automaticamente
- Valida dígitos verificadores
- Rejeita CPFs com todos os dígitos iguais (ex: 111.111.111-11)

**Uso:**
```typescript
import { IsCPF } from '@/common/validators';

export class CreateUserDto {
  @IsCPF({ message: 'CPF inválido' })
  cpf: string;
}
```

### 2. `@IsBrazilianPhone()`
Valida telefones brasileiros.

**Características:**
- Aceita telefones fixos (10 dígitos) e celulares (11 dígitos)
- Formato: (DD) XXXXX-XXXX ou (DD) XXXX-XXXX
- Remove caracteres não numéricos automaticamente
- Valida DDD (11 a 99)
- Para celulares (11 dígitos), o terceiro dígito deve ser 9

**Uso:**
```typescript
import { IsBrazilianPhone } from '@/common/validators';

export class CreateInstitutionDto {
  @IsBrazilianPhone({ message: 'Telefone inválido' })
  phone: string;
}
```

### 3. `@IsFutureDate()`
Valida se a data é hoje ou no futuro.

**Características:**
- Compara apenas a data, ignorando horas
- Útil para validar datas de eventos, prazos, etc.

**Uso:**
```typescript
import { IsFutureDate } from '@/common/validators';

export class CreateAssignmentDto {
  @IsFutureDate({ message: 'Data limite deve ser hoje ou no futuro' })
  dueDate: string;
}
```

### 4. `@IsPastDate()`
Valida se a data é hoje ou no passado.

**Características:**
- Compara apenas a data, ignorando horas
- Útil para validar datas de nascimento, históricos, etc.

**Uso:**
```typescript
import { IsPastDate } from '@/common/validators';

export class CreateUserDto {
  @IsPastDate({ message: 'Data de nascimento deve ser no passado' })
  birthDate: string;
}
```

### 5. `@IsDateInRange(minYear, maxYear)`
Valida se a data está em um intervalo de anos.

**Parâmetros:**
- `minYear`: Ano mínimo (inclusive)
- `maxYear`: Ano máximo (inclusive)

**Uso:**
```typescript
import { IsDateInRange } from '@/common/validators';

export class CreateIDEBTargetDto {
  @IsDateInRange(2000, 2100, { message: 'Ano deve estar entre 2000 e 2100' })
  year: number;
}
```

### 6. `@IsAfter(property)`
Valida se a data é posterior a outra propriedade.

**Parâmetros:**
- `property`: Nome da propriedade para comparação

**Características:**
- Útil para validar pares de datas (início/fim)
- Se a propriedade de comparação não existir, a validação passa

**Uso:**
```typescript
import { IsAfter } from '@/common/validators';

export class CreateAcademicPeriodDto {
  startDate: string;

  @IsAfter('startDate', { message: 'Data de término deve ser posterior à data de início' })
  endDate: string;
}
```

### 7. `@IsValidGradeLevel()`
Valida séries/anos escolares brasileiros.

**Séries aceitas:**
- **Educação Infantil**: Berçário, Maternal I/II, Jardim I/II, Pré I/II
- **Ensino Fundamental Anos Iniciais**: 1º ano até 5º ano
- **Ensino Fundamental Anos Finais**: 6º ano até 9º ano
- **Ensino Médio**: 1ª série até 3ª série
- **EJA**: EJA - Fundamental I/II, EJA - Médio

**Formatos aceitos:**
- Exatos da lista: "1º ano", "5º ano", "1ª série"
- Variações comuns: "1 ano", "1° ano", etc.

**Uso:**
```typescript
import { IsValidGradeLevel } from '@/common/validators';

export class CreateIDEBTargetDto {
  @IsValidGradeLevel({ message: 'Série/ano escolar inválido' })
  gradeLevel: string;
}
```

## Importação

Todos os validadores podem ser importados do índice:

```typescript
import {
  IsCPF,
  IsBrazilianPhone,
  IsFutureDate,
  IsPastDate,
  IsDateInRange,
  IsAfter,
  IsValidGradeLevel,
} from '@/common/validators';
```

## Combinando Validadores

Você pode combinar múltiplos validadores em uma propriedade:

```typescript
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @IsCPF({ message: 'CPF inválido' })
  cpf: string;

  @IsString()
  @IsOptional()
  @IsBrazilianPhone({ message: 'Telefone inválido' })
  phone?: string;
}
```

## Mensagens de Erro Customizadas

Todos os validadores suportam mensagens de erro customizadas:

```typescript
@IsCPF({ message: 'O CPF fornecido não é válido. Verifique e tente novamente.' })
cpf: string;
```

## Testando Validadores

Para testar os validadores manualmente:

```typescript
import { IsCPFConstraint } from '@/common/validators';

const validator = new IsCPFConstraint();
console.log(validator.validate('12345678901')); // false - CPF inválido
console.log(validator.validate('11111111111')); // false - Todos dígitos iguais
```

## Criando Novos Validadores

Para criar um novo validador customizado:

1. Crie uma classe que implementa `ValidatorConstraintInterface`
2. Implemente o método `validate()`
3. Implemente o método `defaultMessage()`
4. Crie a função decoradora
5. Exporte no `index.ts`

Exemplo:

```typescript
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isCustom', async: false })
export class IsCustomConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    // Lógica de validação
    return true;
  }

  defaultMessage(): string {
    return 'Valor inválido';
  }
}

export function IsCustom(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCustomConstraint,
    });
  };
}
```
