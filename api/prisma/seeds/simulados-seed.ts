import { PrismaClient, QuestionType, QuestionDifficulty, ExamType, ExamStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSimulados() {
  console.log('🎯 Iniciando seed de Simulados SAEB...\n');

  // 1. Buscar instituição e professor
  const institution = await prisma.institution.findFirst();
  if (!institution) {
    console.error('❌ Nenhuma instituição encontrada. Execute o seed principal primeiro.');
    return;
  }

  const teacher = await prisma.teacher.findFirst({
    where: {
      user: {
        institutionId: institution.id,
      },
    },
    include: {
      user: true,
    },
  });
  if (!teacher) {
    console.error('❌ Nenhum professor encontrado.');
    return;
  }

  // 2. Buscar ou criar matéria de Matemática
  let mathSubject = await prisma.subject.findFirst({
    where: { name: 'Matemática', institutionId: institution.id },
  });

  if (!mathSubject) {
    mathSubject = await prisma.subject.create({
      data: {
        name: 'Matemática',
        code: 'MAT',
        description: 'Matemática - 5º ano',
        institutionId: institution.id,
      },
    });
    console.log('✅ Matéria de Matemática criada');
  }

  // 3. Criar descritores SAEB
  console.log('\n📚 Criando descritores SAEB...');
  const descriptors = [
    {
      code: 'D18',
      subject: 'Matemática',
      skill: 'Números e Operações',
      description: 'Resolver problema com números naturais, envolvendo diferentes significados da adição ou subtração',
      gradeLevel: '5º ano',
    },
    {
      code: 'D19',
      subject: 'Matemática',
      skill: 'Números e Operações',
      description: 'Resolver problema com números naturais, envolvendo diferentes significados da multiplicação ou divisão',
      gradeLevel: '5º ano',
    },
    {
      code: 'D27',
      subject: 'Matemática',
      skill: 'Tratamento da Informação',
      description: 'Ler informações e dados apresentados em tabelas',
      gradeLevel: '5º ano',
    },
  ];

  const createdDescriptors: any[] = [];
  for (const desc of descriptors) {
    const existing = await prisma.sAEBDescriptor.findFirst({
      where: { code: desc.code, subject: desc.subject },
    });

    if (!existing) {
      const created = await prisma.sAEBDescriptor.create({ data: desc });
      createdDescriptors.push(created);
      console.log(`  ✅ Descritor ${desc.code} criado`);
    } else {
      createdDescriptors.push(existing);
      console.log(`  ℹ️  Descritor ${desc.code} já existe`);
    }
  }

  // 4. Criar questões
  console.log('\n📝 Criando questões...');
  const questions = [
    {
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: QuestionDifficulty.MEDIUM,
      statement: 'Maria tinha 245 figurinhas. Ela ganhou 138 figurinhas de sua prima. Quantas figurinhas Maria tem agora?',
      correctAnswer: 'A',
      explanation: 'Soma: 245 + 138 = 383',
      saebDescriptorId: createdDescriptors[0].id,
      options: [
        { orderNumber: 1, optionLetter: 'A', text: '383 figurinhas' },
        { orderNumber: 2, optionLetter: 'B', text: '373 figurinhas' },
        { orderNumber: 3, optionLetter: 'C', text: '107 figurinhas' },
        { orderNumber: 4, optionLetter: 'D', text: '483 figurinhas' },
      ],
    },
    {
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: QuestionDifficulty.MEDIUM,
      statement: 'Uma escola tem 6 salas de aula. Em cada sala há 25 alunos. Quantos alunos há na escola?',
      correctAnswer: 'B',
      explanation: 'Multiplicação: 6 × 25 = 150',
      saebDescriptorId: createdDescriptors[1].id,
      options: [
        { orderNumber: 1, optionLetter: 'A', text: '31 alunos' },
        { orderNumber: 2, optionLetter: 'B', text: '150 alunos' },
        { orderNumber: 3, optionLetter: 'C', text: '125 alunos' },
        { orderNumber: 4, optionLetter: 'D', text: '19 alunos' },
      ],
    },
    {
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: QuestionDifficulty.EASY,
      statement: 'João tinha 480 reais. Ele gastou 125 reais comprando um livro. Com quanto dinheiro João ficou?',
      correctAnswer: 'C',
      explanation: 'Subtração: 480 - 125 = 355',
      saebDescriptorId: createdDescriptors[0].id,
      options: [
        { orderNumber: 1, optionLetter: 'A', text: '605 reais' },
        { orderNumber: 2, optionLetter: 'B', text: '365 reais' },
        { orderNumber: 3, optionLetter: 'C', text: '355 reais' },
        { orderNumber: 4, optionLetter: 'D', text: '345 reais' },
      ],
    },
    {
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: QuestionDifficulty.HARD,
      statement: 'Observe a tabela abaixo que mostra o número de livros lidos por alunos em um mês:\n\nJoão: 8 livros\nMaria: 12 livros\nPedro: 5 livros\nAna: 9 livros\n\nQual foi o total de livros lidos pelos quatro alunos?',
      correctAnswer: 'D',
      explanation: 'Soma: 8 + 12 + 5 + 9 = 34',
      saebDescriptorId: createdDescriptors[2].id,
      options: [
        { orderNumber: 1, optionLetter: 'A', text: '24 livros' },
        { orderNumber: 2, optionLetter: 'B', text: '30 livros' },
        { orderNumber: 3, optionLetter: 'C', text: '32 livros' },
        { orderNumber: 4, optionLetter: 'D', text: '34 livros' },
      ],
    },
    {
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: QuestionDifficulty.MEDIUM,
      statement: 'Um ônibus transporta 45 passageiros. Se há 8 ônibus iguais, quantos passageiros podem ser transportados no total?',
      correctAnswer: 'A',
      explanation: 'Multiplicação: 8 × 45 = 360',
      saebDescriptorId: createdDescriptors[1].id,
      options: [
        { orderNumber: 1, optionLetter: 'A', text: '360 passageiros' },
        { orderNumber: 2, optionLetter: 'B', text: '350 passageiros' },
        { orderNumber: 3, optionLetter: 'C', text: '53 passageiros' },
        { orderNumber: 4, optionLetter: 'D', text: '370 passageiros' },
      ],
    },
  ];

  const createdQuestions: any[] = [];
  for (const q of questions) {
    const question = await prisma.question.create({
      data: {
        title: q.statement.substring(0, 50), // Use first 50 chars of statement as title
        type: q.type,
        difficulty: q.difficulty,
        statement: q.statement,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        points: 1.0,
        tags: ['SAEB', 'Matemática', '5º ano'],
        isPublic: false,
        institution: {
          connect: { id: institution.id },
        },
        subject: {
          connect: { id: mathSubject.id },
        },
        saebDescriptor: {
          connect: { id: q.saebDescriptorId },
        },
        createdBy: {
          connect: { id: teacher.user.id },
        },
      },
    });

    // Criar opções
    for (const opt of q.options) {
      await prisma.questionOption.create({
        data: {
          questionId: question.id,
          optionLetter: opt.optionLetter,
          text: opt.text,
          orderNumber: opt.orderNumber,
        },
      });
    }

    createdQuestions.push(question);
    console.log(`  ✅ Questão criada: ${q.statement.slice(0, 50)}...`);
  }

  // 5. Criar simulado
  console.log('\n🎓 Criando simulado SAEB...');
  const exam = await prisma.exam.create({
    data: {
      title: 'Simulado SAEB - Matemática 5º Ano',
      description: 'Simulado preparatório para avaliação SAEB com questões de Matemática do 5º ano do Ensino Fundamental',
      type: ExamType.SAEB,
      status: ExamStatus.DRAFT,
      gradeLevel: '5º ano',
      duration: 45,
      totalPoints: 0, // Será atualizado ao adicionar questões
      institutionId: institution.id,
      subjectId: mathSubject.id,
      createdById: teacher.id,
    },
  });

  console.log(`  ✅ Simulado "${exam.title}" criado`);

  // 6. Adicionar questões ao simulado
  console.log('\n📋 Adicionando questões ao simulado...');
  let totalPoints = 0;
  for (let i = 0; i < createdQuestions.length; i++) {
    await prisma.examQuestion.create({
      data: {
        examId: exam.id,
        questionId: createdQuestions[i].id,
        orderNumber: i + 1,
        points: 1.0,
      },
    });
    totalPoints += 1.0;
    console.log(`  ✅ Questão ${i + 1} adicionada`);
  }

  // Atualizar total de pontos
  await prisma.exam.update({
    where: { id: exam.id },
    data: { totalPoints },
  });

  console.log(`\n✅ Total de ${totalPoints} pontos configurados`);

  // 7. Publicar o simulado
  console.log('\n🚀 Publicando simulado...');
  await prisma.exam.update({
    where: { id: exam.id },
    data: { status: ExamStatus.PUBLISHED },
  });
  console.log('  ✅ Simulado publicado com sucesso!');

  console.log('\n✨ Seed de Simulados concluído com sucesso!');
  console.log('\n📊 Resumo:');
  console.log(`   - ${createdDescriptors.length} descritores SAEB`);
  console.log(`   - ${createdQuestions.length} questões`);
  console.log(`   - 1 simulado SAEB publicado`);
  console.log(`\n🎯 Simulado ID: ${exam.id}`);
}

seedSimulados()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
