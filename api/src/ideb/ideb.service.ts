import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIDEBTargetDto, UpdateIDEBTargetDto } from './dto/ideb-target.dto';
import { CalculateIDEBDto } from './dto/calculate-ideb.dto';

@Injectable()
export class IDEBService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // METAS IDEB
  // ==========================================

  /**
   * Criar meta IDEB
   */
  async createTarget(institutionId: string, dto: CreateIDEBTargetDto) {
    return this.prisma.iDEBTarget.create({
      data: {
        ...dto,
        institutionId,
      },
    });
  }

  /**
   * Listar metas IDEB da instituição
   */
  async getTargets(institutionId: string, year?: number, gradeLevel?: string) {
    const where: any = { institutionId };

    if (year) {
      where.year = year;
    }

    if (gradeLevel) {
      where.gradeLevel = gradeLevel;
    }

    return this.prisma.iDEBTarget.findMany({
      where,
      orderBy: [{ year: 'desc' }, { gradeLevel: 'asc' }],
    });
  }

  /**
   * Buscar meta específica
   */
  async getTarget(id: string) {
    const target = await this.prisma.iDEBTarget.findUnique({
      where: { id },
    });

    if (!target) {
      throw new NotFoundException('Meta IDEB não encontrada');
    }

    return target;
  }

  /**
   * Atualizar meta IDEB
   */
  async updateTarget(id: string, dto: UpdateIDEBTargetDto) {
    return this.prisma.iDEBTarget.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Deletar meta IDEB
   */
  async deleteTarget(id: string) {
    return this.prisma.iDEBTarget.delete({
      where: { id },
    });
  }

  // ==========================================
  // INDICADORES IDEB
  // ==========================================

  /**
   * Calcular e criar indicador IDEB
   */
  async calculateIndicator(institutionId: string, dto: CalculateIDEBDto) {
    const { year, gradeLevel } = dto;

    // Buscar dados de fluxo escolar (aprovação, abandono, reprovação)
    const flowData = await this.getSchoolFlowData(institutionId, year, gradeLevel);

    // Buscar dados de proficiência SAEB
    const proficiencyData = await this.getSAEBProficiency(institutionId, year, gradeLevel);

    // Calcular IDEB = Taxa de Aprovação × Proficiência Média
    const idebScore = flowData.approvalRate * proficiencyData.averageProficiency;

    // Criar ou atualizar indicador
    const existing = await this.prisma.iDEBIndicator.findUnique({
      where: {
        institutionId_year_gradeLevel: {
          institutionId,
          year,
          gradeLevel,
        },
      },
    });

    const data = {
      year,
      gradeLevel,
      approvalRate: flowData.approvalRate,
      dropoutRate: flowData.dropoutRate,
      repetitionRate: flowData.repetitionRate,
      averageProficiency: proficiencyData.averageProficiency,
      mathProficiency: proficiencyData.mathProficiency,
      portugueseProficiency: proficiencyData.portugueseProficiency,
      idebScore,
      totalStudents: flowData.totalStudents,
      evaluatedStudents: proficiencyData.evaluatedStudents,
      calculatedAt: new Date(),
    };

    if (existing) {
      return this.prisma.iDEBIndicator.update({
        where: { id: existing.id },
        data,
      });
    } else {
      return this.prisma.iDEBIndicator.create({
        data: {
          ...data,
          institutionId,
        },
      });
    }
  }

  /**
   * Listar indicadores IDEB
   */
  async getIndicators(institutionId: string, year?: number, gradeLevel?: string) {
    const where: any = { institutionId };

    if (year) {
      where.year = year;
    }

    if (gradeLevel) {
      where.gradeLevel = gradeLevel;
    }

    return this.prisma.iDEBIndicator.findMany({
      where,
      orderBy: [{ year: 'desc' }, { gradeLevel: 'asc' }],
    });
  }

  /**
   * Buscar indicador específico
   */
  async getIndicator(id: string) {
    const indicator = await this.prisma.iDEBIndicator.findUnique({
      where: { id },
    });

    if (!indicator) {
      throw new NotFoundException('Indicador IDEB não encontrado');
    }

    return indicator;
  }

  /**
   * Comparar IDEB com metas
   */
  async compareWithTargets(institutionId: string, year: number) {
    const [indicators, targets] = await Promise.all([
      this.prisma.iDEBIndicator.findMany({
        where: { institutionId, year },
        orderBy: { gradeLevel: 'asc' },
      }),
      this.prisma.iDEBTarget.findMany({
        where: { institutionId, year },
        orderBy: { gradeLevel: 'asc' },
      }),
    ]);

    return indicators.map((indicator) => {
      const target = targets.find((t) => t.gradeLevel === indicator.gradeLevel);

      return {
        gradeLevel: indicator.gradeLevel,
        idebScore: indicator.idebScore,
        target: target?.target || null,
        nationalTarget: target?.nationalTarget || null,
        stateTarget: target?.stateTarget || null,
        difference: target ? indicator.idebScore - target.target : null,
        percentageAchieved: target
          ? (indicator.idebScore / target.target) * 100
          : null,
        achieved: target ? indicator.idebScore >= target.target : null,
      };
    });
  }

  /**
   * Obter evolução histórica do IDEB
   */
  async getHistoricalTrend(institutionId: string, gradeLevel: string, limit = 10) {
    const indicators = await this.prisma.iDEBIndicator.findMany({
      where: { institutionId, gradeLevel },
      orderBy: { year: 'desc' },
      take: limit,
    });

    return indicators.reverse(); // Ordem cronológica
  }

  /**
   * Dashboard completo de IDEB
   */
  async getDashboard(institutionId: string, year: number) {
    const [indicators, targets, comparison] = await Promise.all([
      this.getIndicators(institutionId, year),
      this.getTargets(institutionId, year),
      this.compareWithTargets(institutionId, year),
    ]);

    // Calcular média institucional
    const avgIDEB =
      indicators.length > 0
        ? indicators.reduce((sum, ind) => sum + ind.idebScore, 0) / indicators.length
        : 0;

    // Calcular taxa de alcance de metas
    const targetsAchieved = comparison.filter((c) => c.achieved).length;
    const achievementRate =
      comparison.length > 0 ? (targetsAchieved / comparison.length) * 100 : 0;

    return {
      year,
      indicators,
      targets,
      comparison,
      summary: {
        averageIDEB: avgIDEB,
        totalGradeLevels: indicators.length,
        targetsSet: targets.length,
        targetsAchieved,
        achievementRate,
      },
    };
  }

  /**
   * Simular IDEB com diferentes cenários
   * Permite prever o impacto de mudanças na aprovação ou proficiência
   */
  async simulateIDEB(
    institutionId: string,
    year: number,
    gradeLevel: string,
    scenarios: {
      approvalRate?: number; // 0-1
      averageProficiency?: number; // 0-10
      mathProficiency?: number; // 0-10
      portugueseProficiency?: number; // 0-10
    }[],
  ) {
    // Buscar dados atuais
    const currentIndicator = await this.prisma.iDEBIndicator.findUnique({
      where: {
        institutionId_year_gradeLevel: {
          institutionId,
          year,
          gradeLevel,
        },
      },
    });

    if (!currentIndicator) {
      throw new NotFoundException(
        'Nenhum indicador encontrado para simular. Calcule o IDEB atual primeiro.',
      );
    }

    // Calcular projeções para cada cenário
    const simulations = scenarios.map((scenario) => {
      const approvalRate = scenario.approvalRate ?? currentIndicator.approvalRate;
      const avgProficiency =
        scenario.averageProficiency ?? currentIndicator.averageProficiency;

      const projectedIDEB = approvalRate * avgProficiency;
      const currentIDEB = currentIndicator.idebScore;
      const difference = projectedIDEB - currentIDEB;
      const percentageChange = (difference / currentIDEB) * 100;

      return {
        scenario: {
          approvalRate,
          averageProficiency: avgProficiency,
          mathProficiency: scenario.mathProficiency,
          portugueseProficiency: scenario.portugueseProficiency,
        },
        current: {
          ideb: currentIDEB,
          approvalRate: currentIndicator.approvalRate,
          proficiency: currentIndicator.averageProficiency,
        },
        projected: {
          ideb: projectedIDEB,
          difference,
          percentageChange,
        },
        recommendations: this.generateRecommendations(
          currentIndicator,
          scenario,
          projectedIDEB,
        ),
      };
    });

    return {
      gradeLevel,
      year,
      current: currentIndicator,
      simulations,
    };
  }

  /**
   * Gerar projeções para alcançar meta IDEB
   * Calcula o que precisa melhorar para atingir a meta
   */
  async projectToTarget(
    institutionId: string,
    year: number,
    gradeLevel: string,
  ) {
    // Buscar indicador e meta atual
    const [currentIndicator, target] = await Promise.all([
      this.prisma.iDEBIndicator.findUnique({
        where: {
          institutionId_year_gradeLevel: {
            institutionId,
            year,
            gradeLevel,
          },
        },
      }),
      this.prisma.iDEBTarget.findUnique({
        where: {
          institutionId_year_gradeLevel: {
            institutionId,
            year,
            gradeLevel,
          },
        },
      }),
    ]);

    if (!currentIndicator) {
      throw new NotFoundException('Indicador IDEB não encontrado');
    }

    if (!target) {
      throw new NotFoundException('Meta IDEB não definida para esta série');
    }

    const currentIDEB = currentIndicator.idebScore;
    const targetIDEB = target.target;
    const gap = targetIDEB - currentIDEB;

    if (gap <= 0) {
      return {
        message: 'Meta já alcançada!',
        current: currentIDEB,
        target: targetIDEB,
        achieved: true,
      };
    }

    // Calcular diferentes caminhos para alcançar a meta
    const paths: Array<{
      strategy: string;
      description: string;
      requiredApprovalRate: number;
      requiredProficiency: number;
      currentApprovalRate: number;
      currentProficiency: number;
      feasible: boolean;
      effort: number;
    }> = [];

    // Cenário 1: Manter proficiência, melhorar aprovação
    const requiredApproval1 =
      targetIDEB / currentIndicator.averageProficiency;
    if (requiredApproval1 <= 1) {
      paths.push({
        strategy: 'Foco em reduzir evasão e reprovação',
        description:
          'Manter o nível atual de proficiência e melhorar a taxa de aprovação',
        requiredApprovalRate: requiredApproval1,
        requiredProficiency: currentIndicator.averageProficiency,
        currentApprovalRate: currentIndicator.approvalRate,
        currentProficiency: currentIndicator.averageProficiency,
        feasible: requiredApproval1 <= 1 && requiredApproval1 > currentIndicator.approvalRate,
        effort: this.calculateEffort(
          currentIndicator.approvalRate,
          requiredApproval1,
          currentIndicator.averageProficiency,
          currentIndicator.averageProficiency,
        ),
      });
    }

    // Cenário 2: Manter aprovação, melhorar proficiência
    const requiredProficiency2 = targetIDEB / currentIndicator.approvalRate;
    if (requiredProficiency2 <= 10) {
      paths.push({
        strategy: 'Foco em qualidade do ensino',
        description:
          'Manter a taxa de aprovação e melhorar o desempenho nas avaliações',
        requiredApprovalRate: currentIndicator.approvalRate,
        requiredProficiency: requiredProficiency2,
        currentApprovalRate: currentIndicator.approvalRate,
        currentProficiency: currentIndicator.averageProficiency,
        feasible: requiredProficiency2 <= 10 && requiredProficiency2 > currentIndicator.averageProficiency,
        effort: this.calculateEffort(
          currentIndicator.approvalRate,
          currentIndicator.approvalRate,
          currentIndicator.averageProficiency,
          requiredProficiency2,
        ),
      });
    }

    // Cenário 3: Melhorar ambos proporcionalmente
    const improvementFactor = Math.sqrt(targetIDEB / currentIDEB);
    const balancedApproval = currentIndicator.approvalRate * improvementFactor;
    const balancedProficiency =
      currentIndicator.averageProficiency * improvementFactor;

    if (balancedApproval <= 1 && balancedProficiency <= 10) {
      paths.push({
        strategy: 'Abordagem balanceada',
        description: 'Melhorar aprovação e proficiência de forma equilibrada',
        requiredApprovalRate: balancedApproval,
        requiredProficiency: balancedProficiency,
        currentApprovalRate: currentIndicator.approvalRate,
        currentProficiency: currentIndicator.averageProficiency,
        feasible: true,
        effort: this.calculateEffort(
          currentIndicator.approvalRate,
          balancedApproval,
          currentIndicator.averageProficiency,
          balancedProficiency,
        ),
      });
    }

    return {
      current: {
        ideb: currentIDEB,
        approvalRate: currentIndicator.approvalRate,
        proficiency: currentIndicator.averageProficiency,
      },
      target: {
        ideb: targetIDEB,
        gap,
        percentageGap: (gap / currentIDEB) * 100,
      },
      paths: paths.sort((a, b) => a.effort - b.effort), // Ordenar por esforço
    };
  }

  /**
   * Calcular esforço necessário (quanto mais distante, maior o esforço)
   */
  private calculateEffort(
    currentApproval: number,
    targetApproval: number,
    currentProficiency: number,
    targetProficiency: number,
  ): number {
    const approvalGap = Math.abs(targetApproval - currentApproval);
    const proficiencyGap = Math.abs(targetProficiency - currentProficiency);

    // Esforço é proporcional ao gap (normalizado)
    return approvalGap * 100 + proficiencyGap * 10;
  }

  /**
   * Gerar recomendações baseadas no cenário
   */
  private generateRecommendations(
    current: any,
    scenario: any,
    projectedIDEB: number,
  ): string[] {
    const recommendations: string[] = [];

    // Recomendações sobre aprovação
    if (scenario.approvalRate && scenario.approvalRate > current.approvalRate) {
      const improvement =
        ((scenario.approvalRate - current.approvalRate) / current.approvalRate) *
        100;
      recommendations.push(
        `Reduzir evasão e reprovação em ${improvement.toFixed(1)}% para melhorar a taxa de aprovação`,
      );
      recommendations.push(
        'Implementar programas de acompanhamento pedagógico para alunos em risco',
      );
      recommendations.push('Reforçar estratégias de combate à evasão escolar');
    }

    // Recomendações sobre proficiência
    if (
      scenario.averageProficiency &&
      scenario.averageProficiency > current.averageProficiency
    ) {
      const improvement =
        ((scenario.averageProficiency - current.averageProficiency) /
          current.averageProficiency) *
        100;
      recommendations.push(
        `Melhorar o desempenho médio em ${improvement.toFixed(1)}% através de:`,
      );
      recommendations.push('  - Reforço escolar em horários alternativos');
      recommendations.push('  - Capacitação continuada dos professores');
      recommendations.push(
        '  - Uso de metodologias ativas e recursos tecnológicos',
      );
      recommendations.push('  - Simulados e avaliações diagnósticas frequentes');
    }

    if (projectedIDEB > current.idebScore) {
      recommendations.push(
        `Com essas melhorias, o IDEB pode aumentar de ${current.idebScore.toFixed(2)} para ${projectedIDEB.toFixed(2)}`,
      );
    }

    return recommendations;
  }

  // ==========================================
  // MÉTODOS AUXILIARES
  // ==========================================

  /**
   * Obter dados de fluxo escolar (aprovação, abandono, reprovação)
   */
  private async getSchoolFlowData(institutionId: string, year: number, gradeLevel: string) {
    // Buscar todas as turmas do ano/série
    const classes = await this.prisma.class.findMany({
      where: {
        institutionId,
        grade: gradeLevel,
        academicYear: {
          year,
        },
      },
      include: {
        enrollments: {
          where: { isActive: true },
        },
      },
    });

    let totalStudents = 0;
    let approvedStudents = 0;
    let droppedStudents = 0;
    let repeatedStudents = 0;

    for (const classItem of classes) {
      const enrollments = classItem.enrollments;
      totalStudents += enrollments.length;

      // Contabilizar status real dos alunos
      for (const enrollment of enrollments) {
        const status = (enrollment as any).status; // EnrollmentStatus

        if (status === 'APPROVED') {
          approvedStudents++;
        } else if (status === 'DROPPED_OUT') {
          droppedStudents++;
        } else if (status === 'FAILED') {
          repeatedStudents++;
        }
        // ENROLLED e TRANSFERRED não contam nas estatísticas finais do ano
      }
    }

    const approvalRate = totalStudents > 0 ? approvedStudents / totalStudents : 0;
    const dropoutRate = totalStudents > 0 ? droppedStudents / totalStudents : 0;
    const repetitionRate = totalStudents > 0 ? repeatedStudents / totalStudents : 0;

    return {
      totalStudents,
      approvalRate,
      dropoutRate,
      repetitionRate,
    };
  }

  /**
   * Obter proficiência média SAEB
   */
  private async getSAEBProficiency(institutionId: string, year: number, gradeLevel: string) {
    // Buscar todos os simulados SAEB do ano/série
    const exams = await this.prisma.exam.findMany({
      where: {
        institutionId,
        type: 'SAEB',
        gradeLevel,
        // Filtrar por ano também se tiver campo de data
      },
      include: {
        questions: {
          include: {
            question: {
              include: {
                saebDescriptor: true,
              },
            },
          },
        },
      },
    });

    if (exams.length === 0) {
      return {
        averageProficiency: 0,
        mathProficiency: null,
        portugueseProficiency: null,
        evaluatedStudents: 0,
      };
    }

    // Buscar todas as respostas dos alunos
    const examIds = exams.map((e) => e.id);
    const answers = await this.prisma.examAnswer.findMany({
      where: {
        examQuestion: {
          examId: { in: examIds },
        },
      },
      include: {
        attempt: {
          select: {
            studentId: true,
          },
        },
        examQuestion: {
          include: {
            question: {
              include: {
                saebDescriptor: true,
                subject: true,
              },
            },
          },
        },
      },
    });

    // Calcular proficiência por matéria
    const mathAnswers = answers.filter(
      (a) => a.examQuestion.question.subject?.name === 'Matemática',
    );
    const portugueseAnswers = answers.filter(
      (a) => a.examQuestion.question.subject?.name === 'Português',
    );

    const mathCorrect = mathAnswers.filter((a) => a.isCorrect).length;
    const portugueseCorrect = portugueseAnswers.filter((a) => a.isCorrect).length;

    const mathProficiency =
      mathAnswers.length > 0 ? (mathCorrect / mathAnswers.length) * 10 : null;
    const portugueseProficiency =
      portugueseAnswers.length > 0 ? (portugueseCorrect / portugueseAnswers.length) * 10 : null;

    // Proficiência média geral
    const proficiencies = [mathProficiency, portugueseProficiency].filter(
      (p) => p !== null,
    ) as number[];
    const averageProficiency =
      proficiencies.length > 0
        ? proficiencies.reduce((sum, p) => sum + p, 0) / proficiencies.length
        : 0;

    // Contar alunos únicos avaliados
    const uniqueStudents = new Set(answers.map((a) => a.attempt.studentId));
    const evaluatedStudents = uniqueStudents.size;

    return {
      averageProficiency,
      mathProficiency,
      portugueseProficiency,
      evaluatedStudents,
    };
  }
}
