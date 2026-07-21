'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  examsService,
  ExamType,
  ExamStatus,
  saebDescriptorsService,
} from '@/services/exams.service';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  PlusIcon,
  AcademicCapIcon,
  ChartBarIcon,
  EyeIcon,
  SparklesIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

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

const statusColors: Record<
  ExamStatus,
  'default' | 'success' | 'warning' | 'info'
> = {
  DRAFT: 'warning',
  PUBLISHED: 'success',
  ARCHIVED: 'default',
};

export default function ProfessorExamsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<ExamStatus | 'ALL'>('ALL');
  const [filterType, setFilterType] = useState<ExamType | 'ALL'>('ALL');

  // Buscar simulados
  const { data: examsData, isLoading } = useQuery({
    queryKey: [
      'professor-exams',
      user?.institutionId,
      filterStatus,
      filterType,
    ],
    queryFn: () => {
      if (!user?.institutionId) return { data: [], meta: {} };
      return examsService.findAll({
        institutionId: user.institutionId,
        status: filterStatus !== 'ALL' ? filterStatus : undefined,
        type: filterType !== 'ALL' ? filterType : undefined,
      });
    },
    enabled: !!user?.institutionId,
  });

  // Buscar estatísticas dos descritores
  const { data: descriptorStats } = useQuery({
    queryKey: ['saeb-descriptor-stats'],
    queryFn: () => saebDescriptorsService.getStatistics(),
  });

  // Seed descritores SAEB
  const seedDescriptorsMutation = useMutation({
    mutationFn: () => saebDescriptorsService.seedAll(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['saeb-descriptor-stats'] });
      toast.success(`${data.total} descritores SAEB criados com sucesso!`);
    },
  });

  // Publicar simulado
  const publishMutation = useMutation({
    mutationFn: (examId: string) => examsService.publish(examId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professor-exams'] });
      toast.success('Simulado publicado com sucesso!');
    },
  });

  const exams = examsData?.data || [];

  const stats = {
    total: exams.length,
    draft: exams.filter((e) => e.status === ExamStatus.DRAFT).length,
    published: exams.filter((e) => e.status === ExamStatus.PUBLISHED).length,
    totalAttempts: exams.reduce((sum, e) => sum + ((e as any)._count?.attempts || 0), 0),
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gerenciar Simulados
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Crie e gerencie simulados e avaliações para seus alunos
          </p>
        </div>
        <div className="flex gap-2">
          {(!descriptorStats || descriptorStats.total === 0) && (
            <Button
              onClick={() => seedDescriptorsMutation.mutate()}
              disabled={seedDescriptorsMutation.isPending}
              leftIcon={<SparklesIcon className="h-5 w-5" />}
              variant="secondary"
            >
              Criar Descritores SAEB
            </Button>
          )}
          <Link href="/professor/simulados/novo">
            <Button leftIcon={<PlusIcon className="h-5 w-5" />}>
              Novo Simulado
            </Button>
          </Link>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.total}
              </p>
            </div>
            <AcademicCapIcon className="h-12 w-12 text-primary-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Rascunhos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.draft}
              </p>
            </div>
            <EyeIcon className="h-12 w-12 text-yellow-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Publicados</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.published}
              </p>
            </div>
            <RocketLaunchIcon className="h-12 w-12 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tentativas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.totalAttempts}
              </p>
            </div>
            <ChartBarIcon className="h-12 w-12 text-blue-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="ALL">Todos</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="ALL">Todos</option>
              {Object.entries(examTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Simulados */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Meus Simulados
          </h3>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : exams.length > 0 ? (
            <div className="space-y-3">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={statusColors[exam.status]} size="sm">
                        {statusLabels[exam.status]}
                      </Badge>
                      <Badge variant="default" size="sm">
                        {examTypeLabels[exam.type]}
                      </Badge>
                      {exam.subject && (
                        <Badge variant="info" size="sm">
                          {exam.subject.name}
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {exam.title}
                    </h4>
                    <div className="flex gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                      <span>{exam.questions?.length || 0} questões</span>
                      <span>{exam.totalPoints} pontos</span>
                      {exam.duration && <span>{exam.duration} min</span>}
                      <span>{(exam as any)._count?.attempts || 0} tentativas</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {exam.status === ExamStatus.DRAFT && (
                      <Button
                        onClick={() => publishMutation.mutate(exam.id)}
                        disabled={publishMutation.isPending}
                        variant="primary"
                        size="sm"
                      >
                        Publicar
                      </Button>
                    )}
                    <Link href={`/professor/simulados/${exam.id}`}>
                      <Button variant="secondary" size="sm">
                        Ver Detalhes
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhum simulado encontrado
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
