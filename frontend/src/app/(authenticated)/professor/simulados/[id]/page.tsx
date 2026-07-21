'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { examsService, ExamStatus, ExamType } from '@/services/exams.service';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeftIcon,
  RocketLaunchIcon,
  UsersIcon,
  ChartBarIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface PageProps {
  params: {
    id: string;
  };
}

const examTypeLabels: Record<ExamType, string> = {
  SAEB: 'SAEB',
  DIAGNOSTIC: 'Diagnóstico',
  FORMATIVE: 'Formativo',
  SUMMATIVE: 'Somativo',
  CUSTOM: 'Personalizado',
};

const statusLabels: Record<ExamStatus, string> = {
  DRAFT: 'Rascunho',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Arquivado',
};

const statusColors: Record<ExamStatus, 'default' | 'success' | 'warning'> = {
  DRAFT: 'warning',
  PUBLISHED: 'success',
  ARCHIVED: 'default',
};

export default function ExamDetailsPage({ params }: PageProps) {
  const { id: examId } = params;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Buscar dados do simulado
  const { data: examData, isLoading } = useQuery({
    queryKey: ['exam-details', examId],
    queryFn: async () => {
      const result = await examsService.findAll({ page: 1, limit: 100 });
      return result.data.find((e) => e.id === examId);
    },
  });

  // Buscar estatísticas
  const { data: stats } = useQuery({
    queryKey: ['exam-statistics', examId],
    queryFn: () => examsService.getStatistics(examId),
    enabled: examData?.status === ExamStatus.PUBLISHED,
  });

  // Buscar turmas (simplificado)
  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      // Implementar busca de turmas
      return [];
    },
  });

  // Publicar simulado
  const publishMutation = useMutation({
    mutationFn: () => examsService.publish(examId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-details'] });
      queryClient.invalidateQueries({ queryKey: ['professor-exams'] });
      toast.success('Simulado publicado com sucesso!');
    },
  });

  // Atribuir simulado
  const assignMutation = useMutation({
    mutationFn: () =>
      examsService.assign(examId, {
        classId: selectedClassId,
        dueDate: dueDate || undefined,
      }),
    onSuccess: () => {
      setShowAssignModal(false);
      setSelectedClassId('');
      setDueDate('');
      toast.success('Simulado atribuído com sucesso!');
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!examData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Simulado não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/professor/simulados">
            <Button
              variant="secondary"
              leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
              size="sm"
            >
              Voltar
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {examData.title}
              </h1>
              <Badge variant={statusColors[examData.status]}>
                {statusLabels[examData.status]}
              </Badge>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {examData.description || 'Sem descrição'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {examData.status === ExamStatus.DRAFT && (
            <>
              <Button
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending}
                leftIcon={<RocketLaunchIcon className="h-4 w-4" />}
                variant="primary"
              >
                Publicar
              </Button>
              <Button
                variant="secondary"
                leftIcon={<PencilIcon className="h-4 w-4" />}
              >
                Editar
              </Button>
            </>
          )}
          {examData.status === ExamStatus.PUBLISHED && (
            <Button
              onClick={() => setShowAssignModal(true)}
              leftIcon={<UsersIcon className="h-4 w-4" />}
              variant="primary"
            >
              Atribuir a Turma
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações Principais */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detalhes */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Detalhes
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tipo</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {examTypeLabels[examData.type]}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Matéria</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {examData.subject?.name || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Série/Ano</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {examData.gradeLevel || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Duração</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {examData.duration ? `${examData.duration} min` : 'Sem limite'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Questões</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {examData.questions?.length || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pontuação Total
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {examData.totalPoints}
                </p>
              </div>
            </div>
          </div>

          {/* Questões */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Questões ({examData.questions?.length || 0})
            </h3>
            {examData.questions && examData.questions.length > 0 ? (
              <div className="space-y-2">
                {examData.questions
                  .sort((a, b) => a.orderNumber - b.orderNumber)
                  .map((examQuestion, index) => (
                    <div
                      key={examQuestion.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          #{index + 1}
                        </span>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {examQuestion.question?.statement?.slice(0, 80) ||
                            'Questão sem enunciado'}
                          ...
                        </span>
                      </div>
                      <Badge variant="default" size="sm">
                        {examQuestion.points} pts
                      </Badge>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhuma questão adicionada
              </div>
            )}
          </div>

          {/* Estatísticas */}
          {examData.status === ExamStatus.PUBLISHED && stats && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5" />
                Estatísticas
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tentativas</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalAttempts}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Média de Pontos
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.averageScore.toFixed(1)}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Média Percentual
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.averagePercentage.toFixed(1)}%
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Proficiência Média
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.averageProficiency.toFixed(1)}
                  </p>
                </div>
              </div>

              {/* Distribuição de notas */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Distribuição de Notas
                </h4>
                <div className="flex items-end gap-2 h-32">
                  {stats.distribution.map((count, index) => {
                    const maxCount = Math.max(...stats.distribution);
                    const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <span className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {count}
                        </span>
                        <div
                          className="w-full bg-primary-500 rounded-t"
                          style={{ height: `${height}%` }}
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {index * 10}-{index * 10 + 9}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Informações
            </h3>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Criado por</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {examData.createdBy?.user?.firstName}{' '}
                  {examData.createdBy?.user?.lastName}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Criado em</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(examData.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Última atualização
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(examData.updatedAt).toLocaleDateString('pt-BR')}
                </p>
              </div>

              {(examData as any)._count && (
                <>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Atribuições
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {(examData as any)._count.assignments || 0}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Tentativas
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {(examData as any)._count.attempts || 0}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Atribuição */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Atribuir Simulado
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Turma *
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Selecione uma turma...</option>
                  {classes?.map((cls: any) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data Limite
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <Button
                onClick={() => setShowAssignModal(false)}
                variant="secondary"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => assignMutation.mutate()}
                disabled={!selectedClassId || assignMutation.isPending}
                variant="primary"
                className="flex-1"
              >
                {assignMutation.isPending ? 'Atribuindo...' : 'Atribuir'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
