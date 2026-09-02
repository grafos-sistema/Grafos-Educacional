'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserRole } from '@/types/user.types';
import {
  ArrowLeftIcon,
  AcademicCapIcon,
  BookOpenIcon,
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { classesService } from '@/services/classes.service';
import { academicPeriodsService } from '@/services/academic-periods.service';
import { gradesService } from '@/services/grades.service';
import { evaluationsService } from '@/services/evaluations.service';
import { GradeStatus } from '@/types/grade.types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';
import { Tabs } from '@/components/ui/Tabs';
import { useTeacherClassSubjects } from '@/hooks/useTeacherClassSubjects';

const assessmentSlots = ['VA1', 'VA2', 'VA3', 'VA4'] as const;
type AssessmentSlot = (typeof assessmentSlots)[number];
type GradeEntry = {
  va1: string;
  va2: string;
  va3: string;
  va4: string;
  observations: string;
};

const createEmptyGradeEntry = (): GradeEntry => ({
  va1: '',
  va2: '',
  va3: '',
  va4: '',
  observations: '',
});

const slotToField: Record<AssessmentSlot, keyof Pick<GradeEntry, 'va1' | 'va2' | 'va3' | 'va4'>> = {
  VA1: 'va1',
  VA2: 'va2',
  VA3: 'va3',
  VA4: 'va4',
};

const normalizeAssessmentSlot = (examType?: string): AssessmentSlot | null => {
  const normalized = examType?.trim().toUpperCase().replace(/\s+/g, '');
  return assessmentSlots.includes(normalized as AssessmentSlot)
    ? (normalized as AssessmentSlot)
    : null;
};

const getFilledValues = (entry?: GradeEntry) =>
  [entry?.va1, entry?.va2, entry?.va3, entry?.va4]
    .filter((value): value is string => value !== undefined && value !== '')
    .map(Number)
    .filter((value) => Number.isFinite(value));

const getDetailedAverage = (entry?: GradeEntry) => {
  const values = getFilledValues(entry);
  return values.length > 0
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;
};

const clampGradeValue = (value: string) => {
  if (value === '') return '';

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return '';
  if (numericValue > 10) return '10';
  if (numericValue < 0) return '0';

  return value;
};

export default function GradesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const toast = useToast();

  // Tab state
  const [activeTab, setActiveTab] = useState('launch');

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedClassSubjectId, setSelectedClassSubjectId] = useState('');
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [gradesData, setGradesData] = useState<Record<string, GradeEntry>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalSlot, setProposalSlot] = useState<AssessmentSlot>('VA1');
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalType, setProposalType] = useState('Prova');
  const [proposalDescription, setProposalDescription] = useState('');
  const [proposalExamDate, setProposalExamDate] = useState('');

  // States for listing tab
  const [listFilterClassId, setListFilterClassId] = useState('');
  const [listFilterClassSubjectId, setListFilterClassSubjectId] = useState('');
  const [listFilterPeriodId, setListFilterPeriodId] = useState('');
  const [listFilterStatus, setListFilterStatus] = useState<GradeStatus | ''>('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [gradeToDelete, setGradeToDelete] = useState<string | null>(null);
  const [reviewEvaluationId, setReviewEvaluationId] = useState<string | null>(null);
  const [reviewMode, setReviewMode] = useState<'view' | 'publish'>('view');
  const [showReviewSearch, setShowReviewSearch] = useState(false);
  const [reviewStudentSearch, setReviewStudentSearch] = useState('');
  const visibilityMutation = useMutation({
    mutationFn: async ({ gradeIds, visible }: { gradeIds: string[]; visible: boolean }) => {
      await Promise.all(
        gradeIds.map((id) => gradesService.updateStudentVisibility(id, visible)),
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['launched-grades'] });
      toast.success(
        variables.visible
          ? 'Lançamento visível para alunos e responsáveis.'
          : 'Lançamento ocultado de alunos e responsáveis.',
      );
    },
    onError: () => toast.error('Não foi possível alterar a visibilidade deste lançamento.'),
  });

  const { data: teacherSubjects = [], isLoading: loadingSubjects } = useTeacherClassSubjects();

  const teacherClasses = useMemo(() => {
    const uniqueClasses = new Map<string, (typeof teacherSubjects)[number]['class']>();

    teacherSubjects.forEach((assignment) => {
      if (assignment.class?.id && !uniqueClasses.has(assignment.class.id)) {
        uniqueClasses.set(assignment.class.id, assignment.class);
      }
    });

    return Array.from(uniqueClasses.values());
  }, [teacherSubjects]);

  const subjectsForSelectedClass = useMemo(
    () => teacherSubjects.filter((assignment) => assignment.classId === selectedClassId),
    [teacherSubjects, selectedClassId],
  );

  const subjectsForListClass = useMemo(
    () => teacherSubjects.filter((assignment) => assignment.classId === listFilterClassId),
    [teacherSubjects, listFilterClassId],
  );

  // A turma define qual ano letivo deve fornecer os períodos acadêmicos.
  const selectedSubject = teacherSubjects.find((s) => s.id === selectedClassSubjectId);
  const selectedAcademicYearId = selectedSubject?.class?.academicYear?.id;

  const listSelectedSubject = teacherSubjects.find((s) => s.id === listFilterClassSubjectId);
  const listAcademicYearId = listSelectedSubject?.class?.academicYear?.id;

  // Buscar períodos acadêmicos
  const {
    data: periods = [],
    isLoading: loadingPeriods,
    isError: periodsError,
  } = useQuery({
    queryKey: ['academic-periods', user?.id, selectedAcademicYearId ?? 'none'],
    queryFn: async () => {
      const response = await academicPeriodsService.findAllFromApi({
        academicYearId: selectedAcademicYearId,
        isActive: true,
        limit: 100,
      });
      return response.data;
    },
    enabled: Boolean(user?.id && selectedClassSubjectId && selectedAcademicYearId),
  });

  const {
    data: listPeriods = [],
    isLoading: loadingListPeriods,
    isError: listPeriodsError,
  } = useQuery({
    queryKey: ['academic-periods-list', user?.id, listAcademicYearId ?? 'none'],
    queryFn: async () => {
      const response = await academicPeriodsService.findAllFromApi({
        academicYearId: listAcademicYearId,
        isActive: true,
        limit: 100,
      });
      return response.data;
    },
    enabled: Boolean(user?.id && listFilterClassSubjectId && listAcademicYearId),
  });

  // Buscar alunos da turma selecionada
  const { data: enrollments, isLoading: loadingEnrollments } = useQuery({
    queryKey: ['class-enrollments-grades', selectedSubject?.classId],
    queryFn: async () => {
      if (!selectedSubject?.classId) return [];
      return await classesService.getEnrollmentsFromApi(selectedSubject.classId);
    },
    enabled: !!selectedSubject?.classId,
  });

  // Buscar notas lançadas (para aba de listagem)
  const teacherId = user?.teacherId || user?.teacherProfile?.id;
  const {
    data: currentGrades = [],
    isLoading: loadingCurrentGrades,
  } = useQuery({
    queryKey: [
      'grades-for-launch',
      teacherId,
      selectedClassSubjectId,
      selectedPeriodId,
    ],
    queryFn: async () => {
      if (!teacherId || !selectedClassSubjectId || !selectedPeriodId) return [];

      const response = await gradesService.findAllFromApi({
        teacherId,
        classSubjectId: selectedClassSubjectId,
        academicPeriodId: selectedPeriodId,
        limit: 1000,
      });
      return response.data;
    },
    enabled: Boolean(teacherId && selectedClassSubjectId && selectedPeriodId),
  });

  useEffect(() => {
    if (!selectedClassSubjectId || !selectedPeriodId || loadingCurrentGrades) return;

    setGradesData(() => {
      const nextGrades: Record<string, GradeEntry> = {};

      currentGrades.forEach((grade) => {
        const entry = nextGrades[grade.studentId] ?? createEmptyGradeEntry();
        const slot = normalizeAssessmentSlot(grade.examType);

        if (slot) {
          entry[slotToField[slot]] = String(grade.value);
        }

        if (!entry.observations && grade.observations) {
          entry.observations = grade.observations;
        }

        nextGrades[grade.studentId] = entry;
      });

      return nextGrades;
    });
  }, [currentGrades, loadingCurrentGrades, selectedClassSubjectId, selectedPeriodId]);

  const { data: approvedEvaluations = [], isLoading: loadingEvaluations } = useQuery({
    queryKey: ['approved-evaluations', selectedClassSubjectId, selectedPeriodId],
    queryFn: () => evaluationsService.findAll({
      classSubjectId: selectedClassSubjectId,
      academicPeriodId: selectedPeriodId,
      status: 'APPROVED',
    }),
    enabled: Boolean(selectedClassSubjectId && selectedPeriodId),
  });

  const evaluationsBySlot = useMemo(
    () => new Map(approvedEvaluations.map((evaluation) => [evaluation.slot, evaluation])),
    [approvedEvaluations],
  );

  const proposalMutation = useMutation({
    mutationFn: () => evaluationsService.create({
      title: proposalTitle.trim(),
      type: proposalType,
      slot: proposalSlot,
      classSubjectId: selectedClassSubjectId,
      academicPeriodId: selectedPeriodId,
      description: proposalDescription.trim() || undefined,
      examDate: proposalExamDate || undefined,
      maxValue: 10,
      countsTowardsAverage: true,
    }),
    onSuccess: () => {
      setShowProposalModal(false);
      setProposalTitle('');
      setProposalDescription('');
      setProposalExamDate('');
      queryClient.invalidateQueries({ queryKey: ['approved-evaluations'] });
      toast.success('Avaliação enviada para aprovação da direção ou coordenação.');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Não foi possível enviar a avaliação para aprovação.');
    },
  });

  const { data: launchedGrades, isLoading: loadingLaunchedGrades, refetch: refetchLaunchedGrades } = useQuery({
    queryKey: [
      'launched-grades',
      teacherId,
      listFilterClassSubjectId,
      listFilterPeriodId,
      listFilterStatus,
    ],
    queryFn: async () => {
      if (!teacherId) return { data: [], meta: { total: 0 } };

      return await gradesService.findAllFromApi({
        teacherId,
        classSubjectId: listFilterClassSubjectId || undefined,
        academicPeriodId: listFilterPeriodId || undefined,
        status: listFilterStatus || undefined,
        limit: 1000,
      });
    },
    enabled: !!teacherId,
  });

  // Agrupar notas por avaliação
  const groupedGrades = launchedGrades?.data?.reduce((acc, grade) => {
    const key = `${grade.classSubjectId}-${grade.academicPeriodId}-${grade.examType}-${grade.examDate}`;

    if (!acc[key]) {
      acc[key] = {
        id: key,
        classSubjectId: grade.classSubjectId,
        classSubject: grade.classSubject,
        academicPeriodId: grade.academicPeriodId,
        academicPeriod: grade.academicPeriod,
        teacherId: grade.teacherId,
        teacher: grade.teacher,
        examType: grade.examType,
        examDate: grade.examDate,
        description: grade.description,
        weight: grade.weight,
        status: grade.status,
        grades: [],
        studentCount: 0,
        average: 0,
      };
    }

    acc[key].grades.push(grade);
    return acc;
  }, {} as Record<string, any>) || {};

  // Calcular médias e contador de alunos para cada avaliação
  Object.values(groupedGrades).forEach((evaluation: any) => {
    evaluation.studentCount = evaluation.grades.length;
    const sum = evaluation.grades.reduce((total: number, g: any) => total + g.value, 0);
    evaluation.average = evaluation.studentCount > 0
      ? (sum / evaluation.studentCount).toFixed(2)
      : '0.00';
  });

  const evaluations = Object.values(groupedGrades);
  const reviewEvaluation = evaluations.find(
    (evaluation: any) => evaluation.id === reviewEvaluationId,
  ) as any;
  const reviewIsVisibleToStudents = reviewEvaluation?.grades?.every(
    (grade: any) => grade.isVisibleToStudents !== false,
  ) ?? false;
  const normalizedReviewStudentSearch = reviewStudentSearch.trim().toLowerCase();
  const reviewGrades = reviewEvaluation?.grades?.filter((grade: any) => {
    if (!normalizedReviewStudentSearch) return true;
    const studentName = grade.student?.user?.name ||
      `${grade.student?.user?.firstName || ''} ${grade.student?.user?.lastName || ''}`.trim();
    return studentName.toLowerCase().includes(normalizedReviewStudentSearch);
  }) ?? [];

  // Mutation para salvar notas
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSubject || !user || !selectedPeriodId) return;

      const teacherId = user.teacherId || user.teacherProfile?.id;
      if (!teacherId) {
        throw new Error('Perfil de professor não encontrado');
      }

      const gradesBySlot = assessmentSlots.map((slot) => ({
        examType: slot,
        grades: Object.entries(gradesData)
          .filter(([, data]) => data[slotToField[slot]] !== '')
          .map(([studentId, data]) => ({
            studentId,
            value: parseFloat(data[slotToField[slot]]),
            observations: data.observations,
          })),
      }));
      const hasGrades = gradesBySlot.some(({ grades }) => grades.length > 0);

      if (!hasGrades) {
        throw new Error('Nenhuma nota foi preenchida');
      }

      const currentGradeIsSlot = (grade: (typeof currentGrades)[number]) =>
        Boolean(normalizeAssessmentSlot(grade.examType));
      await Promise.all(currentGrades.filter(currentGradeIsSlot).map((grade) => gradesService.remove(grade.id)));

      await Promise.all(
        gradesBySlot
          .filter(({ grades }) => grades.length > 0)
          .map(({ examType: slot, grades }) => {
            const evaluation = evaluationsBySlot.get(slot);
            return gradesService.createBulk({
              examType: slot,
              evaluationId: evaluation?.id,
              examDate: evaluation?.examDate,
              description: evaluation?.title,
              weight: 1,
              classSubjectId: selectedClassSubjectId,
              academicPeriodId: selectedPeriodId,
              teacherId,
              grades,
            });
          }),
      );
    },
    onSuccess: () => {
      setShowConfirmDialog(false);
      setListFilterClassId(selectedClassId);
      setListFilterClassSubjectId(selectedClassSubjectId);
      setListFilterPeriodId(selectedPeriodId);
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      queryClient.invalidateQueries({ queryKey: ['launched-grades'] });
      toast.success('Notas salvas com sucesso');
      // Limpar formulário
      setGradesData({});
      queryClient.invalidateQueries({ queryKey: ['grades-for-launch'] });
    },
    onError: (error: any) => {
      setShowConfirmDialog(false);
      const message = error?.response?.data?.message || error.message || 'Erro ao salvar notas';
      toast.error(message);
    },
  });

  // Mutation para publicar notas de uma avaliação
  const publishMutation = useMutation({
    mutationFn: async (gradeIds: string[]) => {
      await Promise.all(gradeIds.map((id) => gradesService.publish(id)));
    },
    onSuccess: () => {
      setReviewEvaluationId(null);
      setReviewMode('view');
      queryClient.invalidateQueries({ queryKey: ['launched-grades'] });
      toast.success('Notas publicadas com sucesso');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error.message || 'Erro ao publicar notas';
      toast.error(message);
    },
  });

  // Mutation para deletar notas de uma avaliação
  const deleteMutation = useMutation({
    mutationFn: async (gradeIds: string[]) => {
      await Promise.all(gradeIds.map((id) => gradesService.remove(id)));
    },
    onSuccess: () => {
      setShowDeleteDialog(false);
      setGradeToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['launched-grades'] });
      toast.success('Avaliação excluída com sucesso');
    },
    onError: (error: any) => {
      setShowDeleteDialog(false);
      const message = error?.response?.data?.message || error.message || 'Erro ao excluir avaliação';
      toast.error(message);
    },
  });

  const handleGradeChange = (
    studentId: string,
    field: keyof Pick<GradeEntry, 'va1' | 'va2' | 'va3' | 'va4'>,
    value: string,
  ) => {
    const normalizedValue = clampGradeValue(value);

    setGradesData((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] ?? createEmptyGradeEntry()),
        [field]: normalizedValue,
        observations: prev[studentId]?.observations || '',
      },
    }));
  };

  const handleObservationsChange = (studentId: string, observations: string) => {
    setGradesData((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] ?? createEmptyGradeEntry()),
        observations,
      },
    }));
  };

  const handleClear = () => {
    setGradesData({});
    toast.info('Todas as notas foram removidas');
  };

  const handleSaveClick = () => {
    if (stats.filled === 0) {
      toast.warning('Nenhuma nota foi preenchida');
      return;
    }
    setShowConfirmDialog(true);
  };

  const openProposalModal = () => {
    const nextAvailableSlot = assessmentSlots.find((slot) => !evaluationsBySlot.has(slot));
    setProposalSlot(nextAvailableSlot ?? 'VA1');
    setShowProposalModal(true);
  };

  const isProposalExam = proposalType.trim().toLocaleLowerCase('pt-BR') === 'prova';
  const canSubmitProposal = Boolean(
    proposalTitle.trim() &&
    selectedClassSubjectId &&
    selectedPeriodId &&
    (!isProposalExam || proposalExamDate),
  );

  const handleProposalSubmit = () => {
    if (isProposalExam && !proposalExamDate) {
      toast.error('Informe a data da prova para que ela seja divulgada aos alunos.');
      return;
    }

    proposalMutation.mutate();
  };

  const openReview = (evaluation: any, mode: 'view' | 'publish' = 'view') => {
    setReviewEvaluationId(evaluation.id);
    setReviewMode(mode);
    setShowReviewSearch(false);
    setReviewStudentSearch('');
  };

  const handlePublishClick = (evaluation: any) => {
    openReview(evaluation, 'publish');
  };

  const handleReviewClick = (evaluation: any) => {
    openReview(evaluation, 'view');
  };

  const handleDeleteClick = (evaluation: any) => {
    setGradeToDelete(evaluation.id);
    setShowDeleteDialog(true);
  };

  const confirmPublish = () => {
    const evaluation = evaluations.find((e: any) => e.id === reviewEvaluationId);
    if (!evaluation) return;

    const isVisibleToStudents = evaluation.grades.every(
      (grade: any) => grade.isVisibleToStudents !== false,
    );

    if (!isVisibleToStudents) {
      toast.warning('Ative “Mostrar para alunos” antes de publicar as notas.');
      return;
    }

    publishMutation.mutate(evaluation.grades.map((grade: any) => grade.id));
  };

  const confirmDelete = () => {
    const evaluation = evaluations.find((e: any) => e.id === gradeToDelete);
    if (evaluation) {
      const gradeIds = evaluation.grades.map((g: any) => g.id);
      deleteMutation.mutate(gradeIds);
    }
  };

  // Filter enrollments by search term
  const filteredEnrollments = enrollments?.filter((enrollment) => {
    if (!searchTerm) return true;
    const fullName =
      `${enrollment.student?.firstName} ${enrollment.student?.lastName}`.toLowerCase();
    const registrationNumber = enrollment.student?.registrationNumber?.toLowerCase() || '';
    const normalizedSearch = searchTerm.toLowerCase();
    return fullName.includes(normalizedSearch) || registrationNumber.includes(normalizedSearch);
  });

  const hasUnsavedChanges = Object.values(gradesData).some(
    (entry) =>
      entry.va1 !== '' ||
      entry.va2 !== '' ||
      entry.va3 !== '' ||
      entry.va4 !== '' ||
      entry.observations !== '',
  );

  const currentAverages = Object.values(gradesData)
    .map((entry) =>
      getDetailedAverage(entry),
    )
    .filter((value): value is number => value !== null && Number.isFinite(value));

  const stats = {
    filled: currentAverages.length,
    total: enrollments?.length || 0,
    average: currentAverages.length > 0
      ? (currentAverages.reduce((sum, value) => sum + value, 0) / currentAverages.length).toFixed(2)
      : '0.00',
  };

  return (
    <div className="p-6">
      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={() => saveMutation.mutate()}
        title="Confirmar salvamento"
        message={`Você está prestes a salvar ${stats.filled} média${
          stats.filled > 1 ? 's' : ''
        } calculadas somente pelas VAs preenchidas. Deseja continuar?`}
        confirmText="Sim, salvar"
        cancelText="Cancelar"
      />

      <Modal
        isOpen={showProposalModal}
        onClose={() => setShowProposalModal(false)}
        title="Propor avaliação"
        description="A proposta ficará bloqueada para lançamento até ser aprovada pela direção ou coordenação."
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowProposalModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleProposalSubmit}
              disabled={!canSubmitProposal || proposalMutation.isPending}
              isLoading={proposalMutation.isPending}
            >
              Enviar proposta
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="VA"
            value={proposalSlot}
            onChange={(event) => setProposalSlot(event.target.value as AssessmentSlot)}
            options={assessmentSlots.map((slot) => ({
              value: slot,
              label: evaluationsBySlot.has(slot) ? `${slot} (já cadastrada)` : slot,
              disabled: evaluationsBySlot.has(slot),
            }))}
          />
          <Select
            label="Tipo"
            value={proposalType}
            onChange={(event) => setProposalType(event.target.value)}
            options={['Prova', 'Atividade', 'Trabalho', 'Projeto', 'Seminário', 'Outro'].map((type) => ({
              value: type,
              label: type,
            }))}
          />
          <Input
            label="Título da avaliação"
            value={proposalTitle}
            onChange={(event) => setProposalTitle(event.target.value)}
            placeholder="Ex.: Trabalho de Ciências"
            required
          />
          <Input
            label={isProposalExam ? 'Data da prova' : 'Data (opcional)'}
            type="date"
            value={proposalExamDate}
            onChange={(event) => setProposalExamDate(event.target.value)}
            required={isProposalExam}
            helperText={isProposalExam ? 'A data será exibida aos alunos após a aprovação.' : undefined}
          />
          <div className="sm:col-span-2">
            <Input
              label="Descrição (opcional)"
              value={proposalDescription}
              onChange={(event) => setProposalDescription(event.target.value)}
              placeholder="Conteúdos ou orientações para a aprovação"
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setGradeToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Excluir avaliação"
        message="Esta ação é irreversível. Todas as notas desta avaliação serão excluídas. Deseja continuar?"
        confirmText="Sim, excluir"
        cancelText="Cancelar"
      />

      <Modal
        isOpen={Boolean(reviewEvaluation)}
        onClose={() => {
          setReviewEvaluationId(null);
          setReviewMode('view');
        }}
        title={reviewMode === 'publish' ? 'Revisar notas antes de publicar' : 'Visualizar notas lançadas'}
        description={
          reviewMode === 'publish'
            ? 'Confira os alunos e os valores abaixo. A publicação só ficará disponível quando o lançamento estiver marcado para aparecer aos alunos.'
            : 'Consulte as notas já lançadas para esta avaliação, inclusive quando apenas parte da turma tiver sido preenchida.'
        }
        size="xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setReviewEvaluationId(null);
                setReviewMode('view');
              }}
            >
              Fechar
            </Button>
            {reviewMode === 'publish' && (
              <Button
                onClick={confirmPublish}
                disabled={!reviewIsVisibleToStudents || publishMutation.isPending}
                isLoading={publishMutation.isPending}
                leftIcon={<CheckCircleIcon className="h-4 w-4" />}
              >
                Confirmar publicação
              </Button>
            )}
          </div>
        }
      >
        {reviewEvaluation && (
          <div className="space-y-5">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    {reviewEvaluation.classSubject?.class?.name} ·{' '}
                    {reviewEvaluation.classSubject?.subject?.name}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {reviewEvaluation.academicPeriod?.name} · {reviewEvaluation.examType}
                    {reviewEvaluation.examDate
                      ? ` · ${new Date(reviewEvaluation.examDate).toLocaleDateString('pt-BR')}`
                      : ''}
                  </p>
                </div>
                <div className="text-right text-sm text-slate-600 dark:text-slate-300">
                  <div>{reviewEvaluation.grades.length} aluno(s) com nota lançada</div>
                  <div>Média: {reviewEvaluation.average}</div>
                </div>
              </div>
            </div>

            {!reviewIsVisibleToStudents && reviewMode === 'publish' && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                <EyeSlashIcon className="mt-0.5 h-5 w-5 shrink-0" />
                <p>
                  Este lançamento está oculto para alunos e responsáveis. Ative o botão
                  “Mostrar para alunos” na avaliação e abra esta revisão novamente para publicar.
                </p>
              </div>
            )}

            <div className="overflow-hidden rounded-lg border border-[#e0e0e0] dark:border-gray-700">
              <div className="flex items-center gap-3 border-b border-[#e0e0e0] bg-[#f6f6f6] px-4 py-3 dark:border-gray-700 dark:bg-gray-700/50">
                <div className="grid flex-1 grid-cols-[minmax(0,1fr)_120px_minmax(0,1.5fr)] gap-4 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                  <span>Aluno</span>
                  <span>Nota</span>
                  <span>Observações</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReviewSearch((current) => !current)}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                  aria-label="Pesquisar aluno nas notas"
                  aria-expanded={showReviewSearch}
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                </button>
              </div>
              {showReviewSearch && (
                <div className="border-b border-[#e0e0e0] bg-[#f6f6f6] px-4 pb-3 dark:border-gray-700 dark:bg-gray-700/50">
                  <div className="relative">
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="search"
                      autoFocus
                      value={reviewStudentSearch}
                      onChange={(event) => setReviewStudentSearch(event.target.value)}
                      placeholder="Pesquisar aluno..."
                      className="w-full rounded-[5px] border border-[#e3e5e9] bg-white py-2 pl-9 pr-3 text-sm text-gray-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-primary-900/30"
                    />
                  </div>
                </div>
              )}
              <div>
                {reviewGrades.length > 0 ? reviewGrades.map((grade: any) => {
                  const studentName = grade.student?.user?.name ||
                    `${grade.student?.user?.firstName || ''} ${grade.student?.user?.lastName || ''}`.trim() ||
                    'Aluno';
                  const initials = studentName
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part: string) => part[0])
                    .join('')
                    .toUpperCase();

                  return (
                    <div
                      key={grade.id}
                      className="grid grid-cols-[minmax(0,1fr)_120px_minmax(0,1.5fr)] items-center gap-4 border-b border-[#e0e0e0] px-4 py-3 text-sm odd:bg-[#fff] even:bg-[#f6f6f6] last:border-b-0 hover:bg-blue-50 dark:border-gray-700 dark:odd:bg-gray-800 dark:even:bg-gray-800/80 dark:hover:bg-gray-700/50"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {grade.student?.user?.avatar ? (
                          <img
                            src={grade.student.user.avatar}
                            alt={`Foto de ${studentName}`}
                            className="h-9 w-9 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-xs font-semibold text-white">
                            {initials}
                          </div>
                        )}
                        <span className="truncate font-medium text-gray-900 dark:text-gray-100">
                          {studentName}
                        </span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {Number(grade.value).toLocaleString('pt-BR', {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <span className="truncate text-sm text-gray-500 dark:text-gray-400">
                        {grade.observations || '—'}
                      </span>
                    </div>
                  );
                }) : (
                  <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    Nenhum aluno encontrado para esta pesquisa.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

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
              Gerenciar Notas
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Registre e gerencie as notas das avaliações dos alunos
            </p>
          </div>
          {hasUnsavedChanges && activeTab === 'launch' && (
            <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                Alterações não salvas
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          {
            id: 'launch',
            label: 'Lançar Notas',
            icon: <PlusIcon className="h-5 w-5" />,
          },
          {
            id: 'list',
            label: 'Notas Lançadas',
            icon: <ClipboardDocumentListIcon className="h-5 w-5" />,
            badge: evaluations.length,
          },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        className="mb-6"
      />

      {/* Tab Content: Launch Grades */}
      {activeTab === 'launch' && (
        <>
      {/* Seleção do lançamento */}
      <div className="mb-6 rounded-lg border border-[#e0e0e0] bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
         <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
           <div>
             <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
               Lançamento de notas
             </h2>
             <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
               Selecione o bimestre e informe a nota consolidada de cada VA aplicada.
             </p>
           </div>
           <Button
             variant="secondary"
             size="sm"
             leftIcon={<PlusIcon className="h-4 w-4" />}
             onClick={openProposalModal}
             disabled={!selectedClassSubjectId || !selectedPeriodId}
           >
             Propor avaliação
           </Button>
         </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Select
            label="Turma"
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setSelectedClassSubjectId('');
              setSelectedPeriodId('');
              setGradesData({});
            }}
            required
            options={[
              { value: '', label: loadingSubjects ? 'Carregando turmas...' : 'Selecione...' },
              ...teacherClasses.map((classItem) => ({
                value: classItem.id,
                label: `${classItem.name}${classItem.shift ? ` • ${classItem.shift}` : ''}`,
              })),
            ]}
          />

          <Select
            label="Disciplina"
            value={selectedClassSubjectId}
            onChange={(e) => {
              setSelectedClassSubjectId(e.target.value);
              setSelectedPeriodId('');
              setGradesData({});
            }}
            disabled={!selectedClassId || loadingSubjects}
            required
            options={[
              {
                value: '',
                label: !selectedClassId ? 'Selecione a turma primeiro' : 'Selecione...',
              },
              ...subjectsForSelectedClass.map((assignment) => ({
                value: assignment.id,
                label: assignment.subject?.name || 'Disciplina sem nome',
              })),
            ]}
          />

          <Select
            label="Período Acadêmico"
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            disabled={!selectedClassSubjectId || loadingPeriods || Boolean(periodsError)}
            required
            options={[
              {
                value: '',
                label: !selectedClassSubjectId
                  ? 'Selecione a disciplina primeiro'
                  : loadingPeriods
                    ? 'Carregando períodos...'
                    : periodsError
                      ? 'Não foi possível carregar os períodos'
                      : periods.length === 0
                        ? 'Nenhum período cadastrado'
                        : 'Selecione...',
              },
              ...periods.map((period) => ({
                value: period.id,
                label: period.name,
              })),
            ]}
          />

        </div>
        {selectedPeriodId && !loadingEvaluations && approvedEvaluations.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ainda não há uma avaliação VA aprovada para este período. A direção ou coordenação precisa cadastrá-la antes do lançamento.
          </p>
        )}
      </div>

      {/* Content */}
      {!selectedClassSubjectId || !selectedPeriodId ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
          <AcademicCapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Selecione o bimestre
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Selecione a turma, disciplina e período acadêmico para lançar as notas
          </p>
        </div>
      ) : loadingEnrollments ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Carregando alunos..." />
        </div>
      ) : enrollments && enrollments.length > 0 ? (
        <>
          {/* Resumo */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-[#e0e0e0] bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-1 text-sm text-gray-600 dark:text-gray-400">
                Alunos com nota
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.filled} / {stats.total}
              </div>
            </div>
            <div className="rounded-lg border border-[#e0e0e0] bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-1 text-sm text-gray-600 dark:text-gray-400">Média atual</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.average}
              </div>
            </div>
            <div className="rounded-lg border border-[#e0e0e0] bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-1 text-sm text-gray-600 dark:text-gray-400">Regra do bimestre</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                Média das VAs preenchidas
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar aluno por nome ou matrícula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-[5px] border border-[#e3e5e9] bg-white py-2 pl-10 pr-4 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:ring-primary-900/30"
              />
            </div>
          </div>

          {/* Student List */}
          <div className="overflow-hidden rounded-lg border border-[#e0e0e0] bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            {filteredEnrollments && filteredEnrollments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-sm">
                  <thead className="border-b border-[#e0e0e0] bg-[#f6f6f6] text-left text-[11px] uppercase tracking-wide text-gray-700 dark:border-gray-700 dark:bg-gray-700/50 dark:text-gray-300">
                    <tr>
                      <th className="px-4 py-3 font-medium">Aluno</th>
                      <th className="px-4 py-3 font-medium">Matrícula</th>
                      {assessmentSlots.map((slot) => (
                        <th key={slot} className="px-4 py-3 text-center font-medium">
                          {slot}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center font-medium">Média atual</th>
                      <th className="px-4 py-3 font-medium">Situação</th>
                      <th className="px-4 py-3 font-medium">Observações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEnrollments.map((enrollment) => {
                      const entry = gradesData[enrollment.studentId] ?? createEmptyGradeEntry();
                      const average = getDetailedAverage(entry);
                      const isApproved = average !== null && average >= 6;
                      const isFailed = average !== null && average < 6;
                      const studentName = `${enrollment.student?.firstName || ''} ${enrollment.student?.lastName || ''}`.trim();

                      return (
                        <tr
                          key={enrollment.id}
                          className="border-b border-[#e0e0e0] odd:bg-[#fff] even:bg-[#f6f6f6] hover:bg-blue-50 last:border-b-0 dark:border-gray-700 dark:odd:bg-gray-800 dark:even:bg-gray-800/80 dark:hover:bg-gray-700/50"
                        >
                          <td className="px-4 py-3 align-middle">
                            <div className="flex min-w-[220px] items-center gap-3">
                              {enrollment.student?.avatar ? (
                                <img
                                  src={enrollment.student.avatar}
                                  alt={`Foto de ${studentName}`}
                                  className="h-9 w-9 shrink-0 rounded-full object-cover"
                                />
                              ) : (
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-xs font-semibold text-white">
                                  {enrollment.student?.firstName?.[0]}
                                  {enrollment.student?.lastName?.[0]}
                                </div>
                              )}
                              <span className="truncate font-medium text-gray-900 dark:text-white">
                                {studentName || 'Aluno sem nome'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                            {enrollment.student?.registrationNumber || 'Não informada'}
                          </td>
                          {assessmentSlots.map((slot) => {
                            const field = slotToField[slot];
                            const evaluation = evaluationsBySlot.get(slot);
                            return (
                              <td key={slot} className="px-4 py-3 text-center align-middle">
                                <Input
                                  type="number"
                                  aria-label={`${slot} de ${studentName}`}
                                  placeholder={evaluation ? '—' : 'Sem avaliação'}
                                  value={entry[field]}
                                  onChange={(e) =>
                                    handleGradeChange(enrollment.studentId, field, e.target.value)
                                  }
                                  disabled={!evaluation}
                                  min="0"
                                  max="10"
                                  step="0.1"
                                  className="mx-auto w-20 text-center"
                                />
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">
                            {average === null ? '—' : average.toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={
                                isApproved
                                  ? 'font-medium text-green-700 dark:text-green-400'
                                  : isFailed
                                    ? 'font-medium text-red-700 dark:text-red-400'
                                    : 'text-gray-500 dark:text-gray-400'
                              }
                            >
                              {isApproved ? 'Aprovado' : isFailed ? 'Reprovado' : 'Pendente'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              aria-label={`Observação de ${studentName}`}
                              placeholder="Observação (opcional)..."
                              value={entry.observations}
                              onChange={(e) =>
                                handleObservationsChange(enrollment.studentId, e.target.value)
                              }
                              className="min-w-[190px]"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Nenhum aluno encontrado
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Não há alunos que correspondam à sua busca
                </p>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={handleClear} disabled={saveMutation.isPending}>
              Limpar
            </Button>
            <Button
              onClick={handleSaveClick}
              disabled={saveMutation.isPending || stats.filled === 0}
              isLoading={saveMutation.isPending}
            >
              Salvar Notas ({stats.filled})
            </Button>
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
          <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Nenhum aluno matriculado
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Esta turma não possui alunos matriculados
          </p>
        </div>
      )}
        </>
      )}

      {/* Tab Content: List Grades */}
      {activeTab === 'list' && (
        <>
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Filtros
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select
                label="Turma"
                value={listFilterClassId}
                onChange={(e) => {
                  setListFilterClassId(e.target.value);
                  setListFilterClassSubjectId('');
                  setListFilterPeriodId('');
                }}
                options={[
                  { value: '', label: 'Todas' },
                  ...teacherClasses.map((classItem) => ({
                    value: classItem.id,
                    label: `${classItem.name}${classItem.shift ? ` • ${classItem.shift}` : ''}`,
                  })),
                ]}
              />

              <Select
                label="Disciplina"
                value={listFilterClassSubjectId}
                onChange={(e) => {
                  setListFilterClassSubjectId(e.target.value);
                  setListFilterPeriodId('');
                }}
                disabled={!listFilterClassId}
                options={[
                  {
                    value: '',
                    label: !listFilterClassId ? 'Selecione a turma primeiro' : 'Todas',
                  },
                  ...subjectsForListClass.map((subject) => ({
                    value: subject.id,
                    label: subject.subject?.name || 'Disciplina sem nome',
                  })),
                ]}
              />

              <Select
                label="Período Acadêmico"
                value={listFilterPeriodId}
                onChange={(e) => setListFilterPeriodId(e.target.value)}
                disabled={!listFilterClassSubjectId || loadingListPeriods || Boolean(listPeriodsError)}
                options={[
                  {
                    value: '',
                    label: !listFilterClassSubjectId
                      ? 'Selecione a disciplina primeiro'
                      : loadingListPeriods
                        ? 'Carregando períodos...'
                        : listPeriodsError
                          ? 'Não foi possível carregar os períodos'
                          : 'Todos',
                  },
                  ...listPeriods.map((period) => ({
                    value: period.id,
                    label: period.name,
                  })),
                ]}
              />

              <Select
                label="Status"
                value={listFilterStatus}
                onChange={(e) => setListFilterStatus(e.target.value as GradeStatus | '')}
                options={[
                  { value: '', label: 'Todos' },
                  { value: GradeStatus.PENDING, label: 'Pendente' },
                  { value: GradeStatus.PUBLISHED, label: 'Publicada' },
                  { value: GradeStatus.FINAL, label: 'Final' },
                ]}
              />
            </div>
          </div>

          {/* Content */}
          {loadingLaunchedGrades ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" text="Carregando avaliações..." />
            </div>
          ) : evaluations.length > 0 ? (
            <div className="space-y-4">
              {evaluations.map((evaluation: any) => {
                const isPending = evaluation.status === GradeStatus.PENDING;
                const isPublished = evaluation.status === GradeStatus.PUBLISHED;
                const isFinal = evaluation.status === GradeStatus.FINAL;
                const isVisibleToStudents = evaluation.grades.every(
                  (grade: any) => grade.isVisibleToStudents !== false,
                );

                return (
                  <div
                    key={evaluation.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="p-2 rounded-lg"
                            style={{
                              backgroundColor: evaluation.classSubject?.subject?.color
                                ? `${evaluation.classSubject.subject.color}20`
                                : '#E5E7EB',
                            }}
                          >
                            <BookOpenIcon
                              className="h-5 w-5"
                              style={{
                                color: evaluation.classSubject?.subject?.color || '#6B7280',
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {evaluation.classSubject?.class?.name} -{' '}
                              {evaluation.classSubject?.subject?.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {evaluation.academicPeriod?.name}
                            </p>
                          </div>
                          <div>
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                <ClockIcon className="h-4 w-4" />
                                Pendente
                              </span>
                            )}
                            {isPublished && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                <CheckCircleIcon className="h-4 w-4" />
                                Publicada
                              </span>
                            )}
                            {isFinal && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                <CheckCircleIcon className="h-4 w-4" />
                                Final
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Avaliação
                            </div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {evaluation.examType}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Alunos
                            </div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {evaluation.studentCount}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Média
                            </div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {evaluation.average}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<EyeIcon className="h-4 w-4" />}
                        onClick={() => handleReviewClick(evaluation)}
                      >
                        Visualizar notas
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={() =>
                          visibilityMutation.mutate({
                            gradeIds: evaluation.grades.map((grade: any) => grade.id),
                            visible: !isVisibleToStudents,
                          })
                        }
                        disabled={visibilityMutation.isPending}
                      >
                        <span
                          role="switch"
                          aria-checked={isVisibleToStudents}
                          className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
                            isVisibleToStudents ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
                          }`}
                        >
                          <span
                            className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                              isVisibleToStudents ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </span>
                        <span>{isVisibleToStudents ? 'Mostrar para alunos' : 'Oculto para alunos'}</span>
                      </Button>
                      {isPending && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<CheckCircleIcon className="h-4 w-4" />}
                            onClick={() => handlePublishClick(evaluation)}
                            disabled={publishMutation.isPending}
                          >
                            Publicar
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            leftIcon={<TrashIcon className="h-4 w-4" />}
                            onClick={() => handleDeleteClick(evaluation)}
                            disabled={deleteMutation.isPending}
                          >
                            Excluir
                          </Button>
                        </>
                      )}
                      {(isPublished || isFinal) && (
                        <Button
                          variant="danger"
                          size="sm"
                          leftIcon={<TrashIcon className="h-4 w-4" />}
                          onClick={() => handleDeleteClick(evaluation)}
                          disabled={deleteMutation.isPending}
                        >
                          Excluir
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
              <ClipboardDocumentListIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Nenhuma avaliação encontrada
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Você ainda não lançou nenhuma nota ou não há avaliações que correspondam aos
                filtros selecionados
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
