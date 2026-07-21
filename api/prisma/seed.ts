import { PrismaClient, UserRole, Gender, AcademicPeriodType, DayOfWeek } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed for Colégio Santa Cruz...\n');

  const hashedPassword = await bcrypt.hash('senha123', 10);

  // ==================== INSTITUIÇÃO ====================
  console.log('📚 Creating institution...');
  const institution = await prisma.institution.upsert({
    where: { slug: 'santa-cruz' },
    update: {},
    create: {
      name: 'Colégio Santa Cruz',
      slug: 'santa-cruz',
      email: 'contato@colegiosantacruz.edu.br',
      phone: '(11) 3845-2100',
      address: 'Rua Santa Cruz, 500',
      city: 'São Paulo',
      state: 'SP',
      country: 'BR',
      zipCode: '04122-000',
      isActive: true,
    },
  });
  console.log(`✅ Institution: ${institution.name}\n`);

  // ==================== ADMINISTRADORES ====================
  console.log('🔐 Creating administrators...');
  const superAdminUser = await prisma.user.upsert({
    where: {
      unique_email_per_institution: {
        email: 'admin@grafoseducacional.com.br',
        institutionId: institution.id,
      }
    },
    update: {},
    create: {
      email: 'admin@grafoseducacional.com.br',
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      name: 'Administrador Sistema',
      firstName: 'Administrador',
      lastName: 'Sistema',
      cpf: '000.000.000-00',
      phone: '(11) 99999-0000',
      birthDate: new Date('1980-01-01'),
      gender: Gender.MALE,
      isActive: true,
      emailVerified: true,
      institutionId: institution.id,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: {
      unique_email_per_institution: {
        email: 'diretor@colegiosantacruz.edu.br',
        institutionId: institution.id,
      }
    },
    update: {},
    create: {
      email: 'diretor@colegiosantacruz.edu.br',
      password: hashedPassword,
      role: UserRole.INSTITUTION_ADMIN,
      name: 'Roberto Mendes Silva',
      firstName: 'Roberto',
      lastName: 'Mendes Silva',
      cpf: '123.456.789-00',
      phone: '(11) 98765-4321',
      birthDate: new Date('1975-03-15'),
      gender: Gender.MALE,
      isActive: true,
      emailVerified: true,
      institutionId: institution.id,
    },
  });

  const coordUser = await prisma.user.upsert({
    where: {
      unique_email_per_institution: {
        email: 'coordenacao@colegiosantacruz.edu.br',
        institutionId: institution.id,
      }
    },
    update: {},
    create: {
      email: 'coordenacao@colegiosantacruz.edu.br',
      password: hashedPassword,
      role: UserRole.COORDINATOR,
      name: 'Ana Paula Ferreira',
      firstName: 'Ana Paula',
      lastName: 'Ferreira',
      cpf: '234.567.890-11',
      phone: '(11) 98765-1234',
      birthDate: new Date('1982-07-20'),
      gender: Gender.FEMALE,
      isActive: true,
      emailVerified: true,
      institutionId: institution.id,
    },
  });
  console.log(`✅ Administrators created\n`);

  // ==================== PROFESSORES ====================
  console.log('👨‍🏫 Creating teachers...');

  const teachersData = [
    { name: 'Carlos Eduardo Santos', email: 'carlos.santos@colegiosantacruz.edu.br', specialization: 'Matemática', degree: 'Licenciatura em Matemática', cpf: '345.678.901-22', gender: Gender.MALE, birthDate: '1985-03-15' },
    { name: 'Mariana Costa Silva', email: 'mariana.costa@colegiosantacruz.edu.br', specialization: 'Português e Literatura', degree: 'Licenciatura em Letras', cpf: '456.789.012-33', gender: Gender.FEMALE, birthDate: '1988-06-22' },
    { name: 'Roberto Alves Lima', email: 'roberto.lima@colegiosantacruz.edu.br', specialization: 'História', degree: 'Licenciatura em História', cpf: '567.890.123-44', gender: Gender.MALE, birthDate: '1983-11-10' },
    { name: 'Juliana Martins Souza', email: 'juliana.souza@colegiosantacruz.edu.br', specialization: 'Geografia', degree: 'Licenciatura em Geografia', cpf: '678.901.234-55', gender: Gender.FEMALE, birthDate: '1990-02-28' },
    { name: 'Fernando Oliveira Rocha', email: 'fernando.rocha@colegiosantacruz.edu.br', specialization: 'Ciências e Biologia', degree: 'Licenciatura em Ciências Biológicas', cpf: '789.012.345-66', gender: Gender.MALE, birthDate: '1986-09-05' },
    { name: 'Patricia Andrade Costa', email: 'patricia.costa@colegiosantacruz.edu.br', specialization: 'Inglês', degree: 'Licenciatura em Letras - Inglês', cpf: '890.123.456-77', gender: Gender.FEMALE, birthDate: '1991-04-18' },
    { name: 'Ricardo Mendes Barbosa', email: 'ricardo.barbosa@colegiosantacruz.edu.br', specialization: 'Educação Física', degree: 'Licenciatura em Educação Física', cpf: '901.234.567-88', gender: Gender.MALE, birthDate: '1987-12-08' },
    { name: 'Camila Rodrigues Pinto', email: 'camila.pinto@colegiosantacruz.edu.br', specialization: 'Artes', degree: 'Licenciatura em Artes Visuais', cpf: '012.345.678-99', gender: Gender.FEMALE, birthDate: '1992-05-30' },
    { name: 'André Luiz Cardoso', email: 'andre.cardoso@colegiosantacruz.edu.br', specialization: 'Matemática', degree: 'Licenciatura em Matemática', cpf: '123.456.780-00', gender: Gender.MALE, birthDate: '1984-08-14' },
    { name: 'Beatriz Fernandes Lima', email: 'beatriz.lima@colegiosantacruz.edu.br', specialization: 'Português e Literatura', degree: 'Licenciatura em Letras', cpf: '234.567.801-11', gender: Gender.FEMALE, birthDate: '1989-01-25' },
    { name: 'Paulo Henrique Dias', email: 'paulo.dias@colegiosantacruz.edu.br', specialization: 'História e Geografia', degree: 'Licenciatura em História', cpf: '345.678.012-22', gender: Gender.MALE, birthDate: '1981-10-12' },
    { name: 'Luciana Ribeiro Santos', email: 'luciana.santos@colegiosantacruz.edu.br', specialization: 'Ciências', degree: 'Licenciatura em Ciências', cpf: '456.789.123-33', gender: Gender.FEMALE, birthDate: '1993-07-07' },
  ];

  const teachers: any[] = [];
  for (let i = 0; i < teachersData.length; i++) {
    const data = teachersData[i];
    const teacherUser = await prisma.user.upsert({
      where: {
        unique_email_per_institution: {
          email: data.email,
          institutionId: institution.id,
        }
      },
      update: {},
      create: {
        email: data.email,
        password: hashedPassword,
        role: UserRole.TEACHER,
        name: data.name,
        firstName: data.name.split(' ')[0],
        lastName: data.name.split(' ').slice(1).join(' '),
        cpf: data.cpf,
        phone: `(11) 9${8000 + i}${1000 + i * 10}`,
        birthDate: new Date(data.birthDate),
        gender: data.gender,
        isActive: true,
        emailVerified: true,
        institutionId: institution.id,
      },
    });

    const teacherProfile = await prisma.teacher.upsert({
      where: { userId: teacherUser.id },
      update: {},
      create: {
        userId: teacherUser.id,
        specialization: data.specialization,
        degree: data.degree,
        registrationNumber: `PROF-2024-${String(i + 1).padStart(3, '0')}`,
        hireDate: new Date('2024-01-01'),
        isActive: true,
      },
    });

    teachers.push({ user: teacherUser, profile: teacherProfile, ...data });
  }
  console.log(`✅ ${teachers.length} teachers created\n`);

  // ==================== ANO LETIVO E PERÍODOS ====================
  console.log('📅 Creating academic year and periods...');
  const academicYear = await prisma.academicYear.upsert({
    where: {
      institutionId_year: {
        institutionId: institution.id,
        year: 2024,
      },
    },
    update: {},
    create: {
      year: 2024,
      name: '2024',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-12-20'),
      isActive: true,
      institutionId: institution.id,
    },
  });

  const periods = [
    { name: '1º Bimestre', type: AcademicPeriodType.BIMESTER, startDate: new Date('2024-02-01'), endDate: new Date('2024-04-15'), orderNumber: 1 },
    { name: '2º Bimestre', type: AcademicPeriodType.BIMESTER, startDate: new Date('2024-04-16'), endDate: new Date('2024-06-30'), orderNumber: 2 },
    { name: '3º Bimestre', type: AcademicPeriodType.BIMESTER, startDate: new Date('2024-07-15'), endDate: new Date('2024-09-30'), orderNumber: 3 },
    { name: '4º Bimestre', type: AcademicPeriodType.BIMESTER, startDate: new Date('2024-10-01'), endDate: new Date('2024-12-20'), orderNumber: 4 },
  ];

  for (const periodData of periods) {
    await prisma.academicPeriod.upsert({
      where: {
        academicYearId_orderNumber: {
          academicYearId: academicYear.id,
          orderNumber: periodData.orderNumber,
        },
      },
      update: {},
      create: {
        ...periodData,
        academicYearId: academicYear.id,
        isActive: true,
      },
    });
  }
  console.log(`✅ Academic year 2024 with 4 bimesters created\n`);

  // ==================== CURSO ====================
  console.log('🎓 Creating course...');
  let course = await prisma.course.findFirst({
    where: {
      institutionId: institution.id,
      code: 'EF2',
    },
  });

  if (!course) {
    course = await prisma.course.create({
      data: {
        name: 'Ensino Fundamental II',
        description: 'Ensino Fundamental do 6º ao 9º ano',
        code: 'EF2',
        level: 'Fundamental',
        duration: 4,
        isActive: true,
        institutionId: institution.id,
      },
    });
  }
  console.log(`✅ Course: ${course.name}\n`);

  // ==================== DISCIPLINAS ====================
  console.log('📚 Creating subjects...');
  const subjectsData = [
    { name: 'Matemática', code: 'MAT', description: 'Matemática', color: '#3B82F6' },
    { name: 'Português', code: 'PORT', description: 'Língua Portuguesa e Literatura', color: '#EF4444' },
    { name: 'História', code: 'HIST', description: 'História', color: '#F59E0B' },
    { name: 'Geografia', code: 'GEO', description: 'Geografia', color: '#10B981' },
    { name: 'Ciências', code: 'CIEN', description: 'Ciências', color: '#8B5CF6' },
    { name: 'Inglês', code: 'ING', description: 'Língua Inglesa', color: '#EC4899' },
    { name: 'Educação Física', code: 'ED_FIS', description: 'Educação Física', color: '#06B6D4' },
    { name: 'Artes', code: 'ARTES', description: 'Artes Visuais', color: '#F97316' },
  ];

  const subjects: any[] = [];
  for (const subjectData of subjectsData) {
    let subject = await prisma.subject.findFirst({
      where: {
        institutionId: institution.id,
        code: subjectData.code,
      },
    });

    if (!subject) {
      subject = await prisma.subject.create({
        data: {
          ...subjectData,
          isActive: true,
          institutionId: institution.id,
        },
      });
    }
    subjects.push(subject);
  }
  console.log(`✅ ${subjects.length} subjects created\n`);

  // ==================== TURMAS ====================
  console.log('👥 Creating classes...');
  const classesData = [
    { name: '6º Ano A', grade: '6º Ano', section: 'A', shift: 'Matutino', maxStudents: 35 },
    { name: '6º Ano B', grade: '6º Ano', section: 'B', shift: 'Vespertino', maxStudents: 35 },
    { name: '7º Ano A', grade: '7º Ano', section: 'A', shift: 'Matutino', maxStudents: 35 },
    { name: '7º Ano B', grade: '7º Ano', section: 'B', shift: 'Vespertino', maxStudents: 35 },
    { name: '8º Ano A', grade: '8º Ano', section: 'A', shift: 'Matutino', maxStudents: 30 },
    { name: '8º Ano B', grade: '8º Ano', section: 'B', shift: 'Vespertino', maxStudents: 30 },
    { name: '9º Ano A', grade: '9º Ano', section: 'A', shift: 'Matutino', maxStudents: 30 },
    { name: '9º Ano B', grade: '9º Ano', section: 'B', shift: 'Vespertino', maxStudents: 30 },
  ];

  const classes: any[] = [];
  for (const classData of classesData) {
    let classObj = await prisma.class.findFirst({
      where: {
        institutionId: institution.id,
        academicYearId: academicYear.id,
        name: classData.name,
      },
    });

    if (!classObj) {
      classObj = await prisma.class.create({
        data: {
          ...classData,
          isActive: true,
          institutionId: institution.id,
          courseId: course.id,
          academicYearId: academicYear.id,
        },
      });
    }
    classes.push(classObj);
  }
  console.log(`✅ ${classes.length} classes created\n`);

  // ==================== ALUNOS E RESPONSÁVEIS ====================
  console.log('🎓 Creating students and parents...');

  const firstNames = {
    male: ['João', 'Pedro', 'Lucas', 'Gabriel', 'Rafael', 'Felipe', 'Bruno', 'André', 'Thiago', 'Guilherme', 'Mateus', 'Leonardo', 'Diego', 'Vinicius', 'Rodrigo'],
    female: ['Maria', 'Ana', 'Beatriz', 'Larissa', 'Juliana', 'Carolina', 'Fernanda', 'Camila', 'Amanda', 'Isabela', 'Gabriela', 'Leticia', 'Mariana', 'Patricia', 'Raquel']
  };

  const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Ferreira', 'Costa', 'Rodrigues', 'Almeida', 'Nascimento', 'Pereira', 'Carvalho', 'Araújo', 'Ribeiro', 'Martins', 'Rocha', 'Barbosa', 'Cardoso', 'Dias', 'Mendes'];

  let studentCount = 0;
  let parentCount = 0;

  for (let classIndex = 0; classIndex < classes.length; classIndex++) {
    const classObj = classes[classIndex];
    const studentsPerClass = classIndex < 4 ? 15 : 12; // 6º e 7º: 15 alunos, 8º e 9º: 12 alunos

    for (let i = 0; i < studentsPerClass; i++) {
      studentCount++;
      const gender = Math.random() > 0.5 ? Gender.MALE : Gender.FEMALE;
      const firstName = gender === Gender.MALE
        ? firstNames.male[Math.floor(Math.random() * firstNames.male.length)]
        : firstNames.female[Math.floor(Math.random() * firstNames.female.length)];
      const lastName1 = lastNames[Math.floor(Math.random() * lastNames.length)];
      const lastName2 = lastNames[Math.floor(Math.random() * lastNames.length)];
      const fullName = `${firstName} ${lastName1} ${lastName2}`;

      const birthYear = classIndex < 2 ? 2012 : classIndex < 4 ? 2011 : classIndex < 6 ? 2010 : 2009;
      const birthMonth = Math.floor(Math.random() * 12) + 1;
      const birthDay = Math.floor(Math.random() * 28) + 1;

      const studentUser = await prisma.user.upsert({
        where: {
          unique_email_per_institution: {
            email: `aluno${studentCount}@colegiosantacruz.edu.br`,
            institutionId: institution.id,
          }
        },
        update: {},
        create: {
          email: `aluno${studentCount}@colegiosantacruz.edu.br`,
          password: hashedPassword,
          role: UserRole.STUDENT,
          name: fullName,
          firstName: firstName,
          lastName: `${lastName1} ${lastName2}`,
          cpf: `${String(studentCount).padStart(3, '0')}.${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}.${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}-${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`,
          phone: `(11) 9${7000 + studentCount}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
          birthDate: new Date(birthYear, birthMonth - 1, birthDay),
          gender: gender,
          isActive: true,
          emailVerified: true,
          institutionId: institution.id,
        },
      });

      const studentProfile = await prisma.student.upsert({
        where: { userId: studentUser.id },
        update: {},
        create: {
          userId: studentUser.id,
          registrationNumber: `ALU-2024-${String(studentCount).padStart(4, '0')}`,
          enrollmentNumber: `2024${String(studentCount).padStart(4, '0')}`,
          enrollmentDate: new Date('2024-02-01'),
          isActive: true,
        },
      });

      // Matricular aluno na turma
      await prisma.classEnrollment.upsert({
        where: {
          classId_studentId: {
            classId: classObj.id,
            studentId: studentProfile.id,
          },
        },
        update: {},
        create: {
          classId: classObj.id,
          studentId: studentProfile.id,
          enrollmentDate: new Date('2024-02-01'),
          isActive: true,
        },
      });

      // Criar responsável para o aluno
      parentCount++;
      const parentGender = Math.random() > 0.5 ? Gender.MALE : Gender.FEMALE;
      const parentFirstName = parentGender === Gender.MALE
        ? ['Carlos', 'Roberto', 'José', 'Paulo', 'Fernando', 'Ricardo', 'Marcos'][Math.floor(Math.random() * 7)]
        : ['Maria', 'Ana', 'Sandra', 'Patricia', 'Claudia', 'Marcia', 'Silvia'][Math.floor(Math.random() * 7)];
      const parentFullName = `${parentFirstName} ${lastName1} ${lastName2}`;

      const parentUser = await prisma.user.upsert({
        where: {
          unique_email_per_institution: {
            email: `responsavel${parentCount}@email.com`,
            institutionId: institution.id,
          }
        },
        update: {},
        create: {
          email: `responsavel${parentCount}@email.com`,
          password: hashedPassword,
          role: UserRole.PARENT,
          name: parentFullName,
          firstName: parentFirstName,
          lastName: `${lastName1} ${lastName2}`,
          cpf: `${String(parentCount + 500).padStart(3, '0')}.${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}.${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}-${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`,
          phone: `(11) 9${6000 + parentCount}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
          birthDate: new Date(1975 + Math.floor(Math.random() * 20), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          gender: parentGender,
          isActive: true,
          emailVerified: true,
          institutionId: institution.id,
        },
      });

      const parentProfile = await prisma.parent.upsert({
        where: { userId: parentUser.id },
        update: {},
        create: {
          userId: parentUser.id,
          occupation: ['Engenheiro', 'Médico', 'Advogado', 'Professor', 'Empresário', 'Comerciante', 'Contador'][Math.floor(Math.random() * 7)],
          isActive: true,
        },
      });

      // Vincular responsável ao aluno
      await prisma.studentParent.upsert({
        where: {
          studentId_parentId: {
            studentId: studentProfile.id,
            parentId: parentProfile.id,
          },
        },
        update: {},
        create: {
          studentId: studentProfile.id,
          parentId: parentProfile.id,
          relationship: parentGender === Gender.MALE ? 'Pai' : 'Mãe',
          isPrimary: true,
        },
      });
    }
  }
  console.log(`✅ ${studentCount} students and ${parentCount} parents created\n`);

  // ==================== ATRIBUIÇÕES DE DISCIPLINAS ====================
  console.log('📖 Assigning subjects to teachers in classes...');

  // Mapear professores por especialização
  const mathTeachers = teachers.filter(t => t.specialization.includes('Matemática'));
  const portugueseTeachers = teachers.filter(t => t.specialization.includes('Português'));
  const historyTeachers = teachers.filter(t => t.specialization.includes('História'));
  const geographyTeachers = teachers.filter(t => t.specialization.includes('Geografia'));
  const scienceTeachers = teachers.filter(t => t.specialization.includes('Ciências'));
  const englishTeachers = teachers.filter(t => t.specialization.includes('Inglês'));
  const peTeachers = teachers.filter(t => t.specialization.includes('Educação Física'));
  const artTeachers = teachers.filter(t => t.specialization.includes('Artes'));

  let assignmentCount = 0;

  for (const classObj of classes) {
    // Atribuir todas as disciplinas para cada turma
    const assignments = [
      { subject: subjects[0], teacher: mathTeachers[assignmentCount % mathTeachers.length], hours: 5 }, // Matemática
      { subject: subjects[1], teacher: portugueseTeachers[assignmentCount % portugueseTeachers.length], hours: 5 }, // Português
      { subject: subjects[2], teacher: historyTeachers[assignmentCount % historyTeachers.length], hours: 3 }, // História
      { subject: subjects[3], teacher: geographyTeachers[assignmentCount % geographyTeachers.length], hours: 3 }, // Geografia
      { subject: subjects[4], teacher: scienceTeachers[assignmentCount % scienceTeachers.length], hours: 4 }, // Ciências
      { subject: subjects[5], teacher: englishTeachers[assignmentCount % englishTeachers.length], hours: 2 }, // Inglês
      { subject: subjects[6], teacher: peTeachers[assignmentCount % peTeachers.length], hours: 2 }, // Ed. Física
      { subject: subjects[7], teacher: artTeachers[assignmentCount % artTeachers.length], hours: 2 }, // Artes
    ];

    for (const assignment of assignments) {
      await prisma.classSubject.upsert({
        where: {
          classId_subjectId: {
            classId: classObj.id,
            subjectId: assignment.subject.id,
          },
        },
        update: {},
        create: {
          classId: classObj.id,
          subjectId: assignment.subject.id,
          teacherId: assignment.teacher.profile.id,
          weeklyHours: assignment.hours,
        },
      });
    }
    assignmentCount++;
  }
  console.log(`✅ Subjects assigned to all ${classes.length} classes\n`);

  // ==================== CATEGORIAS DE QUESTÕES ====================
  console.log('📁 Creating question categories...');

  const categoriesData = [
    // Matemática
    { subject: subjects[0], name: 'Álgebra', description: 'Expressões algébricas, equações e inequações', color: '#3B82F6' },
    { subject: subjects[0], name: 'Geometria', description: 'Formas geométricas, áreas e volumes', color: '#8B5CF6' },
    { subject: subjects[0], name: 'Frações e Números', description: 'Operações com frações, decimais e porcentagens', color: '#06B6D4' },
    { subject: subjects[0], name: 'Raciocínio Lógico', description: 'Problemas de lógica e raciocínio', color: '#10B981' },

    // Português
    { subject: subjects[1], name: 'Gramática', description: 'Classes de palavras, sintaxe e morfologia', color: '#EF4444' },
    { subject: subjects[1], name: 'Interpretação de Texto', description: 'Compreensão e análise textual', color: '#F59E0B' },
    { subject: subjects[1], name: 'Literatura', description: 'Obras literárias e movimentos', color: '#EC4899' },

    // História
    { subject: subjects[2], name: 'História do Brasil', description: 'História do Brasil colonial ao contemporâneo', color: '#F59E0B' },
    { subject: subjects[2], name: 'História Geral', description: 'História mundial e civilizações', color: '#84CC16' },

    // Geografia
    { subject: subjects[3], name: 'Geografia Física', description: 'Relevo, clima, vegetação e hidrografia', color: '#10B981' },
    { subject: subjects[3], name: 'Geografia Humana', description: 'População, economia e urbanização', color: '#14B8A6' },

    // Ciências
    { subject: subjects[4], name: 'Biologia', description: 'Seres vivos, ecologia e corpo humano', color: '#8B5CF6' },
    { subject: subjects[4], name: 'Física', description: 'Mecânica, energia e movimento', color: '#6366F1' },
    { subject: subjects[4], name: 'Química', description: 'Substâncias, reações e propriedades', color: '#A855F7' },
  ];

  const questionCategories: any[] = [];
  for (const catData of categoriesData) {
    const category = await prisma.questionCategory.create({
      data: {
        name: catData.name,
        description: catData.description,
        color: catData.color,
        isActive: true,
        institutionId: institution.id,
        subjectId: catData.subject.id,
      },
    });
    questionCategories.push({ ...category, subject: catData.subject });
  }
  console.log(`✅ ${questionCategories.length} question categories created\n`);

  // ==================== BANCO DE QUESTÕES ====================
  console.log('❓ Creating questions...');

  const questionsData = [
    // MATEMÁTICA - Álgebra
    {
      title: 'Expressão Algébrica Simples',
      type: 'MULTIPLE_CHOICE',
      difficulty: 'EASY',
      statement: 'Qual é o valor de 2x + 5, quando x = 3?',
      correctAnswer: 'B',
      points: 1.0,
      subject: subjects[0],
      category: questionCategories.find(c => c.name === 'Álgebra'),
      tags: ['álgebra', 'expressões', 'básico'],
      options: [
        { letter: 'A', text: '8', order: 1 },
        { letter: 'B', text: '11', order: 2 },
        { letter: 'C', text: '13', order: 3 },
        { letter: 'D', text: '16', order: 4 },
      ],
    },
    {
      title: 'Equação de Primeiro Grau',
      type: 'MULTIPLE_CHOICE',
      difficulty: 'MEDIUM',
      statement: 'Resolva a equação: 3x - 7 = 2x + 5. Qual é o valor de x?',
      correctAnswer: 'C',
      points: 1.5,
      subject: subjects[0],
      category: questionCategories.find(c => c.name === 'Álgebra'),
      tags: ['equação', 'primeiro grau', 'álgebra'],
      options: [
        { letter: 'A', text: 'x = 2', order: 1 },
        { letter: 'B', text: 'x = 8', order: 2 },
        { letter: 'C', text: 'x = 12', order: 3 },
        { letter: 'D', text: 'x = 15', order: 4 },
      ],
    },

    // MATEMÁTICA - Geometria
    {
      title: 'Área do Retângulo',
      type: 'MULTIPLE_CHOICE',
      difficulty: 'EASY',
      statement: 'Um retângulo tem 8 cm de comprimento e 5 cm de largura. Qual é sua área?',
      correctAnswer: 'B',
      points: 1.0,
      subject: subjects[0],
      category: questionCategories.find(c => c.name === 'Geometria'),
      tags: ['geometria', 'área', 'retângulo'],
      options: [
        { letter: 'A', text: '13 cm²', order: 1 },
        { letter: 'B', text: '40 cm²', order: 2 },
        { letter: 'C', text: '26 cm²', order: 3 },
        { letter: 'D', text: '80 cm²', order: 4 },
      ],
    },

    // MATEMÁTICA - Frações
    {
      title: 'Soma de Frações',
      type: 'MULTIPLE_CHOICE',
      difficulty: 'MEDIUM',
      statement: 'Calcule: 1/2 + 1/4 = ?',
      correctAnswer: 'A',
      points: 1.5,
      subject: subjects[0],
      category: questionCategories.find(c => c.name === 'Frações e Números'),
      tags: ['frações', 'operações', 'soma'],
      options: [
        { letter: 'A', text: '3/4', order: 1 },
        { letter: 'B', text: '2/6', order: 2 },
        { letter: 'C', text: '1/2', order: 3 },
        { letter: 'D', text: '2/4', order: 4 },
      ],
    },

    // PORTUGUÊS - Gramática
    {
      title: 'Classes Gramaticais',
      type: 'MULTIPLE_CHOICE',
      difficulty: 'EASY',
      statement: 'Na frase "O menino correu rapidamente", qual palavra é um advérbio?',
      correctAnswer: 'D',
      points: 1.0,
      subject: subjects[1],
      category: questionCategories.find(c => c.name === 'Gramática'),
      tags: ['gramática', 'advérbio', 'classes gramaticais'],
      options: [
        { letter: 'A', text: 'O', order: 1 },
        { letter: 'B', text: 'menino', order: 2 },
        { letter: 'C', text: 'correu', order: 3 },
        { letter: 'D', text: 'rapidamente', order: 4 },
      ],
    },
    {
      title: 'Acentuação Gráfica',
      type: 'MULTIPLE_CHOICE',
      difficulty: 'MEDIUM',
      statement: 'Qual alternativa apresenta todas as palavras corretamente acentuadas?',
      correctAnswer: 'A',
      points: 1.5,
      subject: subjects[1],
      category: questionCategories.find(c => c.name === 'Gramática'),
      tags: ['gramática', 'acentuação', 'ortografia'],
      options: [
        { letter: 'A', text: 'lâmpada, história, médico', order: 1 },
        { letter: 'B', text: 'lampada, historia, medico', order: 2 },
        { letter: 'C', text: 'lâmpada, historia, médico', order: 3 },
        { letter: 'D', text: 'lampada, história, medico', order: 4 },
      ],
    },

    // PORTUGUÊS - Interpretação
    {
      title: 'Interpretação de Texto',
      type: 'OPEN_ENDED',
      difficulty: 'MEDIUM',
      statement: 'Leia o texto abaixo:\n\n"A educação é a arma mais poderosa que você pode usar para mudar o mundo." - Nelson Mandela\n\nExplique, com suas palavras, o que Nelson Mandela quis dizer com essa frase.',
      answerKey: 'A resposta deve indicar que a educação é fundamental para transformar a sociedade, formar cidadãos críticos e promover mudanças positivas no mundo.',
      points: 2.0,
      subject: subjects[1],
      category: questionCategories.find(c => c.name === 'Interpretação de Texto'),
      tags: ['interpretação', 'texto', 'reflexão'],
      options: [],
    },

    // HISTÓRIA - História do Brasil
    {
      title: 'Descobrimento do Brasil',
      type: 'MULTIPLE_CHOICE',
      difficulty: 'EASY',
      statement: 'Em que ano os portugueses chegaram ao Brasil?',
      correctAnswer: 'B',
      points: 1.0,
      subject: subjects[2],
      category: questionCategories.find(c => c.name === 'História do Brasil'),
      tags: ['brasil', 'descobrimento', 'história'],
      options: [
        { letter: 'A', text: '1492', order: 1 },
        { letter: 'B', text: '1500', order: 2 },
        { letter: 'C', text: '1822', order: 3 },
        { letter: 'D', text: '1889', order: 4 },
      ],
    },
    {
      title: 'Independência do Brasil',
      type: 'MULTIPLE_CHOICE',
      difficulty: 'MEDIUM',
      statement: 'Quem proclamou a independência do Brasil?',
      correctAnswer: 'C',
      points: 1.5,
      subject: subjects[2],
      category: questionCategories.find(c => c.name === 'História do Brasil'),
      tags: ['independência', 'brasil', 'história'],
      options: [
        { letter: 'A', text: 'Tiradentes', order: 1 },
        { letter: 'B', text: 'D. João VI', order: 2 },
        { letter: 'C', text: 'D. Pedro I', order: 3 },
        { letter: 'D', text: 'Getúlio Vargas', order: 4 },
      ],
    },

    // GEOGRAFIA - Geografia Física
    {
      title: 'Camadas da Terra',
      type: 'MULTIPLE_CHOICE',
      difficulty: 'EASY',
      statement: 'Qual é a camada mais externa da Terra?',
      correctAnswer: 'A',
      points: 1.0,
      subject: subjects[3],
      category: questionCategories.find(c => c.name === 'Geografia Física'),
      tags: ['terra', 'camadas', 'geologia'],
      options: [
        { letter: 'A', text: 'Crosta', order: 1 },
        { letter: 'B', text: 'Manto', order: 2 },
        { letter: 'C', text: 'Núcleo externo', order: 3 },
        { letter: 'D', text: 'Núcleo interno', order: 4 },
      ],
    },

    // GEOGRAFIA - Geografia Humana
    {
      title: 'População Brasileira',
      type: 'MULTIPLE_CHOICE',
      difficulty: 'MEDIUM',
      statement: 'Qual é a região mais populosa do Brasil?',
      correctAnswer: 'B',
      points: 1.5,
      subject: subjects[3],
      category: questionCategories.find(c => c.name === 'Geografia Humana'),
      tags: ['brasil', 'população', 'demografia'],
      options: [
        { letter: 'A', text: 'Norte', order: 1 },
        { letter: 'B', text: 'Sudeste', order: 2 },
        { letter: 'C', text: 'Sul', order: 3 },
        { letter: 'D', text: 'Centro-Oeste', order: 4 },
      ],
    },

    // CIÊNCIAS - Biologia
    {
      title: 'Fotossíntese',
      type: 'MULTIPLE_CHOICE',
      difficulty: 'MEDIUM',
      statement: 'Qual é o gás liberado pelas plantas durante a fotossíntese?',
      correctAnswer: 'B',
      points: 1.5,
      subject: subjects[4],
      category: questionCategories.find(c => c.name === 'Biologia'),
      tags: ['fotossíntese', 'plantas', 'biologia'],
      options: [
        { letter: 'A', text: 'Gás carbônico', order: 1 },
        { letter: 'B', text: 'Oxigênio', order: 2 },
        { letter: 'C', text: 'Nitrogênio', order: 3 },
        { letter: 'D', text: 'Hidrogênio', order: 4 },
      ],
    },
    {
      title: 'Sistema Digestivo',
      type: 'OPEN_ENDED',
      difficulty: 'MEDIUM',
      statement: 'Descreva a função do estômago no processo de digestão.',
      answerKey: 'O estômago é responsável por armazenar os alimentos e iniciar a digestão de proteínas através do suco gástrico, que contém ácido clorídrico e enzimas digestivas.',
      points: 2.0,
      subject: subjects[4],
      category: questionCategories.find(c => c.name === 'Biologia'),
      tags: ['digestão', 'corpo humano', 'estômago'],
      options: [],
    },

    // CIÊNCIAS - Física
    {
      title: 'Estados Físicos da Matéria',
      type: 'MULTIPLE_CHOICE',
      difficulty: 'EASY',
      statement: 'Quais são os três principais estados físicos da matéria?',
      correctAnswer: 'A',
      points: 1.0,
      subject: subjects[4],
      category: questionCategories.find(c => c.name === 'Física'),
      tags: ['matéria', 'estados físicos', 'física'],
      options: [
        { letter: 'A', text: 'Sólido, líquido e gasoso', order: 1 },
        { letter: 'B', text: 'Duro, mole e macio', order: 2 },
        { letter: 'C', text: 'Quente, frio e morno', order: 3 },
        { letter: 'D', text: 'Grande, médio e pequeno', order: 4 },
      ],
    },

    // CIÊNCIAS - Química
    {
      title: 'Água',
      type: 'MULTIPLE_CHOICE',
      difficulty: 'EASY',
      statement: 'Qual é a fórmula química da água?',
      correctAnswer: 'C',
      points: 1.0,
      subject: subjects[4],
      category: questionCategories.find(c => c.name === 'Química'),
      tags: ['química', 'água', 'fórmulas'],
      options: [
        { letter: 'A', text: 'H₂O₂', order: 1 },
        { letter: 'B', text: 'CO₂', order: 2 },
        { letter: 'C', text: 'H₂O', order: 3 },
        { letter: 'D', text: 'O₂', order: 4 },
      ],
    },

    // MATEMÁTICA - Raciocínio Lógico
    {
      title: 'Sequência Numérica',
      type: 'MULTIPLE_CHOICE',
      difficulty: 'MEDIUM',
      statement: 'Complete a sequência: 2, 4, 8, 16, ___',
      correctAnswer: 'D',
      points: 1.5,
      subject: subjects[0],
      category: questionCategories.find(c => c.name === 'Raciocínio Lógico'),
      tags: ['sequência', 'lógica', 'matemática'],
      options: [
        { letter: 'A', text: '18', order: 1 },
        { letter: 'B', text: '24', order: 2 },
        { letter: 'C', text: '20', order: 3 },
        { letter: 'D', text: '32', order: 4 },
      ],
    },

    // PORTUGUÊS - Literatura
    {
      title: 'Gêneros Literários',
      type: 'MULTIPLE_CHOICE',
      difficulty: 'MEDIUM',
      statement: 'Qual é o gênero literário que conta histórias imaginárias em prosa?',
      correctAnswer: 'B',
      points: 1.5,
      subject: subjects[1],
      category: questionCategories.find(c => c.name === 'Literatura'),
      tags: ['literatura', 'gêneros', 'narrativa'],
      options: [
        { letter: 'A', text: 'Poesia', order: 1 },
        { letter: 'B', text: 'Narrativa', order: 2 },
        { letter: 'C', text: 'Teatro', order: 3 },
        { letter: 'D', text: 'Crônica', order: 4 },
      ],
    },

    // HISTÓRIA - História Geral
    {
      title: 'Idade Média',
      type: 'MULTIPLE_CHOICE',
      difficulty: 'HARD',
      statement: 'Qual era o sistema econômico predominante na Europa durante a Idade Média?',
      correctAnswer: 'C',
      points: 2.0,
      subject: subjects[2],
      category: questionCategories.find(c => c.name === 'História Geral'),
      tags: ['idade média', 'feudalismo', 'europa'],
      options: [
        { letter: 'A', text: 'Capitalismo', order: 1 },
        { letter: 'B', text: 'Socialismo', order: 2 },
        { letter: 'C', text: 'Feudalismo', order: 3 },
        { letter: 'D', text: 'Mercantilismo', order: 4 },
      ],
    },
  ];

  let questionCount = 0;
  for (const qData of questionsData) {
    const question = await prisma.question.create({
      data: {
        title: qData.title,
        type: qData.type as any,
        difficulty: qData.difficulty as any,
        statement: qData.statement,
        correctAnswer: qData.correctAnswer,
        answerKey: qData.answerKey,
        points: qData.points,
        tags: qData.tags,
        isPublic: false,
        isActive: true,
        institutionId: institution.id,
        subjectId: qData.subject.id,
        categoryId: qData.category?.id,
        createdById: superAdminUser.id,
      },
    });

    // Criar opções para questões de múltipla escolha
    if (qData.options && qData.options.length > 0) {
      for (const optData of qData.options) {
        await prisma.questionOption.create({
          data: {
            questionId: question.id,
            optionLetter: optData.letter,
            text: optData.text,
            orderNumber: optData.order,
          },
        });
      }
    }

    questionCount++;
  }

  console.log(`✅ ${questionCount} questions created with options\n`);

  console.log('✨ Seed completed successfully!\n');
  console.log('=' .repeat(70));
  console.log('📋 CREDENCIAIS DE ACESSO - COLÉGIO SANTA CRUZ');
  console.log('=' .repeat(70));
  console.log('');
  console.log('🔐 SUPER ADMIN:');
  console.log('   Email: admin@grafoseducacional.com.br');
  console.log('   Senha: senha123');
  console.log('');
  console.log('👤 DIRETOR:');
  console.log('   Email: diretor@colegiosantacruz.edu.br');
  console.log('   Senha: senha123');
  console.log('');
  console.log('👔 COORDENADOR:');
  console.log('   Email: coordenacao@colegiosantacruz.edu.br');
  console.log('   Senha: senha123');
  console.log('');
  console.log('👨‍🏫 PROFESSORES:');
  console.log('   Email: carlos.santos@colegiosantacruz.edu.br (e outros)');
  console.log('   Senha: senha123');
  console.log('');
  console.log('🎓 ALUNOS:');
  console.log('   Email: aluno1@colegiosantacruz.edu.br até aluno' + studentCount + '@colegiosantacruz.edu.br');
  console.log('   Senha: senha123');
  console.log('');
  console.log('👨‍👩‍👧 RESPONSÁVEIS:');
  console.log('   Email: responsavel1@email.com até responsavel' + parentCount + '@email.com');
  console.log('   Senha: senha123');
  console.log('');
  console.log('=' .repeat(70));
  console.log('📊 ESTATÍSTICAS:');
  console.log('   • 12 Professores');
  console.log('   • 8 Turmas (6º ao 9º ano - A e B)');
  console.log('   • ' + studentCount + ' Alunos');
  console.log('   • ' + parentCount + ' Responsáveis');
  console.log('   • 8 Disciplinas');
  console.log('=' .repeat(70));
  console.log('');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
