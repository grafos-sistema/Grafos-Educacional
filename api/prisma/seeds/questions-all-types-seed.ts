import { PrismaClient, QuestionType, QuestionDifficulty } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedQuestionsAllTypes() {
  console.log('🌱 Seeding questions of all types...');

  // Get first institution and user
  const institution = await prisma.institution.findFirst();
  const user = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
  });

  if (!institution || !user) {
    console.log('⚠️ No institution or user found. Skipping questions seed.');
    return;
  }

  // Get or create a category
  let category = await prisma.questionCategory.findFirst({
    where: { institutionId: institution.id },
  });

  if (!category) {
    category = await prisma.questionCategory.create({
      data: {
        name: 'Geral',
        description: 'Categoria geral',
        institutionId: institution.id,
      },
    });
  }

  // Questions data
  const questionsData = [
    // MULTIPLE_CHOICE questions
    {
      title: 'Capital do Brasil',
      statement: 'Qual é a capital do Brasil?',
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: QuestionDifficulty.EASY,
      points: 1.0,
      tags: ['Geografia', 'Brasil'],
      isPublic: true,
      explanation: 'Brasília é a capital federal do Brasil desde 1960.',
      options: [
        { text: 'São Paulo', isCorrect: false },
        { text: 'Rio de Janeiro', isCorrect: false },
        { text: 'Brasília', isCorrect: true },
        { text: 'Salvador', isCorrect: false },
      ],
    },
    {
      title: 'Fórmula da água',
      statement: 'Qual é a fórmula química da água?',
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: QuestionDifficulty.VERY_EASY,
      points: 1.0,
      tags: ['Química', 'Básico'],
      isPublic: true,
      explanation: 'A água é composta por dois átomos de hidrogênio e um de oxigênio.',
      options: [
        { text: 'H2O', isCorrect: true },
        { text: 'CO2', isCorrect: false },
        { text: 'O2', isCorrect: false },
        { text: 'H2O2', isCorrect: false },
      ],
    },
    {
      title: 'Teorema de Pitágoras',
      statement: 'Em um triângulo retângulo com catetos de 3 cm e 4 cm, qual é a medida da hipotenusa?',
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: QuestionDifficulty.MEDIUM,
      points: 2.0,
      tags: ['Matemática', 'Geometria'],
      isPublic: true,
      explanation: 'Usando o Teorema de Pitágoras: a² + b² = c², temos 3² + 4² = 9 + 16 = 25, logo c = 5 cm.',
      options: [
        { text: '3 cm', isCorrect: false },
        { text: '4 cm', isCorrect: false },
        { text: '5 cm', isCorrect: true },
        { text: '7 cm', isCorrect: false },
      ],
    },

    // TRUE_FALSE questions
    {
      title: 'Terra é plana?',
      statement: 'A Terra é plana.',
      type: QuestionType.TRUE_FALSE,
      difficulty: QuestionDifficulty.VERY_EASY,
      points: 1.0,
      tags: ['Ciências', 'Geografia'],
      isPublic: true,
      correctAnswer: 'false',
      explanation: 'A Terra é um geoide, aproximadamente esférica, não plana.',
    },
    {
      title: 'Fotossíntese e oxigênio',
      statement: 'As plantas produzem oxigênio durante o processo de fotossíntese.',
      type: QuestionType.TRUE_FALSE,
      difficulty: QuestionDifficulty.EASY,
      points: 1.0,
      tags: ['Biologia', 'Fotossíntese'],
      isPublic: true,
      correctAnswer: 'true',
      explanation: 'Durante a fotossíntese, as plantas convertem CO2 e água em glicose e oxigênio.',
    },
    {
      title: 'Velocidade da luz',
      statement: 'A velocidade da luz no vácuo é aproximadamente 300.000 km/s.',
      type: QuestionType.TRUE_FALSE,
      difficulty: QuestionDifficulty.MEDIUM,
      points: 1.0,
      tags: ['Física', 'Óptica'],
      isPublic: true,
      correctAnswer: 'true',
      explanation: 'A velocidade da luz no vácuo é exatamente 299.792,458 km/s.',
    },

    // SHORT_ANSWER questions
    {
      title: 'Autor de Dom Casmurro',
      statement: 'Quem é o autor do livro "Dom Casmurro"?',
      type: QuestionType.SHORT_ANSWER,
      difficulty: QuestionDifficulty.EASY,
      points: 1.0,
      tags: ['Literatura', 'Brasil'],
      isPublic: true,
      correctAnswer: 'Machado de Assis',
      explanation: 'Machado de Assis é considerado um dos maiores escritores brasileiros.',
    },
    {
      title: 'Maior planeta',
      statement: 'Qual é o maior planeta do Sistema Solar?',
      type: QuestionType.SHORT_ANSWER,
      difficulty: QuestionDifficulty.EASY,
      points: 1.0,
      tags: ['Astronomia', 'Sistema Solar'],
      isPublic: true,
      correctAnswer: 'Júpiter',
      explanation: 'Júpiter é o maior planeta do Sistema Solar, com mais de 300 vezes a massa da Terra.',
    },
    {
      title: 'Fórmula de Bhaskara',
      statement: 'Qual é a fórmula de Bhaskara para resolver equações do segundo grau?',
      type: QuestionType.SHORT_ANSWER,
      difficulty: QuestionDifficulty.HARD,
      points: 2.0,
      tags: ['Matemática', 'Álgebra'],
      isPublic: true,
      correctAnswer: 'x = (-b ± √(b²-4ac)) / 2a',
      explanation: 'A fórmula de Bhaskara é usada para encontrar as raízes de uma equação quadrática ax² + bx + c = 0.',
    },

    // ESSAY questions
    {
      title: 'Importância da água',
      statement: 'Explique a importância da água para a vida no planeta Terra. (mínimo 100 palavras)',
      type: QuestionType.ESSAY,
      difficulty: QuestionDifficulty.MEDIUM,
      points: 5.0,
      tags: ['Ciências', 'Meio Ambiente'],
      isPublic: true,
      explanation: 'A água é essencial para todos os seres vivos, participa de processos biológicos, regula temperatura, transporta nutrientes, etc.',
    },
    {
      title: 'Revolução Industrial',
      statement: 'Discorra sobre as principais transformações sociais e econômicas causadas pela Revolução Industrial.',
      type: QuestionType.ESSAY,
      difficulty: QuestionDifficulty.HARD,
      points: 8.0,
      tags: ['História', 'Economia'],
      isPublic: true,
      explanation: 'A Revolução Industrial trouxe urbanização, novas classes sociais, mudanças no trabalho, avanços tecnológicos, etc.',
    },
    {
      title: 'Aquecimento global',
      statement: 'Analise as causas e consequências do aquecimento global e proponha soluções sustentáveis.',
      type: QuestionType.ESSAY,
      difficulty: QuestionDifficulty.VERY_HARD,
      points: 10.0,
      tags: ['Meio Ambiente', 'Sustentabilidade'],
      isPublic: true,
      explanation: 'O aquecimento global é causado principalmente por emissões de gases de efeito estufa e requer ações como energia limpa, reflorestamento, etc.',
    },

    // FILL_IN_BLANK questions
    {
      title: 'Completar: Proclamação da República',
      statement: 'A Proclamação da República no Brasil ocorreu em _____ de novembro de _____.',
      type: QuestionType.FILL_IN_BLANK,
      difficulty: QuestionDifficulty.MEDIUM,
      points: 2.0,
      tags: ['História', 'Brasil'],
      isPublic: true,
      correctAnswer: '15; 1889',
      explanation: 'A Proclamação da República brasileira aconteceu em 15 de novembro de 1889.',
    },
    {
      title: 'Completar: Países da América do Sul',
      statement: 'Os países que fazem fronteira com o Brasil na América do Sul são: Argentina, _____, Paraguai, Peru, _____, Suriname, _____, Venezuela, Colômbia e _____.',
      type: QuestionType.FILL_IN_BLANK,
      difficulty: QuestionDifficulty.HARD,
      points: 3.0,
      tags: ['Geografia', 'América do Sul'],
      isPublic: true,
      correctAnswer: 'Bolívia; Uruguai; Guiana Francesa; Guiana',
      explanation: 'O Brasil faz fronteira com 10 países sul-americanos, exceto Chile e Equador.',
    },

    // OPEN_ENDED questions
    {
      title: 'Experimento científico',
      statement: 'Descreva um experimento que você faria para demonstrar que o ar ocupa espaço.',
      type: QuestionType.OPEN_ENDED,
      difficulty: QuestionDifficulty.MEDIUM,
      points: 4.0,
      tags: ['Ciências', 'Física'],
      isPublic: true,
      explanation: 'Diversos experimentos podem demonstrar isso, como colocar um papel no fundo de um copo invertido e submergir na água.',
    },
    {
      title: 'Resolver problema matemático',
      statement: 'João tem R$ 500,00 e quer comprar uma bicicleta que custa R$ 800,00. Se ele conseguir economizar R$ 60,00 por mês, em quantos meses ele poderá comprar a bicicleta? Mostre todos os cálculos.',
      type: QuestionType.OPEN_ENDED,
      difficulty: QuestionDifficulty.MEDIUM,
      points: 3.0,
      tags: ['Matemática', 'Problemas'],
      isPublic: true,
      answerKey: 'Faltam R$ 300,00. Se economiza R$ 60,00 por mês: 300 ÷ 60 = 5 meses.',
      explanation: 'Problema de subtração e divisão simples envolvendo economia e compra.',
    },
    {
      title: 'Interpretação de texto',
      statement: 'Leia o texto: "O vento soprava forte naquela noite. As árvores dançavam ao som da tempestade. Maria olhava pela janela, ansiosa pela chegada de seu irmão." Que sensação o texto transmite? Justifique sua resposta.',
      type: QuestionType.OPEN_ENDED,
      difficulty: QuestionDifficulty.HARD,
      points: 5.0,
      tags: ['Português', 'Interpretação'],
      isPublic: true,
      explanation: 'O texto transmite tensão e preocupação através de elementos como tempestade e a ansiedade do personagem.',
    },
    {
      title: 'Teorema complexo',
      statement: 'Demonstre o Teorema Fundamental do Cálculo e explique sua importância na matemática.',
      type: QuestionType.OPEN_ENDED,
      difficulty: QuestionDifficulty.EXPERT,
      points: 10.0,
      tags: ['Matemática', 'Cálculo'],
      isPublic: true,
      explanation: 'O Teorema Fundamental do Cálculo estabelece a relação entre derivadas e integrais, conectando os dois principais conceitos do cálculo.',
    },
  ];

  // Create questions
  for (const qData of questionsData) {
    console.log(`  Creating: ${qData.title}`);

    const question = await prisma.question.create({
      data: {
        title: qData.title,
        statement: qData.statement,
        type: qData.type,
        difficulty: qData.difficulty,
        points: qData.points,
        tags: qData.tags,
        isPublic: qData.isPublic,
        explanation: qData.explanation,
        correctAnswer: qData.correctAnswer,
        answerKey: qData.answerKey,
        categoryId: category.id,
        institutionId: qData.isPublic ? null : institution.id,
        createdById: user.id,
      },
    });

    // Create options for MULTIPLE_CHOICE questions
    if (qData.options) {
      const correctIndex = qData.options.findIndex(opt => opt.isCorrect);
      const correctAnswer = correctIndex >= 0 ? String.fromCharCode(65 + correctIndex) : null;

      // Update question with correct answer
      if (correctAnswer) {
        await prisma.question.update({
          where: { id: question.id },
          data: { correctAnswer },
        });
      }

      // Create options
      for (let i = 0; i < qData.options.length; i++) {
        await prisma.questionOption.create({
          data: {
            questionId: question.id,
            optionLetter: String.fromCharCode(65 + i), // A, B, C, D...
            text: qData.options[i].text,
            orderNumber: i + 1,
          },
        });
      }
    }
  }

  console.log(`✅ Created ${questionsData.length} questions of all types`);
}

// If running directly
if (require.main === module) {
  seedQuestionsAllTypes()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
