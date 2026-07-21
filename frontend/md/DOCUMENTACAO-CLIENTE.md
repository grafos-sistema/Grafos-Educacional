# 📚 Documentação do Sistema Grafos - Plataforma Educacional

## 🎯 Visão Geral

O **Grafos** é uma plataforma educacional completa que permite a gestão de instituições de ensino, facilitando a comunicação e o acompanhamento entre administradores, coordenadores, professores, alunos e famílias.

---

## 🔐 Sistema de Autenticação e Perfis

### O que foi implementado?

Um sistema de login inteligente que reconhece que uma mesma pessoa pode ter **múltiplos papéis** na instituição educacional.

### Por que isso é importante?

Na vida real, é comum que:
- Um **professor** também seja **pai/mãe** de um aluno
- Um **coordenador** também atue como **professor**
- Um **gestor** também ensine algumas turmas

O sistema foi desenvolvido para refletir essa realidade, permitindo que uma única conta de usuário tenha acesso a diferentes áreas da plataforma.

### Como funciona?

#### 1️⃣ Login Único
- O usuário faz login **uma única vez** com seu email e senha
- O sistema identifica automaticamente todos os perfis vinculados a essa conta

#### 2️⃣ Seleção de Perfil
- Se o usuário possui **apenas um perfil**: é direcionado diretamente para sua área
- Se o usuário possui **múltiplos perfis**: é apresentada uma tela elegante para escolher como deseja acessar a plataforma naquele momento

#### 3️⃣ Troca Rápida de Perfil
- Após escolher um perfil inicial, o usuário pode **trocar entre seus perfis** a qualquer momento
- A troca é feita através de um menu dropdown no canto superior direito
- **Não é necessário fazer logout e login novamente**

---

## 👥 Tipos de Perfis Disponíveis

### 🛡️ Super Admin
- **Acesso**: Gestão completa do sistema
- **Área**: `/admin/dashboard`
- **Permissões**: Controle total da plataforma

### 🏢 Administrador da Instituição
- **Acesso**: Gestão da instituição específica
- **Área**: `/admin/dashboard`
- **Permissões**: Gerenciar professores, alunos, turmas, matrículas

### 👔 Coordenador
- **Acesso**: Coordenação pedagógica
- **Área**: `/coordinator/dashboard`
- **Permissões**: Acompanhar professores e alunos, gerenciar atividades

### 🎓 Professor
- **Acesso**: Área docente
- **Área**: `/professor/dashboard`
- **Permissões**: Gerenciar turmas, lançar notas, criar atividades

### 📖 Aluno
- **Acesso**: Portal do estudante
- **Área**: `/aluno/dashboard`
- **Permissões**: Ver notas, atividades, conteúdos das aulas

### 👨‍👩‍👧 Família (Pais/Responsáveis)
- **Acesso**: Acompanhamento dos filhos
- **Área**: `/responsaveis/dashboard`
- **Permissões**: Ver desempenho dos filhos, comunicar com professores

---

## 🔒 Segurança Implementada

### Tokens JWT em Cookies
- **O que é**: Sistema de autenticação moderno e seguro
- **Como funciona**: Após o login, o sistema gera um "token" (uma chave digital) que é armazenado de forma segura no navegador
- **Vantagens**:
  - Maior segurança (cookies httpOnly não podem ser acessados por scripts maliciosos)
  - Persistência da sessão (usuário não precisa fazer login toda hora)
  - Renovação automática (sistema renova o token antes de expirar)

### Middleware de Proteção de Rotas
- **O que é**: Uma "camada de segurança" que verifica cada tentativa de acesso
- **Como funciona**: Antes de mostrar qualquer página protegida, o sistema verifica:
  1. O usuário está autenticado?
  2. O usuário tem permissão para acessar essa área?
  3. O perfil ativo corresponde à área solicitada?
- **Resultado**: Impossível acessar áreas sem permissão

### Controle de Acesso Baseado em Função (RBAC)
- **O que é**: Sistema que define quem pode ver o quê
- **Como funciona**: Cada perfil tem acesso apenas às suas áreas específicas
- **Exemplo**: Um aluno nunca consegue acessar a área administrativa

