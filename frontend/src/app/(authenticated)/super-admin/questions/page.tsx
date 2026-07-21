'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  XMarkIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  FolderIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { questionsService } from '@/services/questions.service';
import { questionImageUploadService } from '@/services/question-image-upload.service';
import { questionCategoriesService } from '@/services/question-categories.service';
import { subjectsService } from '@/services/subjects.service';
import { getImageUrl } from '@/lib/image-utils';
import {
  Question,
  CreateQuestionDto,
  QuestionType,
  DifficultyLevel,
  QuestionOption,
  QuestionFilters,
} from '@/types/question-bank.types';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
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

export default function QuestionsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const toast = useToast();

  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [filters, setFilters] = useState<QuestionFilters>({
    page: 1,
    limit: 20,
  });

  const [formData, setFormData] = useState<CreateQuestionDto>({
    title: '',
    statement: '',
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: DifficultyLevel.MEDIUM,
    points: 1,
    isPublic: true,
    tags: [],
    explanation: '',
    correctAnswer: '',
    categoryId: undefined,
    subjectId: undefined,
    images: [],
  });

  const [options, setOptions] = useState<Omit<QuestionOption, 'id'>[]>([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);

  const [tagInput, setTagInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Buscar disciplinas
  const { data: subjectsData } = useQuery({
    queryKey: ['subjects-questions'],
    queryFn: async () => {
      try {
        return await subjectsService.findAll({ limit: 100 });
      } catch (error) {
        console.error('Erro ao carregar disciplinas:', error);
        return { data: [], meta: { total: 0, page: 1, limit: 100, totalPages: 1 } };
      }
    },
  });

  // Buscar categorias
  const { data: categoriesData } = useQuery({
    queryKey: ['question-categories-list'],
    queryFn: async () => {
      try {
        return await questionCategoriesService.findAll({ limit: 100 });
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        return { data: [], meta: { total: 0, page: 1, limit: 100, totalPages: 1 } };
      }
    },
  });

  // Buscar questões
  const { data: questionsData, isLoading } = useQuery({
    queryKey: ['questions', filters],
    queryFn: async () => {
      try {
        return await questionsService.findAll(filters);
      } catch (error) {
        console.error('Erro ao carregar questões:', error);
        toast.error('Erro ao carregar questões');
        return { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 1 } };
      }
    },
  });

  // Mutation para criar
  const createMutation = useMutation({
    mutationFn: (data: CreateQuestionDto) => questionsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success('Questão criada com sucesso!');
      setShowModal(false);
      resetForm();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Não foi possível criar a questão';
      toast.error(message);
    },
  });

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateQuestionDto }) =>
      questionsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success('Questão atualizada com sucesso!');
      setShowModal(false);
      setSelectedQuestion(null);
      resetForm();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Não foi possível atualizar a questão';
      toast.error(message);
    },
  });

  // Mutation para deletar
  const deleteMutation = useMutation({
    mutationFn: (id: string) => questionsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success('Questão removida com sucesso!');
      setShowDeleteDialog(false);
      setSelectedQuestion(null);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Não foi possível remover a questão';
      toast.error(message);
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      statement: '',
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: DifficultyLevel.MEDIUM,
      points: 1,
      isPublic: true,
      tags: [],
      explanation: '',
      correctAnswer: '',
      categoryId: undefined,
      subjectId: undefined,
      images: [],
    });
    setOptions([
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ]);
    setTagInput('');
    setErrors({});
  };

  // Handler para preview de imagem
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Imagem muito grande! Tamanho máximo: 10MB');
      e.target.value = '';
      return;
    }

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato inválido! Use JPEG, PNG, WEBP ou GIF');
      e.target.value = '';
      return;
    }

    // Criar preview em base64 para exibição imediata
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Preview = reader.result as string;
      setImagePreview(base64Preview);

      // Fazer upload DEPOIS de criar o preview
      try {
        setUploadingImage(true);
        const imageUrl = await questionImageUploadService.uploadImage(file);

        // Adicionar à lista de imagens com a URL do servidor
        setFormData(prev => ({
          ...prev,
          images: [...(prev.images || []), imageUrl],
        }));

        toast.success('Imagem adicionada!');
      } catch (error: any) {
        console.error('Erro ao fazer upload:', error);
        toast.error(error?.message || 'Erro ao enviar imagem');
      } finally {
        // Limpar preview e input
        setImagePreview(null);
        setUploadingImage(false);
        e.target.value = '';
      }
    };

    reader.readAsDataURL(file);
  };

  // Handler para remover imagem
  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || [],
    }));
    toast.success('Imagem removida');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validar título
    if (!formData.title?.trim()) {
      newErrors.title = 'Título é obrigatório';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Título deve ter pelo menos 5 caracteres';
    } else if (formData.title.trim().length > 200) {
      newErrors.title = 'Título deve ter no máximo 200 caracteres';
    }

    // Validar enunciado
    if (!formData.statement?.trim()) {
      newErrors.statement = 'Enunciado é obrigatório';
    } else if (formData.statement.trim().length < 10) {
      newErrors.statement = 'Enunciado deve ter pelo menos 10 caracteres';
    } else if (formData.statement.trim().length > 2000) {
      newErrors.statement = 'Enunciado deve ter no máximo 2000 caracteres';
    }

    // Validar pontos
    if (formData.points < 0) {
      newErrors.points = 'Pontos não podem ser negativos';
    } else if (formData.points > 100) {
      newErrors.points = 'Pontos devem ser no máximo 100';
    }

    // Validações específicas por tipo
    if (formData.type === QuestionType.MULTIPLE_CHOICE) {
      const validOptions = options.filter(opt => opt.text.trim());
      if (validOptions.length < 2) {
        newErrors.options = 'Múltipla escolha precisa de pelo menos 2 opções';
      }
      if (!validOptions.some(opt => opt.isCorrect)) {
        newErrors.options = 'Marque pelo menos uma opção como correta';
      }
      // Validar se há texto vazio entre opções válidas
      const hasEmptyBetween = options.some((opt, idx) =>
        idx < options.length - 1 && !opt.text.trim() && options[idx + 1].text.trim()
      );
      if (hasEmptyBetween) {
        newErrors.options = 'Remova opções vazias ou preencha todas';
      }
    }

    if (formData.type === QuestionType.TRUE_FALSE && !formData.correctAnswer) {
      newErrors.correctAnswer = 'Selecione a resposta correta';
    }

    // Validar explicação se fornecida
    if (formData.explanation && formData.explanation.length > 1000) {
      newErrors.explanation = 'Explicação deve ter no máximo 1000 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    const payload: CreateQuestionDto = {
      ...formData,
      title: formData.title.trim(),
      statement: formData.statement.trim(),
      explanation: formData.explanation?.trim() || undefined,
      options: formData.type === QuestionType.MULTIPLE_CHOICE
        ? options.filter(opt => opt.text.trim())
        : undefined,
    };

    if (selectedQuestion) {
      updateMutation.mutate({ id: selectedQuestion.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (question: Question) => {
    setSelectedQuestion(question);

    // Parse images if stored as JSON string
    let questionImages: string[] = [];
    if (question.images) {
      try {
        questionImages = typeof question.images === 'string'
          ? JSON.parse(question.images)
          : Array.isArray(question.images)
          ? question.images
          : [];
      } catch (e) {
        questionImages = [];
      }
    }

    setFormData({
      title: question.title || '',
      statement: question.statement || '',
      type: question.type,
      difficulty: question.difficulty,
      points: question.points,
      explanation: question.explanation || '',
      categoryId: question.categoryId || undefined,
      subjectId: question.subjectId || undefined,
      isPublic: question.isPublic,
      correctAnswer: question.correctAnswer || '',
      tags: question.tags || [],
      images: questionImages,
    });

    if (question.type === QuestionType.MULTIPLE_CHOICE && question.options) {
      setOptions(question.options.length > 0 ? question.options : [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ]);
    } else {
      setOptions([
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ]);
    }

    setErrors({});
    setShowModal(true);
  };

  const handleNew = () => {
    resetForm();
    setSelectedQuestion(null);
    setShowModal(true);
  };

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, { text: '', isCorrect: false }]);
    } else {
      toast.error('Máximo de 10 opções permitidas');
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
      if (errors.options) setErrors({ ...errors, options: '' });
    }
  };

  const updateOption = (index: number, field: keyof QuestionOption, value: string | boolean) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
    if (errors.options) setErrors({ ...errors, options: '' });
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag) {
      toast.error('Digite uma tag');
      return;
    }
    if (tag.length > 50) {
      toast.error('Tag deve ter no máximo 50 caracteres');
      return;
    }
    if (formData.tags && formData.tags.length >= 10) {
      toast.error('Máximo de 10 tags permitidas');
      return;
    }
    if (formData.tags?.includes(tag)) {
      toast.error('Tag já adicionada');
      return;
    }
    setFormData({
      ...formData,
      tags: [...(formData.tags || []), tag],
    });
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(t => t !== tag) || [],
    });
  };

  const questions = questionsData?.data || [];
  const totalPages = questionsData?.meta?.totalPages || 1;

  return (
    <>
      <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={() => {
            if (selectedQuestion) {
              deleteMutation.mutate(selectedQuestion.id);
            }
          }}
          title="Confirmar exclusão"
          message={`Tem certeza que deseja remover a questão "${selectedQuestion?.title}"? Atividades que a utilizam não serão afetadas.`}
          confirmText="Sim, excluir"
          cancelText="Cancelar"
        />

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Banco de Questões
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Gerencie questões para o sistema
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowFilters(!showFilters)}
                leftIcon={<FunnelIcon className="h-5 w-5" />}
              >
                {showFilters ? 'Ocultar' : 'Filtros'}
              </Button>
              <Button onClick={handleNew} leftIcon={<PlusIcon className="h-5 w-5" />}>
                Nova Questão
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-7 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <DocumentTextIcon className="h-12 w-12 text-blue-200 opacity-80" />
              <div className="text-right">
                <p className="text-blue-100 text-xs font-semibold uppercase tracking-wide mb-1">Total</p>
                <p className="text-4xl font-bold">{questionsData?.meta?.total || 0}</p>
              </div>
            </div>
            <div className="h-1 bg-blue-400 rounded-full opacity-50"></div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-7 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <EyeIcon className="h-12 w-12 text-green-200 opacity-80" />
              <div className="text-right">
                <p className="text-green-100 text-xs font-semibold uppercase tracking-wide mb-1">Públicas</p>
                <p className="text-4xl font-bold">{questions.filter(q => q.isPublic).length}</p>
              </div>
            </div>
            <div className="h-1 bg-green-400 rounded-full opacity-50"></div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-7 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <CheckCircleIcon className="h-12 w-12 text-purple-200 opacity-80" />
              <div className="text-right">
                <p className="text-purple-100 text-xs font-semibold uppercase tracking-wide mb-1">M. Escolha</p>
                <p className="text-4xl font-bold">
                  {questions.filter(q => q.type === QuestionType.MULTIPLE_CHOICE).length}
                </p>
              </div>
            </div>
            <div className="h-1 bg-purple-400 rounded-full opacity-50"></div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-7 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <FolderIcon className="h-12 w-12 text-orange-200 opacity-80" />
              <div className="text-right">
                <p className="text-orange-100 text-xs font-semibold uppercase tracking-wide mb-1">Categorias</p>
                <p className="text-4xl font-bold">{categoriesData?.data?.length || 0}</p>
              </div>
            </div>
            <div className="h-1 bg-orange-400 rounded-full opacity-50"></div>
          </div>
        </div>

        {/* Filtros */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                placeholder="Buscar por título..."
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
            </div>
          </div>
        )}

        {/* Lista de Questões */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" text="Carregando questões..." />
          </div>
        ) : questions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
            <DocumentTextIcon className="h-20 w-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Nenhuma questão encontrada
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {filters.search || filters.type || filters.difficulty || filters.categoryId
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando uma questão para o banco'}
            </p>
            <Button onClick={handleNew} leftIcon={<PlusIcon className="h-5 w-5" />}>
              Criar Primeira Questão
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-5 mb-8">
              {questions.map((question) => (
                <div
                  key={question.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-all p-8 border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between gap-6 mb-5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start flex-col sm:flex-row sm:items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {question.title}
                        </h3>
                        <div className="flex items-center flex-wrap gap-2">
                          <Badge variant={DIFFICULTY_COLORS[question.difficulty]} size="sm">
                            {DIFFICULTY_LABELS[question.difficulty]}
                          </Badge>
                          <Badge variant="info" size="sm">
                            {TYPE_LABELS[question.type]}
                          </Badge>
                          {question.isPublic ? (
                            <Badge variant="success" size="sm">
                              <EyeIcon className="h-3 w-3 mr-1" />
                              Pública
                            </Badge>
                          ) : (
                            <Badge variant="default" size="sm">
                              <EyeSlashIcon className="h-3 w-3 mr-1" />
                              Privada
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-base text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
                        {question.statement}
                      </p>
                      <div className="flex items-center flex-wrap gap-3 text-sm">
                        <span className="inline-flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-300">
                          <span className="text-primary-600 dark:text-primary-400">{question.points}</span>
                          {question.points === 1 ? 'ponto' : 'pontos'}
                        </span>
                        {question.category && (
                          <Badge variant="default" size="sm">
                            <FolderIcon className="h-3 w-3 mr-1" />
                            {question.category.name}
                          </Badge>
                        )}
                        {question.subject && (
                          <Badge variant="default" size="sm">
                            {question.subject.name}
                          </Badge>
                        )}
                      </div>
                      {question.tags && question.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {question.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => {
                        setSelectedQuestion(question);
                        setShowPreviewModal(true);
                      }}
                      leftIcon={<EyeIcon className="h-4 w-4" />}
                      className="flex-1"
                    >
                      Preview
                    </Button>
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => handleEdit(question)}
                      leftIcon={<PencilIcon className="h-4 w-4" />}
                      className="flex-1"
                    >
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      size="md"
                      onClick={() => {
                        setSelectedQuestion(question);
                        setShowDeleteDialog(true);
                      }}
                      leftIcon={<TrashIcon className="h-4 w-4" />}
                      className="flex-1"
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  variant="secondary"
                  onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                  disabled={filters.page === 1}
                >
                  Anterior
                </Button>
                <div className="flex items-center px-4 text-sm text-gray-600 dark:text-gray-400">
                  Página <span className="font-bold mx-1">{filters.page}</span> de <span className="font-bold ml-1">{totalPages}</span>
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

        {/* Modal de Formulário */}
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedQuestion(null);
            resetForm();
          }}
          title={selectedQuestion ? 'Editar Questão' : 'Nova Questão'}
          size="4xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto px-2">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Informações Básicas
              </h3>

              <div>
                <Input
                  label="Título da Questão"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (errors.title) setErrors({ ...errors, title: '' });
                  }}
                  required
                  placeholder="Ex: Teorema de Pitágoras - Aplicação"
                  error={errors.title}
                  maxLength={200}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {(formData.title?.length || 0)}/200 caracteres
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enunciado da Questão <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.statement}
                  onChange={(e) => {
                    setFormData({ ...formData, statement: e.target.value });
                    if (errors.statement) setErrors({ ...errors, statement: '' });
                  }}
                  rows={4}
                  required
                  maxLength={2000}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                    errors.statement
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Descreva a questão com clareza e objetividade..."
                />
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-red-600 dark:text-red-400">{errors.statement}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(formData.statement?.length || 0)}/2000 caracteres
                  </p>
                </div>
              </div>

              {/* Upload de Imagens */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Imagens Ilustrativas (Opcional)
                </label>
                <div className="space-y-3">
                  {/* Botão de Upload */}
                  <div>
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      onChange={handleImageSelect}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                    <label
                      htmlFor="image-upload"
                      className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <PhotoIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {uploadingImage ? 'Enviando...' : 'Adicionar Imagem'}
                      </span>
                    </label>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      JPEG, PNG, WEBP ou GIF - Máx. 10MB
                    </p>
                  </div>

                  {/* Mini Preview durante Upload */}
                  {imagePreview && uploadingImage && (
                    <div className="border border-blue-300 dark:border-blue-600 rounded-lg p-3 bg-blue-50 dark:bg-blue-900/20">
                      <div className="flex items-center gap-3">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-20 h-20 object-cover rounded border border-blue-200 dark:border-blue-700"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Enviando imagem...</p>
                          <div className="mt-2 w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 overflow-hidden">
                            <div className="bg-blue-600 dark:bg-blue-400 h-full rounded-full animate-pulse" style={{ width: '70%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Preview das Imagens Carregadas */}
                  {formData.images && formData.images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {formData.images.map((imageUrl, index) => (
                        <div
                          key={`uploaded-${index}`}
                          className="relative group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800"
                        >
                          <img
                            src={getImageUrl(imageUrl)}
                            alt={`Imagem ${index + 1}`}
                            className="w-full h-32 object-cover"
                            onError={(e) => {
                              // Fallback se a imagem não carregar
                              const target = e.target as HTMLImageElement;
                              target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%" y="50%" text-anchor="middle" dy=".3em"%3EImagem%3C/text%3E%3C/svg%3E';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                            title="Remover imagem"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Tipo de Questão"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as QuestionType })}
                  required
                  options={Object.values(QuestionType).map((type) => ({
                    value: type,
                    label: TYPE_LABELS[type],
                  }))}
                />

                <Select
                  label="Dificuldade"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as DifficultyLevel })}
                  required
                  options={Object.values(DifficultyLevel).map((difficulty) => ({
                    value: difficulty,
                    label: DIFFICULTY_LABELS[difficulty],
                  }))}
                />
              </div>
            </div>

            {/* Opções de Resposta - Múltipla Escolha */}
            {formData.type === QuestionType.MULTIPLE_CHOICE && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Opções de Resposta
                </h3>

                <div className="space-y-3">
                  {options.map((option, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <div className="flex items-center pt-3">
                        <input
                          type="checkbox"
                          checked={option.isCorrect}
                          onChange={(e) => updateOption(index, 'isCorrect', e.target.checked)}
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          title="Marcar como correta"
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          value={option.text}
                          onChange={(e) => updateOption(index, 'text', e.target.value)}
                          placeholder={`Opção ${String.fromCharCode(65 + index)}`}
                          maxLength={300}
                        />
                      </div>
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Remover opção"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {errors.options && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.options}</p>
                )}

                {options.length < 10 && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={addOption}
                    size="sm"
                  >
                    + Adicionar Opção
                  </Button>
                )}
              </div>
            )}

            {/* Verdadeiro/Falso */}
            {formData.type === QuestionType.TRUE_FALSE && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Resposta Correta
                </h3>

                <Select
                  label="Resposta Correta"
                  value={formData.correctAnswer || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, correctAnswer: e.target.value });
                    if (errors.correctAnswer) setErrors({ ...errors, correctAnswer: '' });
                  }}
                  required
                  error={errors.correctAnswer}
                  options={[
                    { value: '', label: 'Selecione a resposta...' },
                    { value: 'true', label: 'Verdadeiro' },
                    { value: 'false', label: 'Falso' },
                  ]}
                />
              </div>
            )}

            {/* Resposta Curta / Preencher Lacunas */}
            {(formData.type === QuestionType.SHORT_ANSWER || formData.type === QuestionType.FILL_IN_BLANK) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Resposta Esperada
                </h3>

                <Input
                  label="Resposta Modelo (opcional)"
                  value={formData.correctAnswer || ''}
                  onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                  placeholder="Digite a resposta esperada..."
                  maxLength={500}
                />
              </div>
            )}

            {/* Categorização */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Categorização e Metadados
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Categoria"
                  value={formData.categoryId || ''}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value || undefined })}
                  options={[
                    { value: '', label: 'Sem categoria' },
                    ...(categoriesData?.data.map((category) => ({
                      value: category.id,
                      label: category.name,
                    })) || []),
                  ]}
                />

                <Select
                  label="Disciplina"
                  value={formData.subjectId || ''}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value || undefined })}
                  options={[
                    { value: '', label: 'Sem disciplina' },
                    ...(subjectsData?.data.map((subject) => ({
                      value: subject.id,
                      label: subject.name,
                    })) || []),
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Pontos"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.points.toString()}
                    onChange={(e) => {
                      setFormData({ ...formData, points: parseFloat(e.target.value) || 0 });
                      if (errors.points) setErrors({ ...errors, points: '' });
                    }}
                    required
                    error={errors.points}
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Questão pública (visível para professores)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Explicação */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Gabarito Comentado (Opcional)
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Explicação da Resposta Correta
                </label>
                <textarea
                  value={formData.explanation || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, explanation: e.target.value });
                    if (errors.explanation) setErrors({ ...errors, explanation: '' });
                  }}
                  rows={3}
                  maxLength={1000}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                    errors.explanation
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Explique por que a resposta está correta..."
                />
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-red-600 dark:text-red-400">{errors.explanation}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formData.explanation?.length || 0}/1000 caracteres
                  </p>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Tags (Opcional)
              </h3>

              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Digite uma tag e pressione Enter"
                  maxLength={50}
                />
                <Button type="button" onClick={addTag} variant="secondary">
                  Adicionar
                </Button>
              </div>

              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-blue-900 dark:hover:text-blue-100"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formData.tags?.length || 0}/10 tags
              </p>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowModal(false);
                  setSelectedQuestion(null);
                  resetForm();
                }}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                isLoading={createMutation.isPending || updateMutation.isPending}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {selectedQuestion ? 'Atualizar Questão' : 'Criar Questão'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal de Preview da Questão */}
        <Modal
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false);
            setSelectedQuestion(null);
          }}
          title="Preview da Questão"
          size="3xl"
        >
          {selectedQuestion && (() => {
            // Parse images if stored as JSON string
            let questionImages: string[] = [];
            if (selectedQuestion.images) {
              try {
                questionImages = typeof selectedQuestion.images === 'string'
                  ? JSON.parse(selectedQuestion.images)
                  : Array.isArray(selectedQuestion.images)
                  ? selectedQuestion.images
                  : [];
              } catch (e) {
                questionImages = [];
              }
            }

            return (
              <div className="max-h-[70vh] overflow-y-auto px-2">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-6">
                  {/* Cabeçalho da Questão */}
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                      {selectedQuestion.title}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={DIFFICULTY_COLORS[selectedQuestion.difficulty]} size="sm">
                        {DIFFICULTY_LABELS[selectedQuestion.difficulty]}
                      </Badge>
                      <Badge variant="info" size="sm">
                        {TYPE_LABELS[selectedQuestion.type]}
                      </Badge>
                      <Badge variant="default" size="sm">
                        {selectedQuestion.points} {selectedQuestion.points === 1 ? 'ponto' : 'pontos'}
                      </Badge>
                      {selectedQuestion.isPublic ? (
                        <Badge variant="success" size="sm">
                          <EyeIcon className="h-3 w-3 mr-1" />
                          Pública
                        </Badge>
                      ) : (
                        <Badge variant="default" size="sm">
                          <EyeSlashIcon className="h-3 w-3 mr-1" />
                          Privada
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Enunciado */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                      Enunciado
                    </h3>
                    <p className="text-base text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                      {selectedQuestion.statement}
                    </p>
                  </div>

                  {/* Imagens Ilustrativas */}
                  {questionImages.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                        Imagens Ilustrativas
                      </h3>
                      <div className={`grid gap-4 ${questionImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        {questionImages.map((imageUrl, index) => (
                          <div
                            key={index}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900"
                          >
                            <img
                              src={getImageUrl(imageUrl)}
                              alt={`Imagem ilustrativa ${index + 1}`}
                              className="w-full h-auto object-contain max-h-80"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%" y="50%" text-anchor="middle" dy=".3em"%3EImagem não disponível%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Opções (Múltipla Escolha) */}
                {selectedQuestion.type === QuestionType.MULTIPLE_CHOICE && selectedQuestion.options && selectedQuestion.options.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                      Opções de Resposta
                    </h3>
                    <div className="space-y-2">
                      {selectedQuestion.options.map((option, index) => (
                        <div
                          key={index}
                          className={`flex items-start gap-3 p-3 rounded-lg border ${
                            option.isCorrect
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-600'
                              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold text-sm ${
                            option.isCorrect
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                          }`}>
                            {String.fromCharCode(65 + index)}
                          </span>
                          <p className={`flex-1 text-base ${
                            option.isCorrect
                              ? 'text-gray-900 dark:text-white font-medium'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {option.text}
                          </p>
                          {option.isCorrect && (
                            <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resposta Correta (Verdadeiro/Falso) */}
                {selectedQuestion.type === QuestionType.TRUE_FALSE && selectedQuestion.correctAnswer && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                      Resposta Correta
                    </h3>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-500 dark:border-green-600 rounded-lg">
                      <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <span className="text-base font-semibold text-gray-900 dark:text-white">
                        {selectedQuestion.correctAnswer === 'true' ? 'Verdadeiro' : 'Falso'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Resposta Esperada (Curta/Preencher) */}
                {(selectedQuestion.type === QuestionType.SHORT_ANSWER || selectedQuestion.type === QuestionType.FILL_IN_BLANK) && selectedQuestion.correctAnswer && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                      Resposta Esperada
                    </h3>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-500 dark:border-blue-600 rounded-lg">
                      <p className="text-base text-gray-900 dark:text-white">
                        {selectedQuestion.correctAnswer}
                      </p>
                    </div>
                  </div>
                )}

                {/* Explicação */}
                {selectedQuestion.explanation && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                      Gabarito Comentado
                    </h3>
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-500 dark:border-yellow-600 rounded-lg">
                      <p className="text-base text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                        {selectedQuestion.explanation}
                      </p>
                    </div>
                  </div>
                )}

                {/* Metadados */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                    Informações Adicionais
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {selectedQuestion.category && (
                      <div className="flex items-center gap-2">
                        <FolderIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">Categoria:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {selectedQuestion.category.name}
                        </span>
                      </div>
                    )}
                    {selectedQuestion.subject && (
                      <div className="flex items-center gap-2">
                        <DocumentTextIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">Disciplina:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {selectedQuestion.subject.name}
                        </span>
                      </div>
                    )}
                  </div>
                  {selectedQuestion.tags && selectedQuestion.tags.length > 0 && (
                    <div className="mt-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Tags:</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedQuestion.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            );
          })()}
        </Modal>
    </>
  );
}
