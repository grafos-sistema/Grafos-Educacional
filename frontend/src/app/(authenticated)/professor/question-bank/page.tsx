'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  EyeIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { questionsService } from '@/services/questions.service';
import { questionCategoriesService } from '@/services/question-categories.service';
import { subjectsService } from '@/services/subjects.service';
import {
  Question,
  QuestionType,
  DifficultyLevel,
  QuestionFilters,
} from '@/types/question-bank.types';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/useToast';

const DIFFICULTY_COLORS: Record<DifficultyLevel, BadgeVariant> = {
  [DifficultyLevel.VERY_EASY]: 'success',
  [DifficultyLevel.EASY]: 'success',
  [DifficultyLevel.MEDIUM]: 'warning',
  [DifficultyLevel.HARD]: 'error',
  [DifficultyLevel.VERY_HARD]: 'error',
  [DifficultyLevel.EXPERT]: 'info',
};

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  [DifficultyLevel.VERY_EASY]: 'Muito Fácil',
  [DifficultyLevel.EASY]: 'Fácil',
  [DifficultyLevel.MEDIUM]: 'Médio',
  [DifficultyLevel.HARD]: 'Difícil',
  [DifficultyLevel.VERY_HARD]: 'Muito Difícil',
  [DifficultyLevel.EXPERT]: 'Especialista',
};

const TYPE_LABELS: Record<QuestionType, string> = {
  [QuestionType.MULTIPLE_CHOICE]: 'Múltipla Escolha',
  [QuestionType.OPEN_ENDED]: 'Resposta Aberta',
  [QuestionType.TRUE_FALSE]: 'Verdadeiro/Falso',
  [QuestionType.SHORT_ANSWER]: 'Resposta Curta',
  [QuestionType.ESSAY]: 'Dissertativa',
  [QuestionType.FILL_IN_BLANK]: 'Preencher Lacunas',
};

