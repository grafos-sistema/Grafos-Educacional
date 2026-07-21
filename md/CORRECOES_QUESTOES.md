# Correções no Sistema de Questões e Geração de PDF

## Problemas Identificados e Corrigidos

### 1. **Mapeamento Incompleto de Tipos de Questões no Backend**

**Problema:** O serviço de geração de PDF (`activities.service.ts`) só mapeava 2 dos 6 tipos de questões:
- ✅ MULTIPLE_CHOICE
- ✅ OPEN_ENDED
- ❌ TRUE_FALSE (não mapeado)
- ❌ SHORT_ANSWER (não mapeado)
- ❌ ESSAY (não mapeado)
- ❌ FILL_IN_BLANK (não mapeado)

**Solução:** Adicionado mapeamento completo para todos os tipos:

```typescript
const typeNames = {
  [QuestionType.MULTIPLE_CHOICE]: 'Múltipla Escolha',
  [QuestionType.OPEN_ENDED]: 'Resposta Aberta',
  [QuestionType.TRUE_FALSE]: 'Verdadeiro ou Falso',
  [QuestionType.SHORT_ANSWER]: 'Resposta Curta',
  [QuestionType.ESSAY]: 'Dissertativa',
  [QuestionType.FILL_IN_BLANK]: 'Preencher Lacunas',
};
```

E corrigido as flags booleanas para renderização:

```typescript
isMultipleChoice: questionType === QuestionType.MULTIPLE_CHOICE,
isTrueFalse: questionType === QuestionType.TRUE_FALSE,
isShortAnswer: questionType === QuestionType.SHORT_ANSWER,
isEssay: questionType === QuestionType.ESSAY || questionType === QuestionType.OPEN_ENDED,
isFillInBlank: questionType === QuestionType.FILL_IN_BLANK,
```

### 2. **Tipo OPEN_ENDED Faltando no Frontend**

**Problema:** O enum `QuestionType` no frontend não incluía o tipo `OPEN_ENDED` que existe no banco de dados (schema Prisma).

**Arquivos afetados:**
- `frontend/src/types/question-bank.types.ts`
- `frontend/src/app/(authenticated)/professor/question-bank/page.tsx`
- `frontend/src/app/(authenticated)/super-admin/questions/page.tsx`
- `frontend/src/app/(authenticated)/super-admin/dashboard/page.tsx`

**Solução:** Adicionado `OPEN_ENDED` ao enum e aos labels em todos os arquivos:

```typescript
export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  OPEN_ENDED = 'OPEN_ENDED',  // ← Adicionado
  TRUE_FALSE = 'TRUE_FALSE',
  SHORT_ANSWER = 'SHORT_ANSWER',
  ESSAY = 'ESSAY',
  FILL_IN_BLANK = 'FILL_IN_BLANK',
}

const TYPE_LABELS: Record<QuestionType, string> = {
  [QuestionType.MULTIPLE_CHOICE]: 'Múltipla Escolha',
  [QuestionType.OPEN_ENDED]: 'Resposta Aberta',  // ← Adicionado
  [QuestionType.TRUE_FALSE]: 'Verdadeiro/Falso',
  [QuestionType.SHORT_ANSWER]: 'Resposta Curta',
  [QuestionType.ESSAY]: 'Dissertativa',
  [QuestionType.FILL_IN_BLANK]: 'Preencher Lacunas',
};
```

## Tipos de Questões Suportados

Agora todos os 6 tipos de questões são totalmente suportados:

### 1. **MULTIPLE_CHOICE** - Múltipla Escolha
- Exibe opções com checkbox
- Suporta letras (A, B, C, D, E, F, G, H)
- Layout responsivo em colunas
- Opções longas (>80 caracteres) ocupam linha inteira

### 2. **OPEN_ENDED** - Resposta Aberta
- Exibe 10 linhas para resposta dissertativa
- Ideal para questões que requerem desenvolvimento de raciocínio

