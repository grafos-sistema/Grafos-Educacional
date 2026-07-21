'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserRole } from '@/types/user.types';
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  BookOpenIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { classesService } from '@/services/classes.service';
import { lessonContentsService } from '@/services/lesson-contents.service';
import { teacherSubjectsService } from '@/services/teacher-subjects.service';
import { LessonContent, CreateLessonContentDto } from '@/types/lesson.types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';

export default function LessonContentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const toast = useToast();

  const [selectedClassSubjectId, setSelectedClassSubjectId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedContent, setSelectedContent] = useState<LessonContent | null>(null);
  const [formData, setFormData] = useState<CreateLessonContentDto>({
    date: new Date().toISOString().split('T')[0],
    title: '',
    content: '',
    objectives: '',
    methodology: '',
    resources: '',
    homework: '',
    observations: '',
    classSubjectId: '',
    teacherId: user?.teacherProfile?.id || '',
  });

  // Buscar disciplinas configuradas pelo professor
  const { data: myConfiguredSubjects = [] } = useQuery({
    queryKey: ['my-subjects'],
    queryFn: () => teacherSubjectsService.getMySubjects(),
  });

  // Buscar todas as turmas da instituição
  const { data: allClasses = [] } = useQuery({
    queryKey: ['all-classes', user?.institutionId],
    queryFn: async () => {
      if (!user?.institutionId) return [];
      const response = await classesService.findAll({
        institutionId: user.institutionId,
        isActive: true,
        limit: 200,
      });
      return response.data || [];
    },
    enabled: !!user?.institutionId,
  });

  // Buscar disciplinas de cada turma e filtrar pelas configuradas
  const configuredSubjectIds = myConfiguredSubjects.map(ts => ts.subjectId).sort().join(',');
  const classIds = allClasses.map(c => c.id).sort().join(',');

  const { data: teacherSubjects = [], isLoading: loadingSubjects } = useQuery({
    queryKey: ['classes-with-subjects-contents', user?.institutionId, configuredSubjectIds, classIds],
    queryFn: async () => {
      if (!myConfiguredSubjects.length || !allClasses.length) return [];

      const subjectIds = myConfiguredSubjects.map(ts => ts.subjectId);

      const results = await Promise.all(
        allClasses.map(async (classItem) => {
          try {
            const classSubjects = await classesService.getClassSubjects(classItem.id);
            return classSubjects
              .filter(cs => subjectIds.includes(cs.subjectId))
              .map(cs => ({
                ...cs,
                class: classItem,
              }));
          } catch {
            return [];
          }
        })
      );

      // Deduplica por classSubject id
      const flat = results.flat();
      return flat.filter((item, index, self) =>
        index === self.findIndex(s => s.id === item.id)
      );
    },
    enabled: myConfiguredSubjects.length > 0 && allClasses.length > 0,
  });

  // Buscar conteúdos
  const { data: contents, isLoading: loadingContents } = useQuery({
    queryKey: ['lesson-contents', selectedClassSubjectId, user?.teacherProfile?.id],
    queryFn: async () => {
      if (!selectedClassSubjectId) return [];
      return await lessonContentsService.findByClassSubject(selectedClassSubjectId);
    },
    enabled: !!selectedClassSubjectId,
  });

  // Mutation para criar
  const createMutation = useMutation({
    mutationFn: (data: CreateLessonContentDto) => lessonContentsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-contents'] });
      toast.success('Conteúdo registrado! O conteúdo da aula foi salvo com sucesso');
      setShowModal(false);
      resetForm();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Não foi possível salvar o conteúdo';
      toast.error(message);
    },
  });

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateLessonContentDto }) =>
      lessonContentsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-contents'] });
      toast.success('Conteúdo atualizado! As alterações foram salvas');
      setShowModal(false);
      setSelectedContent(null);
      resetForm();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Não foi possível atualizar o conteúdo';
      toast.error(message);
    },
  });

  // Mutation para deletar
  const deleteMutation = useMutation({
    mutationFn: (id: string) => lessonContentsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-contents'] });
      toast.success('Conteúdo removido! O registro foi excluído');
      setShowDeleteDialog(false);
      setSelectedContent(null);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Não foi possível remover o conteúdo';
      toast.error(message);
    },
  });

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      title: '',
      content: '',
      objectives: '',
      methodology: '',
      resources: '',
      homework: '',
      observations: '',
      classSubjectId: selectedClassSubjectId,
      teacherId: user?.teacherProfile?.id || '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedContent) {
      updateMutation.mutate({ id: selectedContent.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (content: LessonContent) => {
    setSelectedContent(content);
    setFormData({
      date: content.date.split('T')[0],
      title: content.title,
      content: content.content,
      objectives: content.objectives || '',
      methodology: content.methodology || '',
      resources: content.resources || '',
      homework: content.homework || '',
      observations: content.observations || '',
      classSubjectId: content.classSubjectId,
      teacherId: content.teacherId,
    });
    setShowModal(true);
  };

  const handleDelete = () => {
    if (selectedContent) {
      deleteMutation.mutate(selectedContent.id);
    }
  };

  const handleNewContent = () => {
    resetForm();
    setSelectedContent(null);
    setShowModal(true);
  };

  const selectedSubject = teacherSubjects?.find((s) => s.id === selectedClassSubjectId);

  return (
    <div className="p-6">
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Confirmar exclusão"
        message="Tem certeza que deseja remover este registro de conteúdo? Esta ação não pode ser desfeita."
        confirmText="Sim, excluir"
        cancelText="Cancelar"
      />

      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/professor/dashboard')}
          leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
          className="mb-4"
        >
          Voltar
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Conteúdo Ministrado
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Registre o conteúdo das aulas ministradas
            </p>
          </div>
          {selectedClassSubjectId && (
            <Button onClick={handleNewContent} leftIcon={<PlusIcon className="h-5 w-5" />}>
              Novo Registro
            </Button>
          )}
        </div>
      </div>

      {/* Filtro */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <Select
          label="Turma e Disciplina"
          value={selectedClassSubjectId}
          onChange={(e) => setSelectedClassSubjectId(e.target.value)}
          required
          options={[
            { value: '', label: 'Selecione...' },
            ...(teacherSubjects?.map((subject) => ({
              value: subject.id,
              label: `${subject.class?.name} - ${subject.subject?.name}`,
            })) || []),
          ]}
        />
      </div>

      {/* Conteúdo */}
      {!selectedClassSubjectId ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
          <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Selecione uma turma e disciplina
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Escolha a disciplina para visualizar e registrar conteúdos
          </p>
        </div>
      ) : loadingContents ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Carregando conteúdos..." />
        </div>
      ) : contents && contents.length > 0 ? (
        <div className="space-y-4">
          {contents
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((content) => (
              <div
                key={content.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CalendarIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(content.date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {content.title}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {content.content}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(content)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedContent(content);
                        setShowDeleteDialog(true);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Detalhes expandidos */}
                {(content.objectives ||
                  content.methodology ||
                  content.resources ||
                  content.homework ||
                  content.observations) && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3 text-sm">
                    {content.objectives && (
                      <div>
                        <strong className="text-gray-700 dark:text-gray-300">Objetivos:</strong>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                          {content.objectives}
                        </p>
                      </div>
                    )}
                    {content.methodology && (
                      <div>
                        <strong className="text-gray-700 dark:text-gray-300">
                          Metodologia:
                        </strong>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                          {content.methodology}
                        </p>
                      </div>
                    )}
                    {content.resources && (
                      <div>
                        <strong className="text-gray-700 dark:text-gray-300">Recursos:</strong>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">{content.resources}</p>
                      </div>
                    )}
                    {content.homework && (
                      <div>
                        <strong className="text-gray-700 dark:text-gray-300">
                          Tarefa de Casa:
                        </strong>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">{content.homework}</p>
                      </div>
                    )}
                    {content.observations && (
                      <div>
                        <strong className="text-gray-700 dark:text-gray-300">Observações:</strong>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                          {content.observations}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
          <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Nenhum conteúdo registrado
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Comece registrando o conteúdo das aulas
          </p>
          <Button onClick={handleNewContent} leftIcon={<PlusIcon className="h-5 w-5" />}>
            Registrar Conteúdo
          </Button>
        </div>
      )}

      {/* Modal de Formulário */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedContent(null);
          resetForm();
        }}
        title={selectedContent ? 'Editar Conteúdo' : 'Registrar Conteúdo'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Data da Aula"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />

          <Input
            label="Título"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="Ex: Introdução às Equações do 2º Grau"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Conteúdo Ministrado *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descreva o conteúdo ministrado na aula..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Objetivos de Aprendizagem
            </label>
            <textarea
              value={formData.objectives}
              onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Objetivos que os alunos devem alcançar..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Metodologia Utilizada
            </label>
            <textarea
              value={formData.methodology}
              onChange={(e) => setFormData({ ...formData, methodology: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Métodos e estratégias de ensino utilizadas..."
            />
          </div>

          <Input
            label="Recursos Utilizados"
            value={formData.resources}
            onChange={(e) => setFormData({ ...formData, resources: e.target.value })}
            placeholder="Ex: Quadro, slides, vídeos..."
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tarefa de Casa
            </label>
            <textarea
              value={formData.homework}
              onChange={(e) => setFormData({ ...formData, homework: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Atividades para casa..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Observações
            </label>
            <textarea
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Observações gerais..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                setSelectedContent(null);
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
              {selectedContent ? 'Atualizar' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
