import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ExamsService } from './exams.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ExamType, ExamStatus } from '@prisma/client';

@Controller('exams')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  /**
   * Criar novo simulado/exame
   * POST /exams
   */
  @Post()
  @Roles('TEACHER', 'INSTITUTION_ADMIN', 'SUPER_ADMIN')
  async create(
    @Body()
    data: {
      title: string;
      description?: string;
      type: ExamType;
      gradeLevel?: string;
      duration?: number;
      institutionId: string;
      subjectId?: string;
      questionIds?: string[];
    },
    @Request() req,
  ) {
    return this.examsService.create({
      ...data,
      createdById: req.user.teacherId,
    });
  }

  /**
   * Adicionar questões a um simulado
   * POST /exams/:id/questions
   */
  @Post(':id/questions')
  @Roles('TEACHER', 'INSTITUTION_ADMIN', 'SUPER_ADMIN')
  async addQuestions(
    @Param('id') examId: string,
    @Body() data: { questionIds: string[] },
  ) {
    return this.examsService.addQuestions(examId, data.questionIds);
  }

  /**
   * Publicar um simulado
   * POST /exams/:id/publish
   */
  @Post(':id/publish')
  @Roles('TEACHER', 'INSTITUTION_ADMIN', 'SUPER_ADMIN')
  async publish(@Param('id') examId: string, @Request() req) {
    return this.examsService.publish(examId, req.user.teacherId);
  }

  /**
   * Atribuir simulado a turma ou alunos
   * POST /exams/:id/assign
   */
  @Post(':id/assign')
  @Roles('TEACHER', 'INSTITUTION_ADMIN', 'SUPER_ADMIN')
  async assign(
    @Param('id') examId: string,
    @Body()
    data: {
      classId?: string;
      studentIds?: string[];
      dueDate?: string;
    },
  ) {
    return this.examsService.assign({
      examId,
      classId: data.classId,
      studentIds: data.studentIds,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    });
  }

  /**
   * Listar simulados disponíveis para o aluno
   * GET /exams/available
   */
  @Get('available')
  @Roles('STUDENT')
  async getAvailable(@Request() req) {
    return this.examsService.getAvailableForStudent(req.user.studentId);
  }

  /**
   * Iniciar tentativa de simulado
   * POST /exams/:id/start
   */
  @Post(':id/start')
  @Roles('STUDENT')
  async startAttempt(@Param('id') examId: string, @Request() req) {
    return this.examsService.startAttempt(examId, req.user.studentId);
  }

  /**
   * Responder uma questão
   * POST /attempts/:attemptId/answer
   */
  @Post('attempts/:attemptId/answer')
  @Roles('STUDENT')
  async answerQuestion(
    @Param('attemptId') attemptId: string,
    @Body()
    data: {
      examQuestionId: string;
      selectedOption: number;
    },
  ) {
    return this.examsService.answerQuestion({
      attemptId,
      examQuestionId: data.examQuestionId,
      selectedOption: data.selectedOption,
    });
  }

  /**
   * Finalizar tentativa
   * POST /attempts/:attemptId/submit
   */
  @Post('attempts/:attemptId/submit')
  @Roles('STUDENT')
  async submitAttempt(@Param('attemptId') attemptId: string) {
    return this.examsService.submitAttempt(attemptId);
  }

  /**
   * Obter resultado de uma tentativa
   * GET /attempts/:attemptId/result
   */
  @Get('attempts/:attemptId/result')
  @Roles('STUDENT', 'TEACHER', 'INSTITUTION_ADMIN', 'SUPER_ADMIN')
  async getAttemptResult(@Param('attemptId') attemptId: string, @Request() req) {
    // Para professores/admins, permitir ver qualquer resultado
    // Para alunos, apenas seus próprios
    const studentId = req.user.role === 'STUDENT' ? req.user.studentId : undefined;

    if (studentId) {
      return this.examsService.getAttemptResult(attemptId, studentId);
    }

    // Se não for aluno, buscar sem validação de ownership
    const attempt = await this.examsService.getAttemptResult(attemptId, '');
    return attempt;
  }

  /**
   * Listar simulados (para professores/admins)
   * GET /exams
   */
  @Get()
  @Roles('TEACHER', 'INSTITUTION_ADMIN', 'SUPER_ADMIN')
  async findAll(
    @Query('institutionId') institutionId?: string,
    @Query('createdById') createdById?: string,
    @Query('type') type?: ExamType,
    @Query('status') status?: ExamStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.examsService.findAll({
      institutionId,
      createdById,
      type,
      status,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  /**
   * Obter detalhes de um simulado
   * GET /exams/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    // Implementação básica - você pode adicionar mais lógica aqui
    return this.examsService.findAll({ page: 1, limit: 1 });
  }

  /**
   * Estatísticas de um simulado
   * GET /exams/:id/statistics
   */
  @Get(':id/statistics')
  @Roles('TEACHER', 'INSTITUTION_ADMIN', 'SUPER_ADMIN')
  async getStatistics(@Param('id') examId: string) {
    return this.examsService.getStatistics(examId);
  }

  /**
   * Analytics avançados de um simulado
   * Análise por questão, descritor SAEB, proficiência, etc.
   * GET /exams/:id/analytics
   */
  @Get(':id/analytics')
  @Roles('TEACHER', 'INSTITUTION_ADMIN', 'SUPER_ADMIN')
  async getAdvancedAnalytics(@Param('id') examId: string) {
    return this.examsService.getAdvancedAnalytics(examId);
  }

  /**
   * Relatório de desempenho personalizado de um aluno
   * Evolução, performance por descritor SAEB, pontos fortes e fracos
   * GET /students/:studentId/performance
   */
  @Get('students/:studentId/performance')
  @Roles('STUDENT', 'TEACHER', 'PARENT', 'INSTITUTION_ADMIN', 'SUPER_ADMIN')
  async getStudentPerformanceReport(
    @Param('studentId') studentId: string,
    @Query('subjectId') subjectId?: string,
    @Query('examType') examType?: ExamType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req?,
  ) {
    // Validar se aluno está tentando ver seu próprio relatório
    if (req.user.role === 'STUDENT' && req.user.studentId !== studentId) {
      throw new Error('Você só pode ver seu próprio relatório');
    }

    const filters: any = {};
    if (subjectId) filters.subjectId = subjectId;
    if (examType) filters.examType = examType;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    return this.examsService.getStudentPerformanceReport(studentId, filters);
  }
}