---

## 🎨 Experiência do Usuário

### Tela de Seleção de Perfil
Quando um usuário com múltiplos perfis faz login, ele vê:
- **Cards grandes e coloridos** para cada perfil disponível
- **Ícones intuitivos** representando cada papel
- **Descrições claras** do que cada área oferece
- **Design responsivo** que funciona em celular, tablet e desktop

### Menu de Troca de Perfil
No canto superior direito de todas as páginas autenticadas:
- **Botão com o perfil atual** mostrando qual papel está ativo
- **Dropdown elegante** para trocar entre perfis
- **Indicador visual** (check verde) no perfil atual
- **Redirecionamento automático** para a área correspondente após a troca

### Páginas de Login Específicas
Para facilitar o acesso direto:
- `/login` - Login geral
- `/login/admin` - Login para administradores
- `/login/professor` - Login para professores
- `/login/aluno` - Login para alunos
- `/login/responsaveis` - Login para famílias

---

## 🛠️ Tecnologias Utilizadas

### Frontend (Interface)
- **Next.js 16** - Framework React moderno para aplicações web rápidas
- **TypeScript** - Código mais seguro e com menos erros
- **Tailwind CSS** - Design moderno e responsivo
- **Zustand** - Gerenciamento de estado global da aplicação
- **Headless UI** - Componentes acessíveis e elegantes

### Autenticação
- **JWT (JSON Web Tokens)** - Padrão industrial para autenticação
- **Cookies httpOnly** - Armazenamento seguro de tokens
- **jwt-decode** - Decodificação segura de tokens no cliente

---

## 📱 Funcionalidades Implementadas

### ✅ Sistema de Login
- Login com email e senha
- Validação de credenciais
- Mensagens de erro amigáveis
- Redirecionamento inteligente baseado no perfil

### ✅ Gerenciamento de Sessão
- Tokens JWT armazenados em cookies seguros
- Renovação automática de tokens
- Logout seguro em todas as abas
- Persistência de sessão entre recarregamentos

### ✅ Múltiplos Perfis
- Detecção automática de perfis disponíveis
- Tela de seleção de perfil elegante
- Troca de perfil sem novo login
- Sincronização do perfil ativo

### ✅ Proteção de Rotas
- Middleware que valida todas as requisições
- Redirecionamento automático para login se não autenticado
- Bloqueio de acesso a áreas sem permissão
- Páginas públicas acessíveis sem login

### ✅ Dashboards Personalizados
- Dashboard específico para cada tipo de usuário
- Interface adaptada às necessidades de cada perfil
- Navegação intuitiva
- Design consistente entre todas as áreas

### ✅ SEO Otimizado
- Metadados completos para motores de busca
- Sitemap.xml gerado automaticamente
- Robots.txt configurado
- Schema.org para rich snippets
- Open Graph para compartilhamento em redes sociais
- PWA (Progressive Web App) pronto

---

## ✅ Sistema Completo e Integrado

### Backend Totalmente Integrado
O sistema está **totalmente integrado** com o backend NestJS. Todos os endpoints estão funcionando:
- `POST /auth/login` - Autenticação de usuário ✅
- `POST /auth/public-register` - Registro público ✅
- `GET /auth/profile` - Obter dados do perfil ✅
- `POST /auth/refresh` - Renovar token ✅
- `POST /auth/logout` - Encerrar sessão ✅

### 40+ Módulos Backend Implementados
- Autenticação e autorização
- Gestão de usuários e perfis
- Estrutura acadêmica completa
- Sistema de avaliações (SAEB/IDEB)
- Banco de questões
- Gamificação e rankings
- Notificações em tempo real
- E muito mais...

---

## 📞 Suporte

Para dúvidas ou sugestões sobre o sistema, entre em contato com a equipe de desenvolvimento.

---

**Desenvolvido com ❤️ para transformar a educação**

*Grafos - Plataforma Educacional © 2025*
*Última atualização: 18 de Janeiro de 2025*
*Status: Sistema 75% completo e totalmente funcional*
