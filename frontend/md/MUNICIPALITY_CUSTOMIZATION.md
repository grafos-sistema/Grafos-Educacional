# Customização por Município

Este guia explica como personalizar o sistema de gestão escolar para cada município específico.

## 📋 Visão Geral

O sistema Grafos permite que cada município tenha sua própria identidade visual e informações:

- **Logo personalizado** do município
- **Cores customizadas** (primária, secundária, acento)
- **Nome e slogan** personalizados
- **Informações de contato** específicas
- **Metadata SEO** otimizado para o município

## 🚀 Como Configurar

### 1. Configurar Variáveis de Ambiente

Copie o arquivo `.env.municipality.example` para `.env.local`:

```bash
cp .env.municipality.example .env.local
```

### 2. Editar Variáveis de Ambiente

Abra o arquivo `.env.local` e configure as seguintes variáveis:

#### Configuração Básica

```env
# Tipo de deployment
NEXT_PUBLIC_DEPLOYMENT_TYPE=MUNICIPALITY

# Slug da instituição padrão
NEXT_PUBLIC_DEFAULT_INSTITUTION_SLUG=santa-cruz-do-rio-pardo
```

#### Informações do Município

```env
# Nome completo (ex: "Prefeitura Municipal de Santa Cruz do Rio Pardo")
NEXT_PUBLIC_MUNICIPALITY_NAME=Prefeitura Municipal de Santa Cruz do Rio Pardo

# Nome curto (ex: "Santa Cruz do Rio Pardo")
NEXT_PUBLIC_MUNICIPALITY_SHORT_NAME=Santa Cruz do Rio Pardo

# Estado (sigla)
NEXT_PUBLIC_MUNICIPALITY_STATE=SP

# Slogan/subtítulo (ex: "Secretaria Municipal de Educação")
NEXT_PUBLIC_MUNICIPALITY_SLOGAN=Secretaria Municipal de Educação
```

#### Logo e Recursos Visuais

```env
# Logo do município (coloque o arquivo em /public/logos/)
NEXT_PUBLIC_MUNICIPALITY_LOGO=/logos/santa-cruz.png

# Brasão/Escudo do município (opcional)
NEXT_PUBLIC_MUNICIPALITY_COAT_OF_ARMS=/logos/brasao-santa-cruz.png
```

**Importante:** Coloque os arquivos de logo na pasta `public/logos/` do projeto frontend.

#### Cores Customizadas

```env
# Cor primária (usada em botões, links, destaques)
NEXT_PUBLIC_PRIMARY_COLOR=#1E40AF

# Cor secundária (usada em gradientes e elementos secundários)
NEXT_PUBLIC_SECONDARY_COLOR=#059669

# Cor de acento (badges, notificações)
NEXT_PUBLIC_ACCENT_COLOR=#F59E0B
```

**Dica:** Use um color picker online para obter os códigos hexadecimais das cores da identidade visual do município.

#### Informações de Contato

```env
# Email de contato da secretaria de educação
NEXT_PUBLIC_CONTACT_EMAIL=educacao@santacruz.sp.gov.br

# Telefone de contato
NEXT_PUBLIC_CONTACT_PHONE=(14) 3372-9200

# Endereço da secretaria
NEXT_PUBLIC_CONTACT_ADDRESS=Rua da Educação, 123 - Centro, Santa Cruz do Rio Pardo - SP

# Site oficial da prefeitura
NEXT_PUBLIC_OFFICIAL_WEBSITE=https://santacruz.sp.gov.br
```

#### Redes Sociais (Opcional)

```env
NEXT_PUBLIC_FACEBOOK_URL=https://facebook.com/prefeiturasantacruz
NEXT_PUBLIC_INSTAGRAM_URL=https://instagram.com/prefeiturasantacruz
NEXT_PUBLIC_TWITTER_URL=https://twitter.com/prefeiturasantacruz
```

### 3. Adicionar Logo do Município

1. Crie a pasta `public/logos/` (se não existir):
   ```bash
   mkdir -p public/logos
   ```

2. Adicione o arquivo de logo (PNG ou SVG recomendado):
   - Formato: PNG com fundo transparente ou SVG
   - Tamanho recomendado: 200x200px ou maior
   - Nome sugerido: `nome-municipio.png`

3. Adicione o brasão (opcional):
   - Mesmo formato do logo
   - Nome sugerido: `brasao-nome-municipio.png`

### 4. Testar Localmente

```bash
npm run dev
```

Acesse `http://localhost:3000` e verifique:
- ✅ Logo aparece no header
- ✅ Nome do município aparece corretamente
- ✅ Cores estão aplicadas (botões, links)
- ✅ Título da página mostra nome do município

## 🎨 Onde as Cores são Aplicadas

As cores customizadas são aplicadas automaticamente em:

- **Cor Primária:**
  - Nome do município no header
  - Botões principais
  - Links ativos
  - Badges de status
  - Gradientes

