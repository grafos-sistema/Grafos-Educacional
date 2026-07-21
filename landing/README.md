# Grafos Landing Page

Landing page oficial do site principal Grafos (grafoseducacional.com.br).

## 📋 Descrição

Este é o site institucional e de marketing da plataforma Grafos, completamente separado do sistema de gestão escolar. A landing page apresenta:

- **Informações sobre a plataforma**: missão, visão e valores
- **Funcionalidades principais**: recursos do sistema
- **Estatísticas e diferenciais**: números e benefícios
- **Municípios atendidos**: lista de municípios que usam o Grafos (mockado)
- **CTA para contato**: formulário para novos municípios
- **SEO otimizado**: schema.org, meta tags, OpenGraph

## 🚀 Tecnologias

- **Next.js 15** - Framework React
- **TypeScript** - Tipagem estática
- **TailwindCSS** - Estilização
- **Heroicons** - Ícones
- **React 19** - Biblioteca UI

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.local` baseado no `.env.example`:

```env
# URL do sistema (onde os links de login apontam)
NEXT_PUBLIC_SISTEMA_URL=https://sistema.grafoseducacional.com.br

# Para desenvolvimento local
# NEXT_PUBLIC_SISTEMA_URL=http://localhost:3000
```

### Instalação

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento (porta 3001)
npm run dev

# Build para produção
npm run build

# Rodar em produção (porta 3001)
npm start
```

## 🌐 Deployment

### Vercel (Recomendado)

1. Conecte o repositório no Vercel
2. Configure as variáveis de ambiente
3. Deploy automático

### Docker

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

### Servidor Tradicional

```bash
# Build
npm run build

# Iniciar com PM2
pm2 start npm --name "grafos-landing" -- start

# Nginx reverse proxy
server {
    listen 80;
    server_name grafoseducacional.com.br;
    location / {
        proxy_pass http://localhost:3001;
    }
}
```

## 📁 Estrutura

```
landing/
├── app/
│   ├── page.tsx          # Landing page principal
│   ├── layout.tsx        # Layout com metadata SEO
│   └── globals.css       # Estilos globais
├── public/
│   └── logo-grafos.png   # Logo oficial
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## 🏙️ Municípios Cadastrados

A landing page exibe uma lista mockada de municípios que usam o sistema. Para adicionar ou modificar municípios, edite o array `municipios` em `app/page.tsx`:

```typescript
const municipios = [
  {
    nome: 'Santa Cruz do Rio Pardo',
    estado: 'SP',
    escolas: 12,
    alunos: '8.500+',
    url: 'https://santacruz.grafoseducacional.com.br',
    logo: null,
  },
  // ... mais municípios
];
```

Cada card de município mostra:
- Nome do município
- Estado (badge)
- Número de escolas
- Número de alunos
- Link direto para o sistema do município

## 🎨 Personalização

### Cores

As cores da marca estão configuradas no `tailwind.config.ts`:

```ts
colors: {
  'grafos-green': '#10B981',
  'grafos-teal': '#14B8A6',
  'grafos-lime': '#84CC16',
  'grafos-blue': '#3B82F6',
}
```

### Conteúdo

Todo o conteúdo pode ser editado em `app/page.tsx`:
- Estatísticas (linha ~115)
- Funcionalidades (linha ~119)
- Diferenciais (linha ~158)
- Perfis de acesso (linha ~76)

## 📊 SEO

A landing page inclui:
- ✅ Schema.org structured data
- ✅ OpenGraph tags
- ✅ Twitter cards
- ✅ Meta descriptions
- ✅ Semantic HTML
- ✅ Alt texts em imagens

## 🔒 Segurança

- Sem dados sensíveis
- Apenas site estático
- Links externos para o sistema
- HTTPS obrigatório em produção

## 📝 Licença

Propriedade da Grafos Educação © 2025
