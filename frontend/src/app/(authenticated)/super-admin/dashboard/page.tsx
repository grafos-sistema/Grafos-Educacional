'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  BookOpenIcon,
  FolderIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ChartBarIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { questionsService } from '@/services/questions.service';
import { questionCategoriesService } from '@/services/question-categories.service';
import { worksheetsService } from '@/services/worksheets.service';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { QuestionType, DifficultyLevel } from '@/types/question-bank.types';

const TYPE_LABELS: Record<QuestionType, string> = {
  [QuestionType.MULTIPLE_CHOICE]: 'Múltipla Escolha',
  [QuestionType.OPEN_ENDED]: 'Resposta Aberta',
  [QuestionType.TRUE_FALSE]: 'Verdadeiro/Falso',
  [QuestionType.SHORT_ANSWER]: 'Resposta Curta',
  [QuestionType.ESSAY]: 'Dissertativa',
  [QuestionType.FILL_IN_BLANK]: 'Preencher Lacunas',
};

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  [DifficultyLevel.VERY_EASY]: 'Muito Fácil',
  [DifficultyLevel.EASY]: 'Fácil',
  [DifficultyLevel.MEDIUM]: 'Médio',
  [DifficultyLevel.HARD]: 'Difícil',
  [DifficultyLevel.VERY_HARD]: 'Muito Difícil',
  [DifficultyLevel.EXPERT]: 'Especialista',
};

export default function SuperAdminDashboard() {
  // Buscar estatísticas de questões
  const { data: questionsData, isLoading: loadingQuestions } = useQuery({
    queryKey: ['questions-stats'],
    queryFn: () => questionsService.findAll({ limit: 1000 }),
  });

  // Buscar categorias
  const { data: categoriesData, isLoading: loadingCategories } = useQuery({
    queryKey: ['categories-stats'],
    queryFn: () => questionCategoriesService.findAll({ limit: 100 }),
  });

  // Buscar worksheets
  const { data: worksheetsData, isLoading: loadingWorksheets } = useQuery({
    queryKey: ['worksheets-stats'],
    queryFn: () => worksheetsService.findAll({ limit: 100 }),
  });

  if (loadingQuestions || loadingCategories || loadingWorksheets) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" text="Carregando dashboard..." />
      </div>
    );
  }

  const questions = questionsData?.data || [];
  const categories = categoriesData?.data || [];
  const worksheets = worksheetsData?.data || [];

  // Calcular estatísticas
  const totalQuestions = questions.length;
  const publicQuestions = questions.filter(q => q.isPublic).length;
  const privateQuestions = totalQuestions - publicQuestions;

  // Por tipo
  const byType = Object.values(QuestionType).map(type => ({
    type,
    count: questions.filter(q => q.type === type).length,
  }));

  // Por dificuldade
  const byDifficulty = Object.values(DifficultyLevel).map(difficulty => ({
    difficulty,
    count: questions.filter(q => q.difficulty === difficulty).length,
  }));

  // Questões recentes
  const recentQuestions = questions
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          Dashboard - Super Administrador
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Visão geral do sistema de banco de questões
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <BookOpenIcon className="h-8 w-8 opacity-80" />
            <ArrowTrendingUpIcon className="h-6 w-6 opacity-60" />
          </div>
          <div className="text-3xl font-bold mb-1">{totalQuestions}</div>
          <div className="text-purple-100 text-sm">Total de Questões</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <FolderIcon className="h-8 w-8 opacity-80" />
            <ChartBarIcon className="h-6 w-6 opacity-60" />
          </div>
          <div className="text-3xl font-bold mb-1">{categories.length}</div>
          <div className="text-green-100 text-sm">Categorias</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <DocumentTextIcon className="h-8 w-8 opacity-80" />
            <AcademicCapIcon className="h-6 w-6 opacity-60" />
          </div>
          <div className="text-3xl font-bold mb-1">{worksheets.length}</div>
          <div className="text-blue-100 text-sm">Atividades Criadas</div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <BookOpenIcon className="h-8 w-8 opacity-80" />
            <div className="text-right text-sm opacity-80">
              {publicQuestions > 0 ? Math.round((publicQuestions / totalQuestions) * 100) : 0}%
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">{publicQuestions}</div>
          <div className="text-indigo-100 text-sm">Questões Públicas</div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/super-admin/questions"
            className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all p-6 border-2 border-transparent hover:border-purple-500"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30 group-hover:bg-purple-200 transition-colors">
                <PlusIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Nova Questão</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Adicionar ao banco</p>
              </div>
            </div>
          </Link>

          <Link
            href="/super-admin/question-categories"
            className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all p-6 border-2 border-transparent hover:border-green-500"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30 group-hover:bg-green-200 transition-colors">
                <FolderIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Categorias</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Organizar questões</p>
              </div>
            </div>
          </Link>

          <Link
            href="/super-admin/questions"
            className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all p-6 border-2 border-transparent hover:border-blue-500"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 transition-colors">
                <BookOpenIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Ver Todas</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Gerenciar banco</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* Distribuição por Tipo */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Questões por Tipo
          </h2>
          <div className="space-y-4">
            {byType.map(({ type, count }) => (
              <div key={type} className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[140px]">
                  {TYPE_LABELS[type]}
                </span>
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                      style={{
                        width: totalQuestions > 0 ? `${(count / totalQuestions) * 100}%` : '0%',
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white w-14 text-right">
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribuição por Dificuldade */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Questões por Dificuldade
          </h2>
          <div className="space-y-4">
            {byDifficulty.map(({ difficulty, count }) => {
              const colors = {
                VERY_EASY: 'from-green-400 to-green-500',
                EASY: 'from-green-500 to-green-600',
                MEDIUM: 'from-yellow-500 to-yellow-600',
                HARD: 'from-orange-500 to-orange-600',
                VERY_HARD: 'from-red-500 to-red-600',
                EXPERT: 'from-purple-500 to-purple-600',
              };
              return (
                <div key={difficulty} className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[140px]">
                    {DIFFICULTY_LABELS[difficulty]}
                  </span>
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className={`bg-gradient-to-r ${colors[difficulty]} h-3 rounded-full transition-all duration-500`}
                        style={{
                          width: totalQuestions > 0 ? `${(count / totalQuestions) * 100}%` : '0%',
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white w-14 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Questões Recentes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Questões Recentes
          </h2>
          <Link
            href="/super-admin/questions"
            className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium transition-colors"
          >
            Ver todas →
          </Link>
        </div>
        <div className="space-y-4">
          {recentQuestions.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-12">
              Nenhuma questão criada ainda
            </p>
          ) : (
            recentQuestions.map((question) => (
              <div
                key={question.id}
                className="flex items-start gap-4 p-5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all border border-gray-100 dark:border-gray-700"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {question.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                    {question.statement}
                  </p>
                  <div className="flex items-center flex-wrap gap-2">
                    <Badge variant="info" size="sm">
                      {TYPE_LABELS[question.type]}
                    </Badge>
                    <Badge
                      variant={
                        question.difficulty === 'VERY_EASY' || question.difficulty === 'EASY'
                          ? 'success'
                          : question.difficulty === 'MEDIUM'
                          ? 'warning'
                          : 'error'
                      }
                      size="sm"
                    >
                      {DIFFICULTY_LABELS[question.difficulty]}
                    </Badge>
                    {question.isPublic && (
                      <Badge variant="success" size="sm">
                        Pública
                      </Badge>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {question.points} {question.points === 1 ? 'ponto' : 'pontos'}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {new Date(question.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
