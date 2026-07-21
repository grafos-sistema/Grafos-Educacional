# Migration Checklist - Frontend Improvements

Use este checklist para aplicar as melhorias nos componentes existentes.

## ✅ Completed

- [x] Configurar Vitest + Testing Library
- [x] Criar schemas de validação Zod
- [x] Criar hook useFormWithToast
- [x] Melhorar interceptor de API com Toast
- [x] Criar design tokens
- [x] Criar utilitários de performance
- [x] Criar helpers de acessibilidade
- [x] Documentação completa
- [x] Refatorar login page
- [x] Converter coordenador/ideb/metas de alert para toast
- [x] Converter admin/subjects de alert para toast

## 🔄 In Progress

### 1. Converter alert() para toast() (15 arquivos restantes)

**Arquivos pendentes:**
```bash
src/app/(authenticated)/admin/users/page.tsx
src/app/(authenticated)/admin/rankings/page.tsx
src/app/(authenticated)/admin/courses/page.tsx
src/app/(authenticated)/admin/academic-years/page.tsx
src/app/(authenticated)/admin/coordenadores/page.tsx
src/app/(authenticated)/admin/classes/page.tsx
src/app/(authenticated)/admin/professores/page.tsx
src/app/(authenticated)/admin/responsaveis/page.tsx
src/app/(authenticated)/admin/alunos/page.tsx
src/app/(authenticated)/professor/simulados/page.tsx
src/app/(authenticated)/professor/simulados/novo/page.tsx
src/app/(authenticated)/professor/simulados/[id]/page.tsx
src/components/users/BulkApproveModal.tsx
src/app/(authenticated)/coordenador/ideb/page.tsx
```

**Como converter:**
1. Adicionar import: `import { toast } from 'react-hot-toast';`
2. Substituir `alert('sucesso...')` por `toast.success('sucesso...')`
3. Substituir `alert('erro...')` por `toast.error('erro...')`

**Script automático:**
```bash
bash scripts/convert-alerts-to-toast.sh
```

### 2. Converter confirm() para Modal (3 arquivos)

**Arquivos pendentes:**
```bash
src/app/(authenticated)/aluno/simulados/[examId]/page.tsx
src/app/(authenticated)/admin/users/[id]/page.tsx
src/app/(authenticated)/professor/subject-requests/page.tsx
```

**Padrão de conversão:**

**Antes:**
```typescript
if (confirm('Tem certeza?')) {
  deleteItem();
}
```

**Depois:**
```typescript
const [showConfirm, setShowConfirm] = useState(false);

// No JSX:
{showConfirm && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-sm">
      <h3 className="font-semibold mb-2">Confirmar ação</h3>
      <p className="text-gray-600 mb-6">Tem certeza que deseja continuar?</p>
      <div className="flex gap-3">
        <button onClick={() => setShowConfirm(false)} className="flex-1 px-4 py-2 border rounded-lg">
          Cancelar
        </button>
        <button onClick={() => { deleteItem(); setShowConfirm(false); }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg">
          Confirmar
        </button>
      </div>
    </div>
  </div>
)}
```

### 3. Implementar Lazy Loading nas Rotas

**Arquivo criado:** `src/app/layout-routes.tsx`

**Próximo passo:** Atualizar navegação para usar componentes lazy-loaded

**Exemplo de uso:**
```typescript
import { Suspense } from 'react';
import { AdminDashboard } from '@/app/layout-routes';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

function AdminDashboardPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AdminDashboard />
    </Suspense>
  );
}
```

### 4. Adicionar Acessibilidade aos Formulários

**Prioridade alta - Formulários principais:**
- [ ] Login page (✅ já tem validação, falta ARIA)
- [ ] Register page
- [ ] Admin user forms
- [ ] Professor forms
- [ ] Student forms

**Checklist por formulário:**
```typescript
import { getFieldAriaProps } from '@/lib/utils/accessibility';

// Para cada campo:
const emailProps = getFieldAriaProps('email', errors.email?.message, 'Digite seu email');

<label htmlFor={emailProps.id}>Email *</label>
<input
  {...emailProps}
  {...register('email')}
  aria-required="true"
/>
{errors.email && <span id={`${emailProps.id}-error`} className="text-red-600">{errors.email.message}</span>}
```

