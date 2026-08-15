# Guia de Implantação do Sistema Grafos Educacional

> [!NOTE]
> *Se você estiver implantando uma escola do zero, siga a sequência abaixo para garantir a integridade dos dados e evitar retrabalho operacional.*

> [!IMPORTANT]
> **Atenção:** A criação inicial da instituição, seus anexos/unidades e o primeiro administrador geral é de responsabilidade da **Equipe de Desenvolvimento / Super Admin Global** (ex: Eric Victor, Johny Moreno e Wesley Martins).

---

## 🏛️ Etapa 1: Estrutura Global & Acesso Inicial
**Responsável:** *Equipe de Desenvolvimento / Super Admin Global*  
**Painel:** `/super-admin/institutions` ou `/security`

1. **Criar a Instituição:**
   - Cadastrar a escola / sede principal com nome, slug, localização e dados cadastrais.

2. **Criar o(s) Anexo(s) / Unidade(s):**
   - Cadastrar as unidades físicas ou anexos vinculados à instituição principal.

3. **Criar o primeiro `INSTITUTION_ADMIN` (Diretor Geral / Administrador Escolar):**
   - Criar a credencial de acesso do gestor principal e associá-lo à instituição e ao(s) seu(s) anexo(s).

---

## 📅 Etapa 2: Acesso e Configuração Acadêmica
**Responsável:** *`INSTITUTION_ADMIN` (Diretor / Gestor Geral)*  
**Painel:** `/admin`

4. **Entrar com o Administrador Escolar:**
   - Realizar login com as credenciais do `INSTITUTION_ADMIN`.

5. **Criar o Ano Letivo (`/admin/academic-years`):**
   - Cadastrar o ano vigente (ex: `2026`).
   - Definir as datas de início e término.
   - Configurar os períodos avaliativos (bimestres, trimestres ou semestres).
   - > [!WARNING]
     > **O Ano Letivo é o pilar central do sistema:** Sem um ano letivo ativo cadastrado, não é possível criar turmas, lançar horários ou matricular estudantes.

---

## 📚 Etapa 3: Estrutura Pedagógica, Equipe e Operação
**Responsável:** *`INSTITUTION_ADMIN` e/ou `SECRETARY` (Secretaria Escolar)*  
**Painel:** `/admin`

6. **Criar os Cursos / Níveis de Ensino (`/admin/courses`):**
   - Cadastrar as etapas de ensino (ex: *Educação Infantil, Ensino Fundamental I, Ensino Fundamental II, Ensino Médio*).

7. **Criar as Disciplinas / Matriz Curricular (`/admin/subjects`):**
   - Cadastrar os componentes curriculares (ex: *Língua Portuguesa, Matemática, História, Ciências*).

8. **Cadastrar a Equipe Escolar:**
   - 👤 **Secretários (`/admin/secretarios`):** Entram aqui para ajudar na gestão e no cadastro massivo de alunos e turmas.
   - 👤 **Coordenadores (`/admin/coordenadores`):** Acompanhamento pedagógico das turmas.
   - 👤 **Professores (`/admin/professores`):** Docentes que ministrarão as aulas.

9. **Criar as Turmas (`/admin/classes`):**
   - Criar as turmas vinculando-as ao **Curso**, ao **Ano Letivo** ativo e ao respectivo **Anexo/Unidade** (ex: *9º Ano A - Matutino - 2026*).

10. **Vincular Professores e Matriz de Horários:**
    - Associar **Professor + Disciplina + Turma**.
    - Configurar a grade de horários de aula (`/admin/teacher-schedules`).

11. **Cadastrar Alunos e Efetivar Matrículas (`/admin/alunos`):**
    - Cadastrar os dados do aluno.
    - Realizar a enturmação/matrícula na turma do ano letivo vigente.
    - Cadastrar e vincular os **Responsáveis**.

12. **Iniciar a Operação Diária:**
    - Registro de frequência diária.
    - Lançamento de notas, avaliações e planos de aula.
    - Envio de comunicados, avisos e eventos escolares.

---

## 💡 Onde entram os Secretários (`SECRETARY`) no fluxo?

> [!TIP]
> **Momento Ideal de Entrada:** Logo no início da **Etapa 3** (Passo 8), assim que o **Ano Letivo** for criado!

### Por que cadastrar a Secretaria logo após o Ano Letivo?
O **Secretário Escolar** é o responsável operacional por desafogar a Direção. Uma vez cadastrado, ele pode assumir:
* Cadastro das turmas e salas.
* Cadastro e matrícula em massa dos alunos.
* Vínculo de pais/responsáveis aos alunos.
* Emissão de declarações, históricos e fichas de matrícula.
* Apoio no cadastro de professores e atribuição de aulas.

---

## 📊 Resumo de Papéis e Responsabilidades

| Perfil | Responsabilidade Principal na Implantação |
| :--- | :--- |
| **Super Admin / Dev** | Cria a Instituição, Anexos e o primeiro `INSTITUTION_ADMIN`. |
| **Diretor (`INSTITUTION_ADMIN`)** | Cria o Ano Letivo, Cursos, Disciplinas e cadastra a equipe inicial. |
| **Secretário (`SECRETARY`)** | Cria as Turmas, cadastra Alunos, realiza Matrículas e vincula Responsáveis. |
| **Professor (`TEACHER`)** | Acessa para lançar chamadas, notas, conteúdos e planos de aula. |
| **Aluno / Responsável** | Acessa para acompanhar notas, frequência, horários e comunicados. |
