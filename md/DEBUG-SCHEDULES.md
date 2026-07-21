# 🔍 Debug - Grade de Horários Não Lista

## ✅ Backend Verificado

- ✅ 25 horários no banco de dados
- ✅ Seeds aplicados corretamente
- ✅ Campo `color` presente
- ✅ Endpoint configurado: `GET /classes/:classId/schedules`
- ✅ Service retornando dados corretamente

## 🔎 Checklist de Debug no Frontend

### 1. Verificar Console do Navegador

Abra o DevTools (F12) e vá para a aba **Console**. Procure por:

❌ **Erros de CORS**
```
Access to XMLHttpRequest at 'http://localhost:3333/...' from origin 'http://localhost:3000' has been blocked by CORS
```

❌ **Erros 401 (Não Autenticado)**
```
GET http://localhost:3333/classes/.../schedules 401 (Unauthorized)
```

❌ **Erros 403 (Sem Permissão)**
```
GET http://localhost:3333/classes/.../schedules 403 (Forbidden)
```

❌ **Erro de Query**
```
Query data cannot be undefined
```

### 2. Verificar Network Tab

Na aba **Network** do DevTools:

1. Recarregue a página `/coordinator/schedules`
2. Selecione uma turma no dropdown
3. Veja se aparece uma requisição para `/classes/{id}/schedules`

**Se NÃO aparecer a requisição:**
- O `selectedClassId` pode estar vazio
- A query pode estar desabilitada

**Se aparecer a requisição:**
- Clique nela
- Vá para aba **Headers** 
  - Verifique se tem `Authorization: Bearer ...`
- Vá para aba **Response**
  - Veja o que o servidor retornou

### 3. Verificar Autenticação

No Console do navegador, rode:

```javascript
localStorage.getItem('token')
```

**Resultado esperado:** Uma string JWT longa
**Se null/undefined:** Faça login novamente

### 4. Verificar ClassId Selecionado

No Console, quando estiver na página de schedules, rode:

```javascript
// Pegar o classId da URL ou estado
console.log(window.location.pathname)
```

### 5. Teste Manual da API

No Console do navegador (já logado):

```javascript
fetch('http://localhost:3333/classes/f7b6b3be-9958-459d-adc1-db70de2a43fd/schedules', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => console.log('Schedules:', data))
.catch(err => console.error('Erro:', err))
```

**Resultado esperado:** Array com 14 horários

## 🐛 Problemas Comuns e Soluções

### Problema 1: "Query data cannot be undefined"
**Causa:** O service retornou `undefined` em vez de array
**Solução:** ✅ JÁ CORRIGIDO - Agora retorna `data || []`

### Problema 2: Token expirado
**Sintoma:** Erro 401 nas requisições
**Solução:** Fazer logout e login novamente

### Problema 3: Usuário não tem permissão
**Sintoma:** Erro 403
**Solução:** Usar um usuário COORDINATOR ou ADMIN

### Problema 4: ClassId não está sendo passado
**Sintoma:** Nenhuma requisição é feita ao backend
**Solução:** Verificar se o dropdown de turmas tem opções e se uma turma foi selecionada

### Problema 5: CORS bloqueado
**Sintoma:** Erro de CORS no console
**Solução:** Verificar se o backend está rodando na porta 3333

## 🧪 Teste Passo a Passo

1. **Login**
   - Email: `admin@escola.com`
   - Senha: `senha123`

2. **Ir para Grade de Horários**
   - Clicar em "Grade de Horários" na sidebar
   - URL deve ser: `/coordinator/schedules`

3. **Selecionar Turma**
   - No dropdown, selecionar "7º Ano A - Matutino"
   - Deve aparecer 14 horários na grade/lista

4. **Verificar Visualização**
   - Clicar em "Grade" para ver tabela
   - Clicar em "Lista" para ver cards

## 📋 IDs Úteis para Teste

```
Turma 7º Ano A: f7b6b3be-9958-459d-adc1-db70de2a43fd
Turma 8º Ano B: [verificar no Prisma Studio]

Endpoint direto:
GET http://localhost:3333/classes/f7b6b3be-9958-459d-adc1-db70de2a43fd/schedules
```

## 🔧 Se Nada Funcionar

Execute os seguintes comandos:

```bash
# 1. Rebuild do backend
cd api
npm run build
npm run start:dev

# 2. Rebuild do frontend  
cd ../frontend
rm -rf .next
npm run dev

# 3. Verificar se backend está rodando
curl http://localhost:3333/health

# 4. Verificar banco de dados
cd api
npx prisma studio
```

## 📸 Me Envie Screenshots De:

1. Console do navegador (aba Console)
2. Network tab mostrando a requisição para `/schedules`
3. A página em `/coordinator/schedules` após selecionar uma turma

Isso vai me ajudar a identificar exatamente onde está o problema!