### 5. Otimizações de Performance

**Implementar:**

- [ ] Debounce em campos de busca
  ```typescript
  import { debounce } from '@/lib/utils/performance';

  const debouncedSearch = useMemo(
    () => debounce((term: string) => performSearch(term), 300),
    []
  );
  ```

- [ ] Virtual scrolling em tabelas grandes (1000+ linhas)
  ```typescript
  import { getVisibleRange } from '@/lib/utils/performance';

  const { start, end } = getVisibleRange(scrollTop, rowHeight, containerHeight, totalRows);
  const visibleRows = allRows.slice(start, end);
  ```

- [ ] Lazy loading de imagens
  ```typescript
  import { getOptimizedImageProps } from '@/lib/utils/performance';

  <img {...getOptimizedImageProps('/hero.jpg', 800, 600)} alt="Hero" />
  ```

- [ ] Prefetch de rotas prováveis
  ```typescript
  import { prefetch } from '@/lib/utils/performance';

  useEffect(() => {
    // Prefetch dashboard when on login page
    prefetch(() => import('./dashboard/page'), 1000);
  }, []);
  ```

### 6. Aplicar Design Tokens

**Atualizar components para usar tokens:**

```typescript
import { colors, spacing, typography } from '@/lib/constants/design-tokens';

// Em Tailwind classes ou styled-components
const buttonStyle = {
  padding: `${spacing[3]} ${spacing[4]}`,
  backgroundColor: colors.primary[600],
  fontSize: typography.fontSize.base,
};
```

**Arquivos prioritários:**
- [ ] Button component
- [ ] Input component
- [ ] Card component
- [ ] Modal component
- [ ] Badge component

## 📝 Testing

**Adicionar testes para:**
- [ ] Admin pages (users, classes, subjects)
- [ ] Professor pages (attendance, grades)
- [ ] Student pages (dashboard, grades)
- [ ] Form validations
- [ ] API error handling

**Template de teste:**
```typescript
import { renderWithProviders, screen, userEvent } from '@/test/utils';
import { MyPage } from './page';

describe('MyPage', () => {
  it('renders correctly', () => {
    renderWithProviders(<MyPage />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyPage />);

    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(screen.getByText(/success/i)).toBeInTheDocument();
  });
});
```

## 🎯 Quick Wins (Fácil de implementar, alto impacto)

1. **Converter todos os alerts restantes** (15 min)
   ```bash
   bash scripts/convert-alerts-to-toast.sh
   ```

2. **Adicionar lazy loading às rotas** (30 min)
   - Usar `layout-routes.tsx` já criado
   - Envolver com `<Suspense>`

3. **Debounce nos campos de busca** (15 min)
   - Importar `debounce` de utils
   - Aplicar em todos os search inputs

4. **Acessibilidade básica nos forms** (1h)
   - Usar `getFieldAriaProps`
   - Adicionar labels com htmlFor
   - Adicionar aria-required

## 📊 Métricas de Sucesso

**Antes:**
- ❌ Sem testes
- ❌ Validação inline inconsistente
- ❌ alert() para erros
- ❌ Sem code splitting
- ❌ Acessibilidade básica

**Depois:**
- ✅ 73 testes passando
- ✅ Validação centralizada com Zod
- ✅ Toast notifications consistentes
- ✅ Lazy loading configurado
- ✅ ARIA helpers disponíveis
- ✅ Performance utilities prontas
- ✅ Design tokens centralizados

## 🚀 Deploy Checklist

Antes de fazer deploy para produção:

- [ ] Todos os testes passando
- [ ] Sem `alert()` ou `confirm()` no código
- [ ] Lazy loading em rotas pesadas
- [ ] Acessibilidade em formulários principais
- [ ] Design tokens aplicados
- [ ] Bundle size < 500kb (initial)
- [ ] Lighthouse score > 90
- [ ] WCAG AA compliance

## 📚 Recursos

- [Documentação Completa](./FRONTEND_IMPROVEMENTS.md)
- [Design Tokens](./src/lib/constants/design-tokens.ts)
- [Performance Utils](./src/lib/utils/performance.ts)
- [A11y Utils](./src/lib/utils/accessibility.ts)
- [Test Utils](./src/test/utils.tsx)