export default function QuestionBankPage() {
  const router = useRouter();
  const toast = useToast();

  const [showFilters, setShowFilters] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());

  const [filters, setFilters] = useState<QuestionFilters>({
    page: 1,
    limit: 20,
    // isPublic é adicionado automaticamente pelo findPublic
  });

  // Buscar disciplinas
  const { data: subjectsData } = useQuery({
    queryKey: ['subjects-bank'],
    queryFn: async () => {
      const response = await subjectsService.findAll({ limit: 100 });
      return response;
    },
  });

  // Buscar categorias
  const { data: categoriesData } = useQuery({
    queryKey: ['question-categories-bank'],
    queryFn: () => questionCategoriesService.findAll({ limit: 100 }),
  });

  // Buscar questões públicas
  const { data: questionsData, isLoading } = useQuery({
    queryKey: ['public-questions', filters],
    queryFn: () => questionsService.findPublic(filters),
  });

  const handlePreview = (question: Question) => {
    setSelectedQuestion(question);
    setShowPreview(true);
  };

  const toggleSelection = (questionId: string) => {
    const newSelection = new Set(selectedQuestions);
    if (newSelection.has(questionId)) {
      newSelection.delete(questionId);
    } else {
      newSelection.add(questionId);
    }
    setSelectedQuestions(newSelection);
  };

  const handleClearSelection = () => {
    setSelectedQuestions(new Set());
    toast.info('Todas as questões foram desmarcadas');
  };

  const handleCreateWorksheet = () => {
    if (selectedQuestions.size === 0) {
      toast.error('Selecione pelo menos uma questão');
      return;
    }

    // Buscar dados completos das questões selecionadas
    const selectedQuestionsData = questions.filter(q => selectedQuestions.has(q.id)).map(q => ({
      id: q.id,
      title: q.title,
      statement: q.statement,
      type: q.type,
      points: q.points || 1,
    }));

    // Salvar questões completas no sessionStorage
    sessionStorage.setItem('selectedQuestions', JSON.stringify(selectedQuestionsData));

    // Navegar para página de atividades
    router.push('/professor/worksheets?action=create');
  };

  const questions = questionsData?.data || [];
  const totalPages = questionsData?.meta?.totalPages || 1;

  return (
    <>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Banco de Questões
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Busque e selecione questões para suas atividades
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
              leftIcon={<FunnelIcon className="h-5 w-5" />}
            >
              Filtros
            </Button>
            {selectedQuestions.size > 0 && (
              <>
                <Button
                  variant="secondary"
                  onClick={handleClearSelection}
                >
                  Limpar ({selectedQuestions.size})
                </Button>
                <Button
                  onClick={handleCreateWorksheet}
                  leftIcon={<CheckCircleIcon className="h-5 w-5" />}
                >
                  Criar Atividade ({selectedQuestions.size})
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {questionsData?.meta?.total || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Questões disponíveis</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {selectedQuestions.size}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Selecionadas</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {questions.filter(q => q.difficulty === DifficultyLevel.EASY).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Questões fáceis</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {categoriesData?.data?.length || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Categorias</div>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Buscar por título ou enunciado..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              leftIcon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
            />

            <Select
              label="Tipo"
              value={filters.type || ''}
              onChange={(e) => setFilters({ ...filters, type: e.target.value as QuestionType || undefined, page: 1 })}
              options={[
                { value: '', label: 'Todos os tipos' },
                ...Object.values(QuestionType).map((type) => ({
                  value: type,
                  label: TYPE_LABELS[type],
                })),
              ]}
            />

            <Select
              label="Dificuldade"
              value={filters.difficulty || ''}
              onChange={(e) => setFilters({ ...filters, difficulty: e.target.value as DifficultyLevel || undefined, page: 1 })}
              options={[
                { value: '', label: 'Todas dificuldades' },
                ...Object.values(DifficultyLevel).map((difficulty) => ({
                  value: difficulty,
                  label: DIFFICULTY_LABELS[difficulty],
                })),
              ]}
            />

            <Select
              label="Categoria"
              value={filters.categoryId || ''}
              onChange={(e) => setFilters({ ...filters, categoryId: e.target.value || undefined, page: 1 })}
              options={[
                { value: '', label: 'Todas categorias' },
                ...(categoriesData?.data.map((category) => ({
                  value: category.id,
                  label: category.name,
                })) || []),
              ]}
            />

            <Select
              label="Disciplina"
              value={filters.subjectId || ''}
              onChange={(e) => setFilters({ ...filters, subjectId: e.target.value || undefined, page: 1 })}
              options={[
                { value: '', label: 'Todas disciplinas' },
                ...(subjectsData?.data.map((subject) => ({
                  value: subject.id,
                  label: subject.name,
                })) || []),
              ]}
            />
          </div>
        </div>
      )}

      {/* Lista de Questões */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Carregando questões..." />
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
          <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Nenhuma questão encontrada
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {filters.search || filters.type || filters.difficulty || filters.categoryId || filters.subjectId
              ? 'Tente ajustar os filtros de busca'
              : 'Não há questões públicas disponíveis no momento'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {questions.map((question) => {
              const isSelected = selectedQuestions.has(question.id);
              return (
                <div
                  key={question.id}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-all cursor-pointer border-2 ${
                    isSelected
                      ? 'border-blue-500 dark:border-blue-400'
                      : 'border-transparent'
                  }`}
                  onClick={() => toggleSelection(question.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {isSelected && (
                          <CheckCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        )}
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {question.title}
                        </h3>
                        <Badge variant={DIFFICULTY_COLORS[question.difficulty]} size="sm">
                          {DIFFICULTY_LABELS[question.difficulty]}
                        </Badge>
                        <Badge variant="info" size="sm">
                          {TYPE_LABELS[question.type]}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {question.statement}
                      </p>
                      <div className="flex items-center gap-3 text-sm flex-wrap">
                        <span className="text-gray-500 dark:text-gray-400">
                          {question.points} {question.points === 1 ? 'ponto' : 'pontos'}
                        </span>
                        {question.category && (
                          <Badge variant="default" size="sm">
                            {question.category.name}
                          </Badge>
                        )}
                        {question.subject && (
                          <Badge variant="default" size="sm">
                            {question.subject.name}
                          </Badge>
                        )}
                        {question.tags && question.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {question.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                              >
                                #{tag}
                              </span>
                            ))}
                            {question.tags.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{question.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(question);
                      }}
                      className="flex-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <EyeIcon className="h-4 w-4" />
                      Visualizar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelection(question.id);
                      }}
                      className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-2 ${
                        isSelected
                          ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                          : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                      }`}
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                      {isSelected ? 'Remover' : 'Selecionar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="secondary"
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                disabled={filters.page === 1}
              >
                Anterior
              </Button>
              <div className="flex items-center px-4 text-sm text-gray-600 dark:text-gray-400">
                Página {filters.page} de {totalPages}
              </div>
              <Button
                variant="secondary"
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                disabled={filters.page === totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </>
      )}

      {/* Modal de Preview */}
      <Modal
        isOpen={showPreview}
        onClose={() => {
          setShowPreview(false);
          setSelectedQuestion(null);
        }}
        title="Visualizar Questão"
        size="lg"
      >
        {selectedQuestion && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant={DIFFICULTY_COLORS[selectedQuestion.difficulty]} size="sm">
                  {DIFFICULTY_LABELS[selectedQuestion.difficulty]}
                </Badge>
                <Badge variant="info" size="sm">
                  {TYPE_LABELS[selectedQuestion.type]}
                </Badge>
                <span className="text-sm text-gray-500">
                  {selectedQuestion.points} {selectedQuestion.points === 1 ? 'ponto' : 'pontos'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {selectedQuestion.title}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {selectedQuestion.statement}
              </p>
            </div>

            {/* Opções para múltipla escolha */}
            {selectedQuestion.type === QuestionType.MULTIPLE_CHOICE && selectedQuestion.options && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Opções:</h4>
                <div className="space-y-2">
                  {selectedQuestion.options.map((option, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        option.isCorrect
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{String.fromCharCode(65 + index)})</span>
                        <span>{option.text}</span>
                        {option.isCorrect && (
                          <CheckCircleIcon className="h-5 w-5 text-green-600 ml-auto" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resposta correta para V/F */}
            {selectedQuestion.type === QuestionType.TRUE_FALSE && selectedQuestion.correctAnswer && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Resposta:</h4>
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  {selectedQuestion.correctAnswer === 'true' ? 'Verdadeiro' : 'Falso'}
                </div>
              </div>
            )}

            {/* Resposta esperada */}
            {(selectedQuestion.type === QuestionType.SHORT_ANSWER ||
              selectedQuestion.type === QuestionType.FILL_IN_BLANK) &&
              selectedQuestion.correctAnswer && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Resposta Esperada:</h4>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                  {selectedQuestion.correctAnswer}
                </div>
              </div>
            )}

            {/* Explicação */}
            {selectedQuestion.explanation && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Explicação:</h4>
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedQuestion.explanation}
                  </p>
                </div>
              </div>
            )}

            {/* Metadados */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedQuestion.category && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Categoria: </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedQuestion.category.name}
                    </span>
                  </div>
                )}
                {selectedQuestion.subject && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Disciplina: </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedQuestion.subject.name}
                    </span>
                  </div>
                )}
              </div>
              {selectedQuestion.tags && selectedQuestion.tags.length > 0 && (
                <div className="mt-3">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">Tags: </span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedQuestion.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowPreview(false);
                  setSelectedQuestion(null);
                }}
              >
                Fechar
              </Button>
              <Button
                onClick={() => {
                  if (selectedQuestion) {
                    toggleSelection(selectedQuestion.id);
                    setShowPreview(false);
                    setSelectedQuestion(null);
                  }
                }}
                leftIcon={<CheckCircleIcon className="h-5 w-5" />}
              >
                {selectedQuestions.has(selectedQuestion.id) ? 'Remover Seleção' : 'Selecionar Questão'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
