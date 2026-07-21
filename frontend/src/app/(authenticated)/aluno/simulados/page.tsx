'use client';

import { useQuery } from '@tanstack/react-query';
import { examsService, ExamType, AttemptStatus } from '@/services/exams.service';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  AcademicCapIcon,
  ClockIcon,
  TrophyIcon,
  PlayIcon,
  CheckCircleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const examTypeLabels: Record<ExamType, string> = {
  SAEB: 'SAEB',
  DIAGNOSTIC: 'Diagnóstico',
  FORMATIVE: 'Formativo',
  SUMMATIVE: 'Somativo',
  CUSTOM: 'Personalizado',
};

const examTypeColors: Record<
  ExamType,
  'success' | 'error' | 'warning' | 'info' | 'default'
> = {
  SAEB: 'info',
  DIAGNOSTIC: 'info',
  FORMATIVE: 'success',
  SUMMATIVE: 'warning',
  CUSTOM: 'default',
};

export default function StudentExamsPage() {
  const router = useRouter();

  const { data: exams, isLoading } = useQuery({
    queryKey: ['available-exams'],
    queryFn: () => examsService.getAvailable(),
  });

  const handleStartExam = (examId: string) => {
    router.push(`/aluno/simulados/${examId}`);
  };

  const handleViewResult = (attemptId: string) => {
    router.push(`/aluno/simulados/resultado/${attemptId}`);
  };

  const getAttemptStatus = (exam: any) => {
    if (!exam.attempt) return null;

    switch (exam.attempt.status) {
      case AttemptStatus.NOT_STARTED:
        return { label: 'Não iniciado', color: 'default' as const };
      case AttemptStatus.IN_PROGRESS:
        return { label: 'Em andamento', color: 'warning' as const };
      case AttemptStatus.SUBMITTED:
        return { label: 'Finalizado', color: 'success' as const };
      case AttemptStatus.GRADED:
        return { label: 'Corrigido', color: 'info' as const };
      default:
        return null;
    }
  };

  const isPastDue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Simulados e Avaliações
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Realize simulados e avaliações para testar seus conhecimentos
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Carregando simulados...</p>
        </div>
      ) : exams && exams.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {exams.map((exam) => {
            const status = getAttemptStatus(exam);
            const overdue = isPastDue(exam.assignment?.dueDate);

            return (
              <div
                key={exam.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AcademicCapIcon className="h-5 w-5 text-primary-500" />
                        <Badge variant={examTypeColors[exam.type]} size="sm">
                          {examTypeLabels[exam.type]}
                        </Badge>
                        {exam.subject && (
                          <Badge variant="default" size="sm">
                            {exam.subject.name}
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {exam.title}
                      </h3>
                      {exam.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {exam.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <ClockIcon className="h-4 w-4" />
                      {exam.duration ? `${exam.duration} min` : 'Sem limite'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <TrophyIcon className="h-4 w-4" />
                      {exam.totalPoints} pontos
                    </div>
                    {exam.questions && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <ChartBarIcon className="h-4 w-4" />
                        {exam.questions.length} questões
                      </div>
                    )}
                    {exam.assignment?.dueDate && (
                      <div
                        className={`flex items-center gap-2 text-sm ${
                          overdue
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <ClockIcon className="h-4 w-4" />
                        Prazo: {new Date(exam.assignment.dueDate).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>

                  {/* Status and Action */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    {status && (
                      <Badge variant={status.color} size="sm">
                        {status.label}
                      </Badge>
                    )}

                    {!exam.attempt || exam.attempt.status === AttemptStatus.NOT_STARTED ? (
                      <Button
                        onClick={() => handleStartExam(exam.id)}
                        leftIcon={<PlayIcon className="h-4 w-4" />}
                        size="sm"
                        disabled={overdue}
                      >
                        {overdue ? 'Prazo encerrado' : 'Iniciar Simulado'}
                      </Button>
                    ) : exam.attempt.status === AttemptStatus.IN_PROGRESS ? (
                      <Button
                        onClick={() => handleStartExam(exam.id)}
                        variant="secondary"
                        leftIcon={<PlayIcon className="h-4 w-4" />}
                        size="sm"
                      >
                        Continuar
                      </Button>
                    ) : (
                      <div className="flex items-center gap-3">
                        {exam.attempt.percentage !== undefined && (
                          <div className="text-right">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Nota
                            </p>
                            <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                              {exam.attempt.percentage.toFixed(1)}%
                            </p>
                          </div>
                        )}
                        <Button
                          onClick={() => handleViewResult(exam.attempt!.id)}
                          variant="secondary"
                          leftIcon={<CheckCircleIcon className="h-4 w-4" />}
                          size="sm"
                        >
                          Ver Resultado
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <AcademicCapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nenhum simulado disponível
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No momento não há simulados atribuídos para você.
          </p>
        </div>
      )}
    </div>
  );
}
