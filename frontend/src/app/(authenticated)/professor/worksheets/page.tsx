'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
  AcademicCapIcon,
  DocumentIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { worksheetsService } from '@/services/worksheets.service';
import { subjectsService } from '@/services/subjects.service';
import { classesService } from '@/services/classes.service';
import { questionsService } from '@/services/questions.service';
import { Worksheet, CreateWorksheetDto, WorksheetFilters, Question } from '@/types/question-bank.types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';

export default function WorksheetsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const toast = useToast();

  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [selectedWorksheet, setSelectedWorksheet] = useState<Worksheet | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [filters, setFilters] = useState<WorksheetFilters>({
    limit: 50,
  });

  const [formData, setFormData] = useState<Partial<CreateWorksheetDto>>({
    title: '',
    description: '',
    subjectId: undefined,
    classId: undefined,
    activityDate: undefined,
    headerText: '',
    footerText: '',
  });

  // Armazenar questões selecionadas com pontos customizáveis
  interface SelectedQuestion {
    id: string;
    title: string;
    statement: string;
    type: string;
    points: number;
  }

  const [selectedQuestions, setSelectedQuestions] = useState<SelectedQuestion[]>([]);
  const [originalQuestions, setOriginalQuestions] = useState<SelectedQuestion[]>([]); // Para comparar mudanças
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);
  const [searchQuestions, setSearchQuestions] = useState('');

  // Buscar disciplinas
  const { data: subjectsData } = useQuery({
    queryKey: ['subjects-worksheets'],
    queryFn: async () => {
      const response = await subjectsService.findAll({ limit: 100 });
      return response;
    },
  });

  // Buscar turmas
  const { data: classesData } = useQuery({
    queryKey: ['classes-worksheets'],
    queryFn: async () => {
      const response = await classesService.findAll({ limit: 100 });
      return response;
    },
  });

  // Buscar questões públicas para seleção
  const { data: availableQuestionsData, refetch: refetchQuestions } = useQuery({
    queryKey: ['available-questions', searchQuestions],
    queryFn: () => questionsService.findPublic({
      search: searchQuestions,
      limit: 50,
    }),
    enabled: showQuestionSelector, // Só buscar quando o modal estiver aberto
  });

  // Buscar atividades
  const { data: worksheetsData, isLoading } = useQuery({
    queryKey: ['worksheets', filters],
    queryFn: async () => {
      const result = await worksheetsService.findAll(filters);
      console.log('📊 Atividades carregadas:', result);
      console.log('📊 Primeira atividade (com questões?):', result.data[0]);
      return result;
    },
  });

  // Mutation para criar
  const createMutation = useMutation({
    mutationFn: async (data: CreateWorksheetDto) => {
      console.log('🔄 Criando atividade:', data);
      console.log('🔄 Questões selecionadas:', selectedQuestions);

      const activity = await worksheetsService.create(data);
      console.log('✅ Atividade criada:', activity);

      // Se houver questões selecionadas, adicionar após criar a atividade
      if (selectedQuestions.length > 0) {
        console.log(`🔄 Adicionando ${selectedQuestions.length} questões...`);
        for (let i = 0; i < selectedQuestions.length; i++) {
          try {
            const questionData = {
              questionId: selectedQuestions[i].id,
              orderNumber: i + 1,
              points: selectedQuestions[i].points, // Usar pontos customizados
            };
            console.log(`🔄 Adicionando questão ${i + 1}/${selectedQuestions.length}:`, questionData);
            await worksheetsService.addQuestion(activity.id, questionData);
            console.log(`✅ Questão ${i + 1} adicionada`);
          } catch (error) {
            console.error(`❌ Erro ao adicionar questão ${i + 1}:`, error);
          }
        }
      }

      return activity;
    },
    onSuccess: (worksheet) => {
      console.log('✅ Success callback - invalidando queries');
      queryClient.invalidateQueries({ queryKey: ['worksheets'] });
      console.log('✅ Queries invalidadas');
      const questionsMsg = selectedQuestions.length > 0
        ? ` com ${selectedQuestions.length} ${selectedQuestions.length === 1 ? 'questão' : 'questões'}`
        : '';
      toast.success(`Atividade criada${questionsMsg}!`);
      setShowModal(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('❌ Erro na mutation:', error);
      const message = error?.response?.data?.message || 'Não foi possível criar a atividade';
      toast.error(message);
    },
  });

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CreateWorksheetDto }) => {
      console.log('🔄 Atualizando atividade:', id, data);
      console.log('🔄 Questões originais:', originalQuestions);
      console.log('🔄 Questões atuais:', selectedQuestions);

      // Primeiro, atualizar os dados da atividade
      const activity = await worksheetsService.update(id, data);
      console.log('✅ Dados da atividade atualizados:', activity);

      // Sincronizar questões
      // 1. Remover questões que não estão mais na lista
      const questionsToRemove = originalQuestions.filter(
        (orig) => !selectedQuestions.some((curr) => curr.id === orig.id)
      );
      console.log('🗑️ Questões para remover:', questionsToRemove);
      for (const question of questionsToRemove) {
        try {
          await worksheetsService.removeQuestion(id, question.id);
          console.log(`✅ Questão ${question.id} removida`);
        } catch (error) {
          console.error(`❌ Erro ao remover questão ${question.id}:`, error);
        }
      }

      // 2. Adicionar novas questões
      const questionsToAdd = selectedQuestions.filter(
        (curr) => !originalQuestions.some((orig) => orig.id === curr.id)
      );
      console.log('➕ Questões para adicionar:', questionsToAdd);
      for (let i = 0; i < questionsToAdd.length; i++) {
        try {
          const orderNumber = selectedQuestions.findIndex((q) => q.id === questionsToAdd[i].id) + 1;
          await worksheetsService.addQuestion(id, {
            questionId: questionsToAdd[i].id,
            orderNumber,
            points: questionsToAdd[i].points,
          });
          console.log(`✅ Questão ${questionsToAdd[i].id} adicionada`);
        } catch (error) {
          console.error(`❌ Erro ao adicionar questão ${questionsToAdd[i].id}:`, error);
        }
      }

      // 3. Atualizar pontos das questões existentes se mudaram
      const questionsToUpdate = selectedQuestions.filter((curr) => {
        const orig = originalQuestions.find((o) => o.id === curr.id);
        return orig && (orig.points !== curr.points);
      });
      console.log('🔄 Questões para atualizar pontos:', questionsToUpdate);
      for (const question of questionsToUpdate) {
        try {
          const orderNumber = selectedQuestions.findIndex((q) => q.id === question.id) + 1;
          await worksheetsService.updateQuestion(id, question.id, {
            orderNumber,
            points: question.points,
          });
          console.log(`✅ Questão ${question.id} atualizada`);
        } catch (error) {
          console.error(`❌ Erro ao atualizar questão ${question.id}:`, error);
        }
      }

      return activity;
    },
    onSuccess: () => {
      console.log('✅ Success callback - invalidando queries');
      queryClient.invalidateQueries({ queryKey: ['worksheets'] });
      console.log('✅ Queries invalidadas');
      toast.success('Atividade atualizada! As alterações foram salvas');
      setShowModal(false);
      setSelectedWorksheet(null);
      resetForm();
    },
    onError: (error: any) => {
      console.error('❌ Erro na mutation de update:', error);
      const message = error?.response?.data?.message || 'Não foi possível atualizar a atividade';
      toast.error(message);
    },
  });

  // Mutation para deletar
  const deleteMutation = useMutation({
    mutationFn: (id: string) => worksheetsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worksheets'] });
      toast.success('Atividade removida! A atividade foi excluída');
      setShowDeleteDialog(false);
      setSelectedWorksheet(null);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Não foi possível remover a atividade';
      toast.error(message);
    },
  });

  // Mutation para duplicar
  const duplicateMutation = useMutation({
    mutationFn: (id: string) => worksheetsService.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worksheets'] });
      toast.success('Atividade duplicada! Uma cópia foi criada');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Não foi possível duplicar a atividade';
      toast.error(message);
    },
  });

  // Mutation para gerar PDF
  const generatePdfMutation = useMutation({
    mutationFn: (id: string) => worksheetsService.generatePdf(id),
    onSuccess: (blob, id) => {
      // Criar URL do blob e fazer download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `atividade-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF gerado! O download foi iniciado');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Não foi possível gerar o PDF';
      toast.error(message);
    },
  });

  // Detectar questões pré-selecionadas do banco de questões
  useEffect(() => {
    const action = searchParams.get('action');

    if (action === 'create') {
      try {
        const selectedQuestionsJson = sessionStorage.getItem('selectedQuestions');

        if (selectedQuestionsJson) {
          const questionsData = JSON.parse(selectedQuestionsJson);

          // Converter para SelectedQuestion[]
          const questions: SelectedQuestion[] = questionsData.map((q: any) => ({
            id: q.id,
            title: q.title,
            statement: q.statement,
            type: q.type,
            points: q.points || 1,
          }));

          setSelectedQuestions(questions);

          // Abrir modal
          setShowModal(true);

          // Limpar sessionStorage e remover query param
          sessionStorage.removeItem('selectedQuestions');
          router.replace('/professor/worksheets', { scroll: false });

          toast.info(`${questions.length} ${questions.length === 1 ? 'questão selecionada' : 'questões selecionadas'}`);
        }
      } catch (error) {
        console.error('Erro ao carregar questões selecionadas:', error);
        sessionStorage.removeItem('selectedQuestions');
      }
    }
  }, [searchParams, router, toast]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      subjectId: undefined,
      classId: undefined,
      activityDate: undefined,
      headerText: '',
      footerText: '',
    });
    setSelectedQuestions([]);
    setOriginalQuestions([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validação dos campos obrigatórios
    if (!formData.title || !formData.subjectId || !formData.classId) {
      toast.error('Preencha todos os campos obrigatórios (Título, Disciplina e Turma)');
      return;
    }

    if (selectedWorksheet) {
      updateMutation.mutate({ id: selectedWorksheet.id, data: formData as CreateWorksheetDto });
    } else {
      createMutation.mutate(formData as CreateWorksheetDto);
    }
  };

  const handleEdit = async (worksheet: Worksheet) => {
    console.log('📝 Editando atividade (dados da lista):', worksheet);
    console.log('📝 Questões da atividade (da lista):', worksheet.questions);

    try {
      // Buscar dados completos da atividade (com questões)
      console.log('🔄 Buscando dados completos da atividade...');
      const fullWorksheet = await worksheetsService.findOne(worksheet.id);
      console.log('✅ Dados completos carregados:', fullWorksheet);
      console.log('✅ Questões completas:', fullWorksheet.questions);

      setSelectedWorksheet(fullWorksheet);
      setFormData({
        title: fullWorksheet.title,
        description: fullWorksheet.description,
        subjectId: fullWorksheet.subjectId,
        classId: fullWorksheet.classId,
        activityDate: fullWorksheet.activityDate,
        headerText: fullWorksheet.headerTemplate || fullWorksheet.headerText || '',
        footerText: fullWorksheet.footerTemplate || fullWorksheet.footerText || '',
      });

      // Carregar questões da atividade
      if (fullWorksheet.questions && fullWorksheet.questions.length > 0) {
        const loadedQuestions: SelectedQuestion[] = fullWorksheet.questions.map((wq) => ({
          id: wq.question?.id || wq.questionId,
          title: wq.question?.title || '',
          statement: wq.question?.statement || '',
          type: wq.question?.type || '',
          points: wq.customPoints || wq.question?.points || 1,
        }));
        console.log('📝 Questões carregadas no estado:', loadedQuestions);
        setSelectedQuestions(loadedQuestions);
        setOriginalQuestions(loadedQuestions); // Armazenar cópia para comparar mudanças
      } else {
        console.log('📝 Nenhuma questão encontrada na atividade');
        setSelectedQuestions([]);
        setOriginalQuestions([]);
      }

      setShowModal(true);
    } catch (error) {
      console.error('❌ Erro ao carregar atividade:', error);
      toast.error('Não foi possível carregar os dados da atividade');
    }
  };

  const handleNew = () => {
    resetForm();
    setSelectedWorksheet(null);
    setShowModal(true);
  };

  const handleDuplicate = (id: string) => {
    duplicateMutation.mutate(id);
  };

  const handleGeneratePdf = (id: string) => {
    generatePdfMutation.mutate(id);
  };

  const handlePreview = async (id: string) => {
    try {
      const worksheet = await worksheetsService.findOne(id);
      const html = buildWorksheetHtml(worksheet);
      setPreviewHtml(html);
      setShowPreviewModal(true);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar preview';
      toast.error(message);
    }
  };

  const buildWorksheetHtml = (worksheet: Worksheet) => {
    const escapeHtml = (value: string) =>
      value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

    const header = worksheet.headerTemplate || '';
    const footer = worksheet.footerTemplate || '';

    const questionsHtml = (worksheet.questions || [])
      .slice()
      .sort((a, b) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0))
      .map((wq, index) => {
        const q: Question | undefined = wq.question;
        const title = q?.title ? `<h3>${escapeHtml(q.title)}</h3>` : '';
        const statement = q?.statement ? `<div>${escapeHtml(q.statement)}</div>` : '';
        const options = Array.isArray(q?.options) && q.options.length
          ? `<ul>${q.options
              .map((opt) => `<li>${escapeHtml(opt.text ?? '')}</li>`)
              .join('')}</ul>`
          : '';
        const points = wq.customPoints ?? q?.points;
        const pointsHtml = points ? `<div><strong>Pontos:</strong> ${escapeHtml(String(points))}</div>` : '';

        return `<section style="margin: 16px 0;"><div style="font-weight: 600; margin-bottom: 6px;">${index + 1}.</div>${title}${statement}${options}${pointsHtml}</section>`;
      })
      .join('');

    return `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; padding: 24px;">
        <div>${header}</div>
        <h1 style="margin: 16px 0 8px;">${escapeHtml(worksheet.title || 'Atividade')}</h1>
        ${worksheet.description ? `<p style="margin: 0 0 16px;">${escapeHtml(worksheet.description)}</p>` : ''}
        <div>${questionsHtml}</div>
        <div style="margin-top: 24px;">${footer}</div>
      </div>
    `;
  };

  const worksheets = worksheetsData?.data || [];
  const filteredWorksheets = worksheets.filter(w =>
    w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalQuestions = worksheets.reduce((acc, w) => acc + (w._count?.questions || 0), 0);

  return (
    <div className="p-6">
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => {
          if (selectedWorksheet) {
            deleteMutation.mutate(selectedWorksheet.id);
          }
        }}
        title="Confirmar exclusão"
        message="Tem certeza que deseja remover esta atividade? Esta ação não pode ser desfeita."
        confirmText="Sim, excluir"
        cancelText="Cancelar"
      />

      {/* Modal de Preview */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setPreviewHtml('');
        }}
        title="Preview da Atividade"
        size="4xl"
      >
        <div className="max-h-[80vh] overflow-auto">
          <div
            dangerouslySetInnerHTML={{ __html: previewHtml }}
            className="preview-content"
          />
        </div>
      </Modal>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Minhas Atividades
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Crie e gerencie atividades com questões do banco
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => router.push('/professor/question-bank')}
              leftIcon={<AcademicCapIcon className="h-5 w-5" />}
            >
              Banco de Questões
            </Button>
            <Button onClick={handleNew} leftIcon={<PlusIcon className="h-5 w-5" />}>
              Nova Atividade
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {worksheets.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total de atividades</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {worksheets.filter(w => w._count?.questions && w._count.questions > 0).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Com questões</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {totalQuestions}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Questões no total</div>
        </div>
      </div>

      {/* Busca */}
      <div className="mb-6">
        <Input
          placeholder="Buscar atividades..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<DocumentTextIcon className="h-5 w-5 text-gray-400" />}
        />
      </div>

      {/* Lista de Atividades */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Carregando atividades..." />
        </div>
      ) : filteredWorksheets.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
          <DocumentIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'Nenhuma atividade encontrada' : 'Nenhuma atividade criada'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchTerm
              ? 'Tente ajustar o termo de busca'
              : 'Comece criando uma atividade e adicionando questões do banco'}
          </p>
          {!searchTerm && (
            <Button onClick={handleNew} leftIcon={<PlusIcon className="h-5 w-5" />}>
              Criar Atividade
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorksheets.map((worksheet) => (
            <div
              key={worksheet.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {worksheet.title}
                  </h3>
                  {worksheet.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {worksheet.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    {worksheet.subject && (
                      <Badge variant="info" size="sm">
                        {worksheet.subject.name}
                      </Badge>
                    )}
                    {worksheet.class && (
                      <Badge variant="default" size="sm">
                        {worksheet.class.name}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <DocumentTextIcon className="h-4 w-4" />
                  <span>{worksheet._count?.questions || 0} questões</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium">{worksheet.totalPoints || 0} pts</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  onClick={() => handleEdit(worksheet)}
                  className="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <PencilIcon className="h-4 w-4" />
                  Editar
                </button>
                <button
                  onClick={() => handleDuplicate(worksheet.id)}
                  disabled={duplicateMutation.isPending}
                  className="px-3 py-2 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  <DocumentDuplicateIcon className="h-4 w-4" />
                  Duplicar
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handlePreview(worksheet.id)}
                  className="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <EyeIcon className="h-4 w-4" />
                  Preview
                </button>
                <button
                  onClick={() => handleGeneratePdf(worksheet.id)}
                  disabled={generatePdfMutation.isPending}
                  className="px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  PDF
                </button>
                <button
                  onClick={() => {
                    setSelectedWorksheet(worksheet);
                    setShowDeleteDialog(true);
                  }}
                  className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <TrashIcon className="h-4 w-4" />
                  Excluir
                </button>
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
          setSelectedWorksheet(null);
          resetForm();
        }}
        title={selectedWorksheet ? 'Editar Atividade' : 'Nova Atividade'}
        size="full"
      >
        <form onSubmit={handleSubmit} className="flex gap-6 h-[calc(100vh-200px)]">
          {/* Coluna Esquerda - Formulário */}
          <div className="flex-1 overflow-y-auto pr-4 space-y-4">
            <Input
              label="Título *"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Ex: Atividade de Matemática - Geometria"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Breve descrição da atividade..."
              />
            </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Disciplina *"
              value={formData.subjectId || ''}
              onChange={(e) => setFormData({ ...formData, subjectId: e.target.value || undefined })}
              required
              options={[
                { value: '', label: 'Selecione uma disciplina...' },
                ...(subjectsData?.data.map((subject) => ({
                  value: subject.id,
                  label: subject.name,
                })) || []),
              ]}
            />

            <Select
              label="Turma *"
              value={formData.classId || ''}
              onChange={(e) => setFormData({ ...formData, classId: e.target.value || undefined })}
              required
              options={[
                { value: '', label: 'Selecione uma turma...' },
                ...(classesData?.data.map((cls) => ({
                  value: cls.id,
                  label: cls.name,
                })) || []),
              ]}
            />
          </div>

          <Input
            label="Data da Aplicação (Opcional)"
            type="date"
            value={formData.activityDate || ''}
            onChange={(e) => setFormData({ ...formData, activityDate: e.target.value || undefined })}
            placeholder="Data em que a atividade será aplicada aos alunos"
          />

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Pontuação Total (Auto-calculada)
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Calculada automaticamente com base nas questões adicionadas
                </p>
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {selectedQuestions.reduce((sum, q) => sum + q.points, 0).toFixed(1)} pts
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Texto Adicional do Cabeçalho (PDF) - Opcional
            </label>
            <textarea
              value={formData.headerText || ''}
              onChange={(e) => setFormData({ ...formData, headerText: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Observações adicionais, instruções especiais..."
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              O cabeçalho já inclui automaticamente: Município, Unidade de Ensino, Período de Avaliação, Turma/Turno e Professor. Use este campo apenas para informações adicionais.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Texto do Rodapé (PDF)
            </label>
            <textarea
              value={formData.footerText || ''}
              onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Boa sorte!"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Texto que aparecerá no rodapé do PDF.
            </p>
          </div>

            <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                setSelectedWorksheet(null);
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
              {selectedWorksheet ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
          </div>

          {/* Coluna Direita - Questões */}
          <div className="w-96 border-l dark:border-gray-700 pl-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Questões ({selectedQuestions.length})
              </h3>
              <Button
                type="button"
                size="sm"
                variant="primary"
                onClick={() => setShowQuestionSelector(true)}
              >
                + Adicionar
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {selectedQuestions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <DocumentTextIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma questão adicionada</p>
                  <p className="text-xs mt-1">Clique em "Adicionar" para selecionar questões</p>
                </div>
              ) : (
                selectedQuestions.map((question, index) => (
                  <div
                    key={question.id}
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                          {question.title || question.statement}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {question.type}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedQuestions(selectedQuestions.filter(q => q.id !== question.id));
                        }}
                        className="text-red-600 hover:text-red-700 dark:text-red-400"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600 dark:text-gray-400">
                        Pontos:
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={question.points}
                        onChange={(e) => {
                          const newPoints = parseFloat(e.target.value) || 0;
                          setSelectedQuestions(
                            selectedQuestions.map(q =>
                              q.id === question.id ? { ...q, points: newPoints } : q
                            )
                          );
                        }}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            {selectedQuestions.length > 0 && (
              <div className="mt-4 pt-4 border-t dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Total de Pontos:
                  </span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {selectedQuestions.reduce((sum, q) => sum + q.points, 0).toFixed(1)} pts
                  </span>
                </div>
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* Modal de Seleção de Questões */}
      <Modal
        isOpen={showQuestionSelector}
        onClose={() => {
          setShowQuestionSelector(false);
          setSearchQuestions('');
        }}
        title="Selecionar Questões"
        size="xl"
      >
        <div className="space-y-4">
          {/* Busca */}
          <Input
            placeholder="Buscar questões..."
            value={searchQuestions}
            onChange={(e) => setSearchQuestions(e.target.value)}
            leftIcon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
          />

          {/* Lista de Questões */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {availableQuestionsData?.data && availableQuestionsData.data.length > 0 ? (
              availableQuestionsData.data.map((question: Question) => {
                const isAlreadyAdded = selectedQuestions.some(q => q.id === question.id);

                return (
                  <div
                    key={question.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      isAlreadyAdded
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                    }`}
                    onClick={() => {
                      if (!isAlreadyAdded) {
                        setSelectedQuestions([
                          ...selectedQuestions,
                          {
                            id: question.id,
                            title: question.title,
                            statement: question.statement,
                            type: question.type,
                            points: question.points || 1,
                          },
                        ]);
                        toast.success('Questão adicionada!');
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1 line-clamp-1">
                          {question.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                          {question.statement}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          <Badge size="sm" variant="info">
                            {question.type}
                          </Badge>
                          <span className="text-gray-500 dark:text-gray-400">
                            {question.points} {question.points === 1 ? 'ponto' : 'pontos'}
                          </span>
                        </div>
                      </div>
                      {isAlreadyAdded && (
                        <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <DocumentTextIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma questão encontrada</p>
                <p className="text-xs mt-1">Tente ajustar o termo de busca</p>
              </div>
            )}
          </div>

          {/* Rodapé */}
          <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedQuestions.length} {selectedQuestions.length === 1 ? 'questão selecionada' : 'questões selecionadas'}
            </span>
            <Button
              variant="primary"
              onClick={() => {
                setShowQuestionSelector(false);
                setSearchQuestions('');
              }}
            >
              Concluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