- **Cor Secundária:**
  - Elementos secundários
  - Gradientes combinados
  - Hover states

- **Cor de Acento:**
  - Notificações
  - Badges informativos
  - Destaques especiais

## 🔧 Estrutura Técnica

### Arquivos Modificados

1. **`.env.local`** - Variáveis de ambiente
2. **`public/logos/`** - Arquivos de logo e brasão
3. **`src/config/municipality.config.ts`** - Serviço de configuração
4. **`src/app/layout.tsx`** - CSS variables aplicadas
5. **`src/components/layout/Header.tsx`** - Logo e nome no header

### Como Funciona

1. As variáveis de ambiente são lidas pelo `municipality.config.ts`
2. O `layout.tsx` aplica as cores como CSS variables no `<body>`
3. O `Header.tsx` renderiza logo e nome do município
4. Os componentes usam as CSS variables (`var(--color-primary)`) ou Tailwind

### CSS Variables

As seguintes variáveis CSS são injetadas dinamicamente:

```css
:root {
  --color-primary: #valor-da-env;
  --color-secondary: #valor-da-env;
  --color-accent: #valor-da-env;
}
```

Você pode usar essas variáveis em qualquer componente:

```tsx
<div style={{ color: 'var(--color-primary)' }}>
  Texto com cor primária
</div>
```

## 📦 Deploy em Produção

### Vercel

1. Configure as variáveis de ambiente no painel da Vercel
2. Faça upload do logo para `/public/logos/`
3. Deploy

### Docker

No Dockerfile, adicione:

```dockerfile
# Build args para customização
ARG NEXT_PUBLIC_MUNICIPALITY_NAME
ARG NEXT_PUBLIC_PRIMARY_COLOR
# ... outras variáveis

# Copie os logos
COPY public/logos /app/public/logos
```

### Servidor Tradicional

1. Configure as variáveis no `.env.local` do servidor
2. Copie os logos para `public/logos/`
3. Build: `npm run build`
4. Start: `npm start`

## 🔍 Troubleshooting

### Logo não aparece

- ✅ Verifique se o arquivo existe em `public/logos/`
- ✅ Confirme o caminho em `NEXT_PUBLIC_MUNICIPALITY_LOGO`
- ✅ Formato correto: PNG, JPG ou SVG
- ✅ Rebuild: `npm run build`

### Cores não mudaram

- ✅ Limpe o cache do navegador (Ctrl+Shift+R)
- ✅ Verifique se as variáveis estão no formato `#RRGGBB`
- ✅ Restart do servidor: `npm run dev`

### Nome do município não aparece

- ✅ Confirme `NEXT_PUBLIC_DEPLOYMENT_TYPE=MUNICIPALITY`
- ✅ Verifique `NEXT_PUBLIC_MUNICIPALITY_SHORT_NAME`
- ✅ Restart do servidor

## 📚 Exemplos

### Exemplo 1: Santa Cruz do Rio Pardo

```env
NEXT_PUBLIC_DEPLOYMENT_TYPE=MUNICIPALITY
NEXT_PUBLIC_MUNICIPALITY_NAME=Prefeitura Municipal de Santa Cruz do Rio Pardo
NEXT_PUBLIC_MUNICIPALITY_SHORT_NAME=Santa Cruz do Rio Pardo
NEXT_PUBLIC_MUNICIPALITY_STATE=SP
NEXT_PUBLIC_MUNICIPALITY_LOGO=/logos/santa-cruz.png
NEXT_PUBLIC_PRIMARY_COLOR=#1E40AF
NEXT_PUBLIC_SECONDARY_COLOR=#059669
```

### Exemplo 2: Nova Friburgo

```env
NEXT_PUBLIC_DEPLOYMENT_TYPE=MUNICIPALITY
NEXT_PUBLIC_MUNICIPALITY_NAME=Prefeitura Municipal de Nova Friburgo
NEXT_PUBLIC_MUNICIPALITY_SHORT_NAME=Nova Friburgo
NEXT_PUBLIC_MUNICIPALITY_STATE=RJ
NEXT_PUBLIC_MUNICIPALITY_LOGO=/logos/nova-friburgo.png
NEXT_PUBLIC_PRIMARY_COLOR=#DC2626
NEXT_PUBLIC_SECONDARY_COLOR=#0891B2
```

## 💡 Dicas

1. **Cores acessíveis:** Certifique-se de que as cores têm contraste suficiente
2. **Logo otimizado:** Use PNG com fundo transparente ou SVG
3. **Tamanho do logo:** Recomendado 200x200px ou maior (será redimensionado)
4. **Identidade visual:** Mantenha consistência com o site da prefeitura
5. **Teste em mobile:** Verifique a responsividade

## 🆘 Suporte

Para dúvidas ou problemas com a customização:
- 📧 Email: suporte@grafoseducacional.com.br
- 📖 Documentação: https://docs.grafoseducacional.com.br
- 💬 GitHub Issues: https://github.com/grafos/grafos/issues