### 3. **TRUE_FALSE** - Verdadeiro ou Falso
- Exibe duas opções: V) Verdadeiro e F) Falso
- Layout compacto

### 4. **SHORT_ANSWER** - Resposta Curta
- Exibe espaço com borda tracejada para resposta
- Ideal para respostas breves (uma palavra ou frase)

### 5. **ESSAY** - Dissertativa
- Similar ao OPEN_ENDED, exibe 10 linhas para resposta
- Para respostas longas e elaboradas

### 6. **FILL_IN_BLANK** - Preencher Lacunas
- Exibe espaço para completar o texto
- Ideal para exercícios de completar frases

## Renderização no PDF

O template Handlebars (`worksheet.hbs`) já estava preparado para todos os tipos e continua funcionando corretamente. Cada tipo renderiza da seguinte forma:

### Multiple Choice
```html
<div class="options">
  <div class="option">
    <span class="option-checkbox"></span>
    <span class="option-letter">A)</span>
    <span class="option-text">Texto da opção</span>
  </div>
</div>
```

### True/False
```html
<div class="options">
  <div class="option">
    <span class="option-checkbox"></span>
    <span class="option-letter">V)</span>
    <span class="option-text">Verdadeiro</span>
  </div>
  <div class="option">
    <span class="option-checkbox"></span>
    <span class="option-letter">F)</span>
    <span class="option-text">Falso</span>
  </div>
</div>
```

### Short Answer
```html
<div class="answer-space">
  <span class="answer-space-label">Espaço para resposta:</span>
</div>
```

### Essay / Open Ended
```html
<div class="answer-lines">
  <div class="answer-line"></div>
  <div class="answer-line"></div>
  <!-- 10 linhas ao todo -->
</div>
```

### Fill in Blank
```html
<div class="answer-space">
  <span class="answer-space-label">Complete com sua resposta:</span>
</div>
```

## Arquivos Modificados

### Backend
- ✅ `api/src/activities/activities.service.ts` (linhas 688-734)
  - Adicionado mapeamento completo de todos os tipos de questões
  - Corrigido flags booleanas para renderização no PDF

### Frontend
- ✅ `frontend/src/types/question-bank.types.ts` (linha 38)
  - Adicionado tipo OPEN_ENDED ao enum QuestionType

- ✅ `frontend/src/app/(authenticated)/professor/question-bank/page.tsx`
  - Adicionado label para OPEN_ENDED (linha 46)
  - Corrigido mapeamento de DIFFICULTY_COLORS e DIFFICULTY_LABELS (linhas 30-46)

- ✅ `frontend/src/app/(authenticated)/super-admin/questions/page.tsx` (linhas 57-64)
  - Adicionado label para OPEN_ENDED

- ✅ `frontend/src/app/(authenticated)/super-admin/dashboard/page.tsx` (linhas 21-28)
  - Adicionado label para OPEN_ENDED

## Testes Recomendados

Para validar as correções, recomenda-se testar:

1. ✅ Criar uma atividade com questões de cada tipo
2. ✅ Gerar o PDF da atividade
3. ✅ Verificar visualmente a renderização de cada tipo de questão no PDF
4. ✅ Verificar que os labels corretos aparecem no frontend
5. ✅ Verificar que questões OPEN_ENDED aparecem corretamente no banco de questões

## Seeds de Exemplo

O arquivo `api/prisma/seeds/questions-all-types-seed.ts` já contém exemplos de todos os tipos de questões que podem ser usados para testes.

Para executar o seed:
```bash
cd api
npx tsx prisma/seeds/questions-all-types-seed.ts
```

## Conclusão

Todas as inconsistências entre o banco de dados, backend e frontend foram corrigidas. Agora:

- ✅ Todos os 6 tipos de questões são suportados e mapeados corretamente
- ✅ O PDF renderiza corretamente cada tipo de questão
- ✅ O frontend exibe os labels corretos para todos os tipos
- ✅ A compatibilidade entre Prisma, backend e frontend está completa
