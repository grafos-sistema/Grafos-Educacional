import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SAEBDescriptorsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Listar todos os descritores SAEB
   */
  async findAll(filters?: {
    subject?: string;
    gradeLevel?: string;
    skill?: string;
  }) {
    const where: any = {};

    if (filters?.subject) {
      where.subject = filters.subject;
    }
    if (filters?.gradeLevel) {
      where.gradeLevel = filters.gradeLevel;
    }
    if (filters?.skill) {
      where.skill = { contains: filters.skill, mode: 'insensitive' };
    }

    return this.prisma.sAEBDescriptor.findMany({
      where,
      orderBy: [{ subject: 'asc' }, { code: 'asc' }],
    });
  }

  /**
   * Buscar descritor por ID
   */
  async findOne(id: string) {
    const descriptor = await this.prisma.sAEBDescriptor.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            category: true,
            subject: true,
          },
        },
      },
    });

    if (!descriptor) {
      throw new NotFoundException('Descritor SAEB não encontrado');
    }

    return descriptor;
  }

  /**
   * Criar descritor SAEB
   */
  async create(data: {
    code: string;
    subject: string;
    skill: string;
    description: string;
    gradeLevel: string;
  }) {
    return this.prisma.sAEBDescriptor.create({
      data,
    });
  }

  /**
   * Atualizar descritor SAEB
   */
  async update(
    id: string,
    data: {
      code?: string;
      subject?: string;
      skill?: string;
      description?: string;
      gradeLevel?: string;
    },
  ) {
    const descriptor = await this.prisma.sAEBDescriptor.findUnique({
      where: { id },
    });

    if (!descriptor) {
      throw new NotFoundException('Descritor SAEB não encontrado');
    }

    return this.prisma.sAEBDescriptor.update({
      where: { id },
      data,
    });
  }

  /**
   * Deletar descritor SAEB
   */
  async remove(id: string) {
    const descriptor = await this.prisma.sAEBDescriptor.findUnique({
      where: { id },
    });

    if (!descriptor) {
      throw new NotFoundException('Descritor SAEB não encontrado');
    }

    return this.prisma.sAEBDescriptor.delete({
      where: { id },
    });
  }

  /**
   * Seed de descritores SAEB - Português (5º ano)
   * Baseado na Matriz de Referência oficial do SAEB
   */
  async seedPortugues5ano() {
    const descriptors = [
      {
        code: 'D1',
        subject: 'Português',
        skill: 'Procedimentos de Leitura',
        description: 'Localizar informações explícitas em um texto',
        gradeLevel: '5º ano',
      },
      {
        code: 'D3',
        subject: 'Português',
        skill: 'Procedimentos de Leitura',
        description: 'Inferir o sentido de uma palavra ou expressão',
        gradeLevel: '5º ano',
      },
      {
        code: 'D4',
        subject: 'Português',
        skill: 'Procedimentos de Leitura',
        description: 'Inferir uma informação implícita em um texto',
        gradeLevel: '5º ano',
      },
      {
        code: 'D6',
        subject: 'Português',
        skill: 'Procedimentos de Leitura',
        description: 'Identificar o tema de um texto',
        gradeLevel: '5º ano',
      },
      {
        code: 'D11',
        subject: 'Português',
        skill: 'Procedimentos de Leitura',
        description: 'Distinguir um fato da opinião relativa a esse fato',
        gradeLevel: '5º ano',
      },
      {
        code: 'D15',
        subject: 'Português',
        skill: 'Implicações do Suporte, Gênero e Enunciador',
        description:
          'Reconhecer diferentes formas de tratar uma informação na comparação de textos',
        gradeLevel: '5º ano',
      },
      {
        code: 'D7',
        subject: 'Português',
        skill: 'Coerência e Coesão',
        description: 'Identificar o conflito gerador do enredo e os elementos que constroem a narrativa',
        gradeLevel: '5º ano',
      },
      {
        code: 'D8',
        subject: 'Português',
        skill: 'Coerência e Coesão',
        description: 'Estabelecer relação causa/consequência entre partes e elementos do texto',
        gradeLevel: '5º ano',
      },
      {
        code: 'D9',
        subject: 'Português',
        skill: 'Coerência e Coesão',
        description: 'Identificar a tese de um texto',
        gradeLevel: '5º ano',
      },
      {
        code: 'D10',
        subject: 'Português',
        skill: 'Coerência e Coesão',
        description: 'Identificar o argumento principal de um texto',
        gradeLevel: '5º ano',
      },
      {
        code: 'D12',
        subject: 'Português',
        skill: 'Relações entre Recursos Expressivos',
        description: 'Identificar efeitos de ironia ou humor em textos variados',
        gradeLevel: '5º ano',
      },
      {
        code: 'D13',
        subject: 'Português',
        skill: 'Relações entre Recursos Expressivos',
        description: 'Identificar efeitos de sentido decorrentes do uso de pontuação',
        gradeLevel: '5º ano',
      },
      {
        code: 'D14',
        subject: 'Português',
        skill: 'Relações entre Recursos Expressivos',
        description: 'Identificar o efeito de sentido decorrente do uso de recursos gráficos',
        gradeLevel: '5º ano',
      },
      {
        code: 'D16',
        subject: 'Português',
        skill: 'Variação Linguística',
        description: 'Identificar marcas linguísticas que evidenciam o locutor e o interlocutor',
        gradeLevel: '5º ano',
      },
    ];

    const created: any[] = [];
    for (const descriptor of descriptors) {
      try {
        const existing = await this.prisma.sAEBDescriptor.findUnique({
          where: { code: descriptor.code },
        });

        if (!existing) {
          const newDescriptor = await this.prisma.sAEBDescriptor.create({
            data: descriptor,
          });
          created.push(newDescriptor);
        }
      } catch (error) {
        console.error(`Erro ao criar descritor ${descriptor.code}:`, error);
      }
    }

    return {
      created: created.length,
      total: descriptors.length,
      descriptors: created,
    };
  }

  /**
   * Seed de descritores SAEB - Matemática (5º ano)
   */
  async seedMatematica5ano() {
    const descriptors = [
      {
        code: 'D1',
        subject: 'Matemática',
        skill: 'Espaço e Forma',
        description: 'Identificar a localização/movimentação de objeto em mapas, croquis e outras representações gráficas',
        gradeLevel: '5º ano',
      },
      {
        code: 'D2',
        subject: 'Matemática',
        skill: 'Espaço e Forma',
        description: 'Identificar propriedades comuns e diferenças entre poliedros e corpos redondos',
        gradeLevel: '5º ano',
      },
      {
        code: 'D3',
        subject: 'Matemática',
        skill: 'Espaço e Forma',
        description: 'Identificar propriedades comuns e diferenças entre figuras bidimensionais',
        gradeLevel: '5º ano',
      },
      {
        code: 'D4',
        subject: 'Matemática',
        skill: 'Espaço e Forma',
        description: 'Identificar quadriláteros observando as posições relativas entre seus lados',
        gradeLevel: '5º ano',
      },
      {
        code: 'D5',
        subject: 'Matemática',
        skill: 'Espaço e Forma',
        description: 'Reconhecer a conservação ou modificação de medidas dos lados',
        gradeLevel: '5º ano',
      },
      {
        code: 'D6',
        subject: 'Matemática',
        skill: 'Espaço e Forma',
        description: 'Reconhecer ângulos como mudança de direção ou giros',
        gradeLevel: '5º ano',
      },
      {
        code: 'D12',
        subject: 'Matemática',
        skill: 'Grandezas e Medidas',
        description: 'Resolver problema envolvendo o cálculo do perímetro de figuras planas',
        gradeLevel: '5º ano',
      },
      {
        code: 'D13',
        subject: 'Matemática',
        skill: 'Grandezas e Medidas',
        description: 'Resolver problema envolvendo o cálculo de área de figuras planas',
        gradeLevel: '5º ano',
      },
      {
        code: 'D14',
        subject: 'Matemática',
        skill: 'Grandezas e Medidas',
        description: 'Resolver problema envolvendo noções de volume',
        gradeLevel: '5º ano',
      },
      {
        code: 'D16',
        subject: 'Matemática',
        skill: 'Números e Operações',
        description: 'Reconhecer e utilizar características do sistema de numeração decimal',
        gradeLevel: '5º ano',
      },
      {
        code: 'D17',
        subject: 'Matemática',
        skill: 'Números e Operações',
        description: 'Identificar a localização de números naturais na reta numérica',
        gradeLevel: '5º ano',
      },
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
        code: 'D20',
        subject: 'Matemática',
        skill: 'Números e Operações',
        description: 'Resolver problema com números racionais expressos na forma decimal',
        gradeLevel: '5º ano',
      },
      {
        code: 'D23',
        subject: 'Matemática',
        skill: 'Números e Operações',
        description: 'Identificar fração como representação que pode estar associada a diferentes significados',
        gradeLevel: '5º ano',
      },
      {
        code: 'D24',
        subject: 'Matemática',
        skill: 'Números e Operações',
        description: 'Identificar fração como representação da relação parte/todo',
        gradeLevel: '5º ano',
      },
      {
        code: 'D25',
        subject: 'Matemática',
        skill: 'Números e Operações',
        description: 'Resolver problema com números racionais expressos na forma fracionária',
        gradeLevel: '5º ano',
      },
      {
        code: 'D27',
        subject: 'Matemática',
        skill: 'Tratamento da Informação',
        description: 'Ler informações e dados apresentados em tabelas',
        gradeLevel: '5º ano',
      },
      {
        code: 'D28',
        subject: 'Matemática',
        skill: 'Tratamento da Informação',
        description: 'Ler informações e dados apresentados em gráficos',
        gradeLevel: '5º ano',
      },
    ];

    const created: any[] = [];
    for (const descriptor of descriptors) {
      try {
        // Verificar se já existe (code + subject devem ser únicos)
        const existing = await this.prisma.sAEBDescriptor.findFirst({
          where: {
            code: descriptor.code,
            subject: descriptor.subject,
          },
        });

        if (!existing) {
          const newDescriptor = await this.prisma.sAEBDescriptor.create({
            data: descriptor,
          });
          created.push(newDescriptor);
        }
      } catch (error) {
        console.error(
          `Erro ao criar descritor ${descriptor.code} (${descriptor.subject}):`,
          error,
        );
      }
    }

    return {
      created: created.length,
      total: descriptors.length,
      descriptors: created,
    };
  }

  /**
   * Seed de descritores SAEB - Português (9º ano)
   */
  async seedPortugues9ano() {
    const descriptors = [
      {
        code: 'D1',
        subject: 'Português',
        skill: 'Procedimentos de Leitura',
        description: 'Localizar informações explícitas em um texto',
        gradeLevel: '9º ano',
      },
      {
        code: 'D3',
        subject: 'Português',
        skill: 'Procedimentos de Leitura',
        description: 'Inferir o sentido de uma palavra ou expressão',
        gradeLevel: '9º ano',
      },
      {
        code: 'D4',
        subject: 'Português',
        skill: 'Procedimentos de Leitura',
        description: 'Inferir uma informação implícita em um texto',
        gradeLevel: '9º ano',
      },
      {
        code: 'D6',
        subject: 'Português',
        skill: 'Procedimentos de Leitura',
        description: 'Identificar o tema de um texto',
        gradeLevel: '9º ano',
      },
      {
        code: 'D11',
        subject: 'Português',
        skill: 'Procedimentos de Leitura',
        description: 'Distinguir um fato da opinião relativa a esse fato',
        gradeLevel: '9º ano',
      },
      {
        code: 'D15',
        subject: 'Português',
        skill: 'Implicações do Suporte, Gênero e Enunciador',
        description: 'Reconhecer diferentes formas de tratar uma informação na comparação de textos',
        gradeLevel: '9º ano',
      },
      {
        code: 'D20',
        subject: 'Português',
        skill: 'Relações entre Textos',
        description: 'Reconhecer posições distintas entre duas ou mais opiniões relativas ao mesmo fato ou tema',
        gradeLevel: '9º ano',
      },
      {
        code: 'D21',
        subject: 'Português',
        skill: 'Relações entre Textos',
        description: 'Reconhecer relações entre partes de um texto, identificando repetições ou substituições',
        gradeLevel: '9º ano',
      },
      {
        code: 'D7',
        subject: 'Português',
        skill: 'Coerência e Coesão',
        description: 'Identificar o conflito gerador do enredo e os elementos que constroem a narrativa',
        gradeLevel: '9º ano',
      },
      {
        code: 'D8',
        subject: 'Português',
        skill: 'Coerência e Coesão',
        description: 'Estabelecer relação causa/consequência entre partes e elementos do texto',
        gradeLevel: '9º ano',
      },
      {
        code: 'D9',
        subject: 'Português',
        skill: 'Coerência e Coesão',
        description: 'Identificar a tese de um texto',
        gradeLevel: '9º ano',
      },
      {
        code: 'D10',
        subject: 'Português',
        skill: 'Coerência e Coesão',
        description: 'Estabelecer relações lógico-discursivas presentes no texto, marcadas por elementos de coesão',
        gradeLevel: '9º ano',
      },
      {
        code: 'D12',
        subject: 'Português',
        skill: 'Relações entre Recursos Expressivos',
        description: 'Identificar efeitos de ironia ou humor em textos variados',
        gradeLevel: '9º ano',
      },
      {
        code: 'D13',
        subject: 'Português',
        skill: 'Relações entre Recursos Expressivos',
        description: 'Identificar efeitos de sentido decorrentes do uso de pontuação e notações',
        gradeLevel: '9º ano',
      },
      {
        code: 'D14',
        subject: 'Português',
        skill: 'Relações entre Recursos Expressivos',
        description: 'Identificar o efeito de sentido decorrente da exploração de recursos ortográficos e morfossintáticos',
        gradeLevel: '9º ano',
      },
      {
        code: 'D19',
        subject: 'Português',
        skill: 'Variação Linguística',
        description: 'Identificar o efeito de sentido decorrente da escolha de palavras ou expressões',
        gradeLevel: '9º ano',
      },
    ];

    const created: any[] = [];
    for (const descriptor of descriptors) {
      try {
        const existing = await this.prisma.sAEBDescriptor.findFirst({
          where: {
            code: descriptor.code,
            subject: descriptor.subject,
            gradeLevel: descriptor.gradeLevel,
          },
        });

        if (!existing) {
          const newDescriptor = await this.prisma.sAEBDescriptor.create({
            data: descriptor,
          });
          created.push(newDescriptor);
        }
      } catch (error) {
        console.error(`Erro ao criar descritor ${descriptor.code}:`, error);
      }
    }

    return {
      created: created.length,
      total: descriptors.length,
      descriptors: created,
    };
  }

  /**
   * Seed de descritores SAEB - Matemática (9º ano)
   */
  async seedMatematica9ano() {
    const descriptors = [
      {
        code: 'D1',
        subject: 'Matemática',
        skill: 'Espaço e Forma',
        description: 'Identificar a localização e movimentação de objeto em mapas e outras representações gráficas',
        gradeLevel: '9º ano',
      },
      {
        code: 'D2',
        subject: 'Matemática',
        skill: 'Espaço e Forma',
        description: 'Identificar propriedades de triângulos pela comparação de medidas',
        gradeLevel: '9º ano',
      },
      {
        code: 'D3',
        subject: 'Matemática',
        skill: 'Espaço e Forma',
        description: 'Identificar propriedades comuns e diferenças entre figuras bidimensionais e tridimensionais',
        gradeLevel: '9º ano',
      },
      {
        code: 'D4',
        subject: 'Matemática',
        skill: 'Espaço e Forma',
        description: 'Identificar relação entre quadriláteros por meio de suas propriedades',
        gradeLevel: '9º ano',
      },
      {
        code: 'D5',
        subject: 'Matemática',
        skill: 'Espaço e Forma',
        description: 'Reconhecer a conservação ou modificação de medidas dos lados e do perímetro',
        gradeLevel: '9º ano',
      },
      {
        code: 'D6',
        subject: 'Matemática',
        skill: 'Espaço e Forma',
        description: 'Reconhecer ângulos como mudança de direção ou giros, identificando ângulos retos e não retos',
        gradeLevel: '9º ano',
      },
      {
        code: 'D7',
        subject: 'Matemática',
        skill: 'Espaço e Forma',
        description: 'Reconhecer o significado de simetria de figuras planas',
        gradeLevel: '9º ano',
      },
      {
        code: 'D8',
        subject: 'Matemática',
        skill: 'Espaço e Forma',
        description: 'Resolver problema utilizando propriedades dos polígonos',
        gradeLevel: '9º ano',
      },
      {
        code: 'D9',
        subject: 'Matemática',
        skill: 'Espaço e Forma',
        description: 'Interpretar informações apresentadas por meio de coordenadas cartesianas',
        gradeLevel: '9º ano',
      },
      {
        code: 'D10',
        subject: 'Matemática',
        skill: 'Espaço e Forma',
        description: 'Utilizar relações métricas do triângulo retângulo para resolver problemas significativos',
        gradeLevel: '9º ano',
      },
      {
        code: 'D11',
        subject: 'Matemática',
        skill: 'Espaço e Forma',
        description: 'Reconhecer círculo/circunferência, seus elementos e algumas de suas relações',
        gradeLevel: '9º ano',
      },
      {
        code: 'D12',
        subject: 'Matemática',
        skill: 'Grandezas e Medidas',
        description: 'Resolver problema envolvendo o cálculo de perímetro de figuras planas',
        gradeLevel: '9º ano',
      },
      {
        code: 'D13',
        subject: 'Matemática',
        skill: 'Grandezas e Medidas',
        description: 'Resolver problema envolvendo o cálculo de área de figuras planas',
        gradeLevel: '9º ano',
      },
      {
        code: 'D14',
        subject: 'Matemática',
        skill: 'Grandezas e Medidas',
        description: 'Resolver problema envolvendo noções de volume',
        gradeLevel: '9º ano',
      },
      {
        code: 'D15',
        subject: 'Matemática',
        skill: 'Grandezas e Medidas',
        description: 'Resolver problema utilizando relações entre diferentes unidades de medida',
        gradeLevel: '9º ano',
      },
      {
        code: 'D16',
        subject: 'Matemática',
        skill: 'Números e Operações/Álgebra e Funções',
        description: 'Identificar a localização de números inteiros na reta numérica',
        gradeLevel: '9º ano',
      },
      {
        code: 'D17',
        subject: 'Matemática',
        skill: 'Números e Operações/Álgebra e Funções',
        description: 'Identificar a localização de números racionais na reta numérica',
        gradeLevel: '9º ano',
      },
      {
        code: 'D18',
        subject: 'Matemática',
        skill: 'Números e Operações/Álgebra e Funções',
        description: 'Efetuar cálculos com números inteiros envolvendo as operações',
        gradeLevel: '9º ano',
      },
      {
        code: 'D19',
        subject: 'Matemática',
        skill: 'Números e Operações/Álgebra e Funções',
        description: 'Resolver problema com números naturais envolvendo diferentes significados das operações',
        gradeLevel: '9º ano',
      },
      {
        code: 'D20',
        subject: 'Matemática',
        skill: 'Números e Operações/Álgebra e Funções',
        description: 'Resolver problema com números inteiros envolvendo as operações',
        gradeLevel: '9º ano',
      },
      {
        code: 'D21',
        subject: 'Matemática',
        skill: 'Números e Operações/Álgebra e Funções',
        description: 'Reconhecer as diferentes representações de um número racional',
        gradeLevel: '9º ano',
      },
      {
        code: 'D22',
        subject: 'Matemática',
        skill: 'Números e Operações/Álgebra e Funções',
        description: 'Identificar fração como representação que pode estar associada a diferentes significados',
        gradeLevel: '9º ano',
      },
      {
        code: 'D23',
        subject: 'Matemática',
        skill: 'Números e Operações/Álgebra e Funções',
        description: 'Resolver problema com números racionais envolvendo as operações',
        gradeLevel: '9º ano',
      },
      {
        code: 'D24',
        subject: 'Matemática',
        skill: 'Números e Operações/Álgebra e Funções',
        description: 'Fatorar e simplificar expressões algébricas',
        gradeLevel: '9º ano',
      },
      {
        code: 'D25',
        subject: 'Matemática',
        skill: 'Números e Operações/Álgebra e Funções',
        description: 'Resolver problema que envolva equações de 1º grau',
        gradeLevel: '9º ano',
      },
      {
        code: 'D26',
        subject: 'Matemática',
        skill: 'Números e Operações/Álgebra e Funções',
        description: 'Resolver problema que envolva equações de 2º grau',
        gradeLevel: '9º ano',
      },
      {
        code: 'D27',
        subject: 'Matemática',
        skill: 'Números e Operações/Álgebra e Funções',
        description: 'Identificar a expressão algébrica que expressa uma regularidade observada',
        gradeLevel: '9º ano',
      },
      {
        code: 'D28',
        subject: 'Matemática',
        skill: 'Números e Operações/Álgebra e Funções',
        description: 'Resolver problema que envolva PA/PG',
        gradeLevel: '9º ano',
      },
      {
        code: 'D29',
        subject: 'Matemática',
        skill: 'Números e Operações/Álgebra e Funções',
        description: 'Resolver problema que envolva variação proporcional',
        gradeLevel: '9º ano',
      },
      {
        code: 'D30',
        subject: 'Matemática',
        skill: 'Números e Operações/Álgebra e Funções',
        description: 'Calcular o valor numérico de uma expressão algébrica',
        gradeLevel: '9º ano',
      },
      {
        code: 'D31',
        subject: 'Matemática',
        skill: 'Números e Operações/Álgebra e Funções',
        description: 'Resolver problema que envolva porcentagem',
        gradeLevel: '9º ano',
      },
      {
        code: 'D32',
        subject: 'Matemática',
        skill: 'Números e Operações/Álgebra e Funções',
        description: 'Resolver problema que envolva variação proporcional direta ou inversa',
        gradeLevel: '9º ano',
      },
      {
        code: 'D33',
        subject: 'Matemática',
        skill: 'Tratamento da Informação',
        description: 'Resolver problema envolvendo informações apresentadas em tabelas e/ou gráficos',
        gradeLevel: '9º ano',
      },
      {
        code: 'D34',
        subject: 'Matemática',
        skill: 'Tratamento da Informação',
        description: 'Associar informações apresentadas em listas e/ou tabelas aos gráficos que as representam',
        gradeLevel: '9º ano',
      },
      {
        code: 'D35',
        subject: 'Matemática',
        skill: 'Tratamento da Informação',
        description: 'Resolver problema envolvendo média aritmética',
        gradeLevel: '9º ano',
      },
      {
        code: 'D36',
        subject: 'Matemática',
        skill: 'Tratamento da Informação',
        description: 'Resolver problema envolvendo informações apresentadas em tabelas e/ou gráficos',
        gradeLevel: '9º ano',
      },
      {
        code: 'D37',
        subject: 'Matemática',
        skill: 'Tratamento da Informação',
        description: 'Associar informações apresentadas em listas e/ou tabelas aos gráficos que as representam',
        gradeLevel: '9º ano',
      },
    ];

    const created: any[] = [];
    for (const descriptor of descriptors) {
      try {
        const existing = await this.prisma.sAEBDescriptor.findFirst({
          where: {
            code: descriptor.code,
            subject: descriptor.subject,
            gradeLevel: descriptor.gradeLevel,
          },
        });

        if (!existing) {
          const newDescriptor = await this.prisma.sAEBDescriptor.create({
            data: descriptor,
          });
          created.push(newDescriptor);
        }
      } catch (error) {
        console.error(`Erro ao criar descritor ${descriptor.code} (${descriptor.subject}):`, error);
      }
    }

    return {
      created: created.length,
      total: descriptors.length,
      descriptors: created,
    };
  }

  /**
   * Seed completo - Português e Matemática (5º e 9º anos)
   */
  async seedAll() {
    const portugues5 = await this.seedPortugues5ano();
    const matematica5 = await this.seedMatematica5ano();
    const portugues9 = await this.seedPortugues9ano();
    const matematica9 = await this.seedMatematica9ano();

    return {
      portugues5ano: portugues5,
      matematica5ano: matematica5,
      portugues9ano: portugues9,
      matematica9ano: matematica9,
      total: portugues5.created + matematica5.created + portugues9.created + matematica9.created,
    };
  }

  /**
   * Estatísticas dos descritores
   */
  async getStatistics() {
    const total = await this.prisma.sAEBDescriptor.count();

    const bySubject = await this.prisma.sAEBDescriptor.groupBy({
      by: ['subject'],
      _count: true,
    });

    const byGradeLevel = await this.prisma.sAEBDescriptor.groupBy({
      by: ['gradeLevel'],
      _count: true,
    });

    const bySkill = await this.prisma.sAEBDescriptor.groupBy({
      by: ['skill'],
      _count: true,
    });

    return {
      total,
      bySubject: bySubject.map((item) => ({
        subject: item.subject,
        count: item._count,
      })),
      byGradeLevel: byGradeLevel.map((item) => ({
        gradeLevel: item.gradeLevel,
        count: item._count,
      })),
      bySkill: bySkill.map((item) => ({
        skill: item.skill,
        count: item._count,
      })),
    };
  }
}
