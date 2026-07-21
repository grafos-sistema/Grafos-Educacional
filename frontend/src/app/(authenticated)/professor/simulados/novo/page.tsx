'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { examsService, ExamType, saebDescriptorsService } from '@/services/exams.service';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeftIcon,
  PlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

const examTypeOptions = [
  { value: ExamType.SAEB, label: 'SAEB' },
  { value: ExamType.DIAGNOSTIC, label: 'Diagnóstico' },
  { value: ExamType.FORMATIVE, label: 'Formativo' },
  { value: ExamType.SUMMATIVE, label: 'Somativo' },
  { value: ExamType.CUSTOM, label: 'Personalizado' },
];

export default function NewExamPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: ExamType.SAEB,
    gradeLevel: '',
    duration: 60,
    subjectId: '',
  });

  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [questionSearch, setQuestionSearch] = useState('');
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);

  // Buscar matérias (simplificado - você pode criar um endpoint específico)
  const { data: subjects } = useQuery({
    queryKey: ['subjects', user?.institutionId],
    queryFn: async () => {
      // Implementar busca de matérias
      return [];
    },
    enabled: !!user?.institutionId,
  });

  // Buscar questões (simplificado)
  const { data: questions } = useQuery({
    queryKey: ['questions', user?.institutionId, formData.subjectId],
    queryFn: async () => {
      // Implementar busca de questões
      return [];
    },
    enabled: !!user?.institutionId && showQuestionSelector,
  });

  // Criar simulado
  const createMutation = useMutation({
    mutationFn: (publish: boolean) => {
      if (!user?.institutionId) throw new Error('Institution not found');

      return examsService.create({
        title: formData.title,
        description: formData.description,
        type: formData.type,
        gradeLevel: formData.gradeLevel || undefined,
        duration: formData.duration,
        institutionId: user.institutionId,
        subjectId: formData.subjectId || undefined,
        questionIds: selectedQuestions,
      });
    },
    onSuccess: async (exam, publish) => {
      if (publish) {
        await examsService.publish(exam.id);
      }
      queryClient.invalidateQueries({ queryKey: ['professor-exams'] });
      router.push('/professor/simulados');
    },
  });

  const handleSubmit = (publish: boolean) => {
    if (!formData.title.trim()) {
      toast.error('Por favor, informe o título do simulado');
      return;
    }

    if (selectedQuestions.length === 0) {
      toast.error('Por favor, adicione pelo menos uma questão');
      return;
    }

    createMutation.mutate(publish);
  };

  const toggleQuestion = (questionId: string) => {
    setSelectedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Novo Simulado
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Crie um novo simulado ou avaliação
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações Básicas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Informações Básicas
            </h3>

            <div className="space-y-4">
              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Ex: Simulado SAEB - Matemática 5º ano"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descreva o objetivo e conteúdo do simulado..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Tipo e Série */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as ExamType })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {examTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Série/Ano
                  </label>
                  <input
                    type="text"
                    value={formData.gradeLevel}
                    onChange={(e) =>
                      setFormData({ ...formData, gradeLevel: e.target.value })
                    }
                    placeholder="Ex: 5º ano"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Duração e Matéria */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duração (minutos)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: parseInt(e.target.value) })
                    }
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Matéria
                  </label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) =>
                      setFormData({ ...formData, subjectId: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Selecione...</option>
                    {subjects?.map((subject: any) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Seleção de Questões */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Questões ({selectedQuestions.length})
              </h3>
              <Button
                onClick={() => setShowQuestionSelector(!showQuestionSelector)}
                leftIcon={<PlusIcon className="h-4 w-4" />}
                size="sm"
              >
                Adicionar Questões
              </Button>
            </div>

            {selectedQuestions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhuma questão adicionada. Clique em "Adicionar Questões" para começar.
              </div>
            ) : (
              <div className="space-y-2">
                {selectedQuestions.map((questionId, index) => (
                  <div
                    key={questionId}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        #{index + 1}
                      </span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        Questão {questionId.slice(0, 8)}...
                      </span>
                    </div>
                    <button
                      onClick={() => toggleQuestion(questionId)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Resumo */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Resumo
            </h3>

            <div className="space-y-3 mb-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tipo</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {examTypeOptions.find((t) => t.value === formData.type)?.label}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Questões</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedQuestions.length}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pontuação Total</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedQuestions.length} pontos
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Duração</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formData.duration} minutos
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => handleSubmit(false)}
                disabled={createMutation.isPending}
                variant="secondary"
                className="w-full"
              >
                {createMutation.isPending ? 'Salvando...' : 'Salvar Rascunho'}
              </Button>

              <Button
                onClick={() => handleSubmit(true)}
                disabled={createMutation.isPending}
                variant="primary"
                className="w-full"
              >
                {createMutation.isPending ? 'Publicando...' : 'Salvar e Publicar'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Seleção de Questões */}
      {showQuestionSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Selecionar Questões
                </h3>
                <button
                  onClick={() => setShowQuestionSelector(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={questionSearch}
                  onChange={(e) => setQuestionSearch(e.target.value)}
                  placeholder="Buscar questões..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {!questions || questions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  Nenhuma questão disponível. Configure questões no banco de questões primeiro.
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((question: any) => (
                    <div
                      key={question.id}
                      onClick={() => toggleQuestion(question.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedQuestions.includes(question.id)
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 dark:text-white">
                            {question.statement}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="default" size="sm">
                              {question.difficulty}
                            </Badge>
                            <Badge variant="info" size="sm">
                              {question.subject?.name}
                            </Badge>
                          </div>
                        </div>
                        {selectedQuestions.includes(question.id) && (
                          <CheckIcon className="h-5 w-5 text-primary-600 flex-shrink-0 ml-3" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={() => setShowQuestionSelector(false)}
                variant="primary"
                className="w-full"
              >
                Confirmar Seleção ({selectedQuestions.length} questões)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
