'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { questionCategoriesService } from '@/services/question-categories.service';
import { subjectsService } from '@/services/subjects.service';
import { QuestionCategory, CreateQuestionCategoryDto } from '@/types/question-bank.types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';

const COLORS = [
  { name: 'Vermelho', value: '#EF4444' },
  { name: 'Laranja', value: '#F59E0B' },
  { name: 'Verde', value: '#10B981' },
  { name: 'Azul', value: '#3B82F6' },
  { name: 'Roxo', value: '#8B5CF6' },
  { name: 'Rosa', value: '#EC4899' },
  { name: 'Turquesa', value: '#14B8A6' },
  { name: 'Âmbar', value: '#F97316' },
  { name: 'Índigo', value: '#6366F1' },
  { name: 'Lima', value: '#84CC16' },
];

export default function QuestionCategoriesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const toast = useToast();

  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CreateQuestionCategoryDto>({
    name: '',
    description: '',
    color: COLORS[0].value,
    subjectId: undefined,
  });

  // Buscar disciplinas
  const { data: subjectsData } = useQuery({
    queryKey: ['subjects-categories'],
    queryFn: async () => {
      try {
        const response = await subjectsService.findAll({ limit: 100 });
        return response;
      } catch (error) {
        console.error('Erro ao carregar disciplinas:', error);
        return { data: [], meta: { total: 0, page: 1, limit: 100, totalPages: 1 } };
      }
    },
  });

  // Buscar categorias
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['question-categories'],
    queryFn: async () => {
      try {
        return await questionCategoriesService.findAll({ limit: 100 });
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        toast.error('Erro ao carregar categorias');
        return { data: [], meta: { total: 0, page: 1, limit: 100, totalPages: 1 } };
      }
    },
  });

  // Mutation para criar
  const createMutation = useMutation({
    mutationFn: (data: CreateQuestionCategoryDto) => questionCategoriesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-categories'] });
      queryClient.invalidateQueries({ queryKey: ['question-categories-list'] });
      toast.success('Categoria criada com sucesso!');
      setShowModal(false);
      resetForm();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Não foi possível criar a categoria';
      toast.error(message);
    },
  });

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateQuestionCategoryDto }) =>
      questionCategoriesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-categories'] });
      queryClient.invalidateQueries({ queryKey: ['question-categories-list'] });
      toast.success('Categoria atualizada com sucesso!');
      setShowModal(false);
      setSelectedCategory(null);
      resetForm();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Não foi possível atualizar a categoria';
      toast.error(message);
    },
  });

  // Mutation para deletar
  const deleteMutation = useMutation({
    mutationFn: (id: string) => questionCategoriesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-categories'] });
      queryClient.invalidateQueries({ queryKey: ['question-categories-list'] });
      toast.success('Categoria removida com sucesso!');
      setShowDeleteDialog(false);
      setSelectedCategory(null);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Não foi possível remover a categoria';
      toast.error(message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: COLORS[0].value,
      subjectId: undefined,
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Nome deve ter no máximo 100 caracteres';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Descrição deve ter no máximo 500 caracteres';
    }

    if (!formData.color) {
      newErrors.color = 'Selecione uma cor';
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

    const trimmedData = {
      ...formData,
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined,
    };

    if (selectedCategory) {
      updateMutation.mutate({ id: selectedCategory.id, data: trimmedData });
    } else {
      createMutation.mutate(trimmedData);
    }
  };

  const handleEdit = (category: QuestionCategory) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name || '',
      description: category.description || '',
      subjectId: category.subjectId || undefined,
      color: category.color || COLORS[0].value,
    });
    setErrors({});
    setShowModal(true);
  };

  const handleNew = () => {
    resetForm();
    setSelectedCategory(null);
    setShowModal(true);
  };

  const categories = categoriesData?.data || [];
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={() => {
            if (selectedCategory) {
              deleteMutation.mutate(selectedCategory.id);
            }
          }}
          title="Confirmar exclusão"
          message={`Tem certeza que deseja remover a categoria "${selectedCategory?.name}"? As questões vinculadas não serão removidas.`}
          confirmText="Sim, excluir"
          cancelText="Cancelar"
        />

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Categorias de Questões
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Organize questões por categorias e disciplinas
              </p>
            </div>
            <Button onClick={handleNew} leftIcon={<PlusIcon className="h-5 w-5" />} size="lg">
              Nova Categoria
            </Button>
          </div>
        </div>

        {/* Stats & Search */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-8 text-white transform hover:scale-105 transition-transform">
              <div className="flex items-center justify-between mb-4">
                <FolderIcon className="h-14 w-14 text-blue-200 opacity-80" />
                <div className="text-right">
                  <p className="text-blue-100 text-xs font-semibold uppercase tracking-wide mb-2">Total de Categorias</p>
                  <p className="text-5xl font-bold">{categories.length}</p>
                </div>
              </div>
              <div className="h-1 bg-blue-400 rounded-full opacity-50"></div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <Input
                placeholder="Buscar categorias por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
                className="w-full text-lg"
              />
            </div>
          </div>
        </div>

        {/* Lista de Categorias */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" text="Carregando categorias..." />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
            <FolderIcon className="h-20 w-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria cadastrada'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm
                ? 'Tente ajustar sua busca ou limpar os filtros'
                : 'Comece criando uma categoria para organizar as questões'}
            </p>
            {!searchTerm && (
              <Button onClick={handleNew} leftIcon={<PlusIcon className="h-5 w-5" />}>
                Criar Primeira Categoria
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border-l-[6px] group"
                style={{ borderLeftColor: category.color || '#3B82F6' }}
              >
                <div className="p-8">
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-4 h-4 rounded-full shadow-lg"
                          style={{ backgroundColor: category.color || '#3B82F6' }}
                        />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                          {category.name}
                        </h3>
                      </div>
                      {category.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4 leading-relaxed">
                          {category.description}
                        </p>
                      )}
                      {category.subject && (
                        <Badge variant="info" size="md">
                          {category.subject.name}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {category._count && (
                    <div className="flex items-center gap-3 text-sm mb-5 pb-5 border-b border-gray-100 dark:border-gray-700">
                      <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        {category._count.questions} {category._count.questions === 1 ? 'questão' : 'questões'}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => handleEdit(category)}
                      leftIcon={<PencilIcon className="h-4 w-4" />}
                      className="flex-1"
                    >
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      size="md"
                      onClick={() => {
                        setSelectedCategory(category);
                        setShowDeleteDialog(true);
                      }}
                      leftIcon={<TrashIcon className="h-4 w-4" />}
                      className="flex-1"
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Formulário */}
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedCategory(null);
            resetForm();
          }}
          title={selectedCategory ? 'Editar Categoria' : 'Nova Categoria'}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome */}
            <div>
              <Input
                label="Nome da Categoria"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                required
                placeholder="Ex: Geometria, Álgebra, Gramática..."
                error={errors.name}
                maxLength={100}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {(formData.name?.length || 0)}/100 caracteres
              </p>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descrição (opcional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  if (errors.description) setErrors({ ...errors, description: '' });
                }}
                rows={3}
                maxLength={500}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                  errors.description
                    ? 'border-red-300 dark:border-red-600'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Breve descrição sobre esta categoria..."
              />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-red-600 dark:text-red-400">{errors.description}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formData.description?.length || 0}/500 caracteres
                </p>
              </div>
            </div>

            {/* Disciplina */}
            <Select
              label="Disciplina (opcional)"
              value={formData.subjectId || ''}
              onChange={(e) => setFormData({ ...formData, subjectId: e.target.value || undefined })}
              options={[
                { value: '', label: 'Todas as disciplinas' },
                ...(subjectsData?.data?.map((subject) => ({
                  value: subject.id,
                  label: subject.name,
                })) || []),
              ]}
            />

            {/* Cor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Cor da Categoria
              </label>
              <div className="grid grid-cols-5 gap-3">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, color: color.value });
                      if (errors.color) setErrors({ ...errors, color: '' });
                    }}
                    className={`relative h-12 w-full rounded-lg border-2 transition-all hover:scale-105 ${
                      formData.color === color.value
                        ? 'border-gray-900 dark:border-white ring-2 ring-gray-900 dark:ring-white ring-offset-2'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  >
                    {formData.color === color.value && (
                      <CheckCircleIcon className="absolute inset-0 m-auto h-6 w-6 text-white drop-shadow-lg" />
                    )}
                  </button>
                ))}
              </div>
              {errors.color && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">{errors.color}</p>
              )}
              {formData.color && (
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <div
                    className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: formData.color }}
                  />
                  <span>Cor selecionada</span>
                </div>
              )}
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowModal(false);
                  setSelectedCategory(null);
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
                {selectedCategory ? 'Atualizar Categoria' : 'Criar Categoria'}
              </Button>
            </div>
          </form>
        </Modal>
    </>
  );
}
