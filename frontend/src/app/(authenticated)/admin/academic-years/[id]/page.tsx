'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  PencilIcon,
  CalendarIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { academicYearsService } from '@/services/academic-years.service';
import { academicPeriodsService } from '@/services/academic-periods.service';
import { AcademicPeriod, AcademicPeriodType, CreateAcademicPeriodDto } from '@/types/academic.types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useForm } from 'react-hook-form';
import {
  buildIsoDate,
  getDayOptions,
  getPeriodPresetOptions,
  monthOptions,
} from '@/lib/academic-calendar';

const periodTypeLabels: Record<AcademicPeriodType, string> = {
  SEMESTER: 'Semestre',
  TRIMESTER: 'Trimestre',
  QUARTER: 'Quarter',
  BIMESTER: 'Bimestre',
  ANNUAL: 'Anual',
};

const periodTypeOptions = Object.entries(periodTypeLabels).map(([value, label]) => ({
  value,
  label,
}));

type CreateAcademicPeriodFormValues = {
  type: AcademicPeriodType | '';
  periodPreset: string;
  startDay: string;
  startMonth: string;
  endDay: string;
  endMonth: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

const defaultPeriodFormValues: CreateAcademicPeriodFormValues = {
  type: '',
  periodPreset: '',
  startDay: '',
  startMonth: '',
  endDay: '',
  endMonth: '',
  startDate: '',
  endDate: '',
  isActive: true,
};
const allDayOptions = Array.from({ length: 31 }, (_, index) => {
  const day = index + 1;
  return {
    value: String(day),
    label: String(day).padStart(2, '0'),
  };
});

function getDateParts(date: string) {
  const [year, month, day] = date.slice(0, 10).split('-');
  return {
    year,
    month,
    day,
  };
}

function normalizeSelectDatePart(value?: string) {
  if (!value) return '';
  return String(Number(value));
}

export default function AcademicYearDetailPage() {
  const router = useRouter();
  const params = useParams();
  const academicYearId = params?.id as string;

  const [addPeriodModal, setAddPeriodModal] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<AcademicPeriod | null>(null);
  const [deletePeriodModal, setDeletePeriodModal] = useState<{
    isOpen: boolean;
    period: AcademicPeriod | null;
  }>({ isOpen: false, period: null });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    setError,
    clearErrors,
  } = useForm<CreateAcademicPeriodFormValues>({
    defaultValues: defaultPeriodFormValues,
  });

  // Buscar ano letivo
  const { data: academicYear, isLoading } = useQuery({
    queryKey: ['academic-year', academicYearId],
    queryFn: () => academicYearsService.findOne(academicYearId),
    enabled: !!academicYearId,
  });

  // Buscar períodos
  const { data: periods, refetch: refetchPeriods } = useQuery({
    queryKey: ['academic-periods', academicYearId],
    queryFn: () => academicPeriodsService.findByAcademicYear(academicYearId),
    enabled: !!academicYearId,
  });

  const selectedType = watch('type');
  const selectedPeriodPresetValue = watch('periodPreset');
  const startMonth = watch('startMonth');
  const startDay = watch('startDay');
  const endMonth = watch('endMonth');
  const endDay = watch('endDay');

  const activePeriods = useMemo(
    () => (periods ?? []).filter((period) => period.isActive),
    [periods],
  );
  const fixedYear = academicYear?.year ?? new Date().getFullYear();
  const startDayOptions = useMemo(
    () => getDayOptions(fixedYear, startMonth),
    [fixedYear, startMonth],
  );
  const endDayOptions = useMemo(
    () => getDayOptions(fixedYear, endMonth),
    [endMonth, fixedYear],
  );
  const periodPresetOptions = useMemo(() => {
    const usedOrders = new Set(
      activePeriods
        .filter((period) => period.id !== editingPeriod?.id)
        .map((period) => period.orderNumber)
    );
    return getPeriodPresetOptions(selectedType || undefined).map((option) => ({
      ...option,
      disabled: usedOrders.has(option.orderNumber),
    }));
  }, [activePeriods, editingPeriod?.id, selectedType]);
  const selectedPeriodPreset = periodPresetOptions.find(
    (option) => option.value === selectedPeriodPresetValue,
  );

  const closePeriodModal = () => {
    setAddPeriodModal(false);
    setEditingPeriod(null);
    reset(defaultPeriodFormValues);
  };

  const openCreatePeriodModal = () => {
    setEditingPeriod(null);
    reset(defaultPeriodFormValues);
    setAddPeriodModal(true);
  };

  const openEditPeriodModal = (period: AcademicPeriod) => {
    const start = getDateParts(period.startDate);
    const end = getDateParts(period.endDate);
    const matchingPreset = getPeriodPresetOptions(period.type).find(
      (option) => option.orderNumber === period.orderNumber
    );

    setEditingPeriod(period);
    reset({
      type: period.type,
      periodPreset: matchingPreset?.value ?? '',
      startDay: normalizeSelectDatePart(start.day),
      startMonth: normalizeSelectDatePart(start.month),
      endDay: normalizeSelectDatePart(end.day),
      endMonth: normalizeSelectDatePart(end.month),
      startDate: period.startDate.slice(0, 10),
      endDate: period.endDate.slice(0, 10),
      isActive: period.isActive,
    });
    setAddPeriodModal(true);
  };

  useEffect(() => {
    if (
      startMonth &&
      startDay &&
      !startDayOptions.some((option) => option.value === startDay)
    ) {
      setValue('startDay', '');
    }
  }, [setValue, startDay, startDayOptions, startMonth]);

  useEffect(() => {
    if (
      endMonth &&
      endDay &&
      !endDayOptions.some((option) => option.value === endDay)
    ) {
      setValue('endDay', '');
    }
  }, [endDay, endDayOptions, setValue, endMonth]);

  useEffect(() => {
    if (
      selectedPeriodPresetValue &&
      !periodPresetOptions.some((option) => option.value === selectedPeriodPresetValue && !option.disabled)
    ) {
      setValue('periodPreset', '');
    }
  }, [periodPresetOptions, selectedPeriodPresetValue, setValue]);

  useEffect(() => {
    const nextStartDate = buildIsoDate(fixedYear, startMonth, startDay);
    setValue('startDate', nextStartDate, {
      shouldValidate: false,
    });

    if (nextStartDate) {
      clearErrors('startDate');
    }
  }, [clearErrors, fixedYear, setValue, startDay, startMonth]);

  useEffect(() => {
    const nextEndDate = buildIsoDate(fixedYear, endMonth, endDay);
    setValue('endDate', nextEndDate, {
      shouldValidate: false,
    });

    if (nextEndDate) {
      clearErrors('endDate');
    }
  }, [clearErrors, endDay, endMonth, fixedYear, setValue]);

  // Mutation para criar período
  const createPeriodMutation = useMutation({
    mutationFn: (data: CreateAcademicPeriodDto) => academicPeriodsService.create(data),
    onSuccess: () => {
      toast.success('Período criado com sucesso!');
      refetchPeriods();
      setAddPeriodModal(false);
      reset(defaultPeriodFormValues);
    },
    onError: (err: any) => {
      const errorMsg =
        err?.message || 'Não foi possível criar o período. Verifique os dados e tente novamente.';
      toast.error(errorMsg);
    },
  });

  const updatePeriodMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateAcademicPeriodDto }) =>
      academicPeriodsService.update(id, data),
    onSuccess: () => {
      toast.success('Período atualizado com sucesso!');
      refetchPeriods();
      closePeriodModal();
    },
    onError: (err: any) => {
      const errorMsg =
        err?.message || 'Não foi possível atualizar o período. Verifique os dados e tente novamente.';
      toast.error(errorMsg);
    },
  });

  // Mutation para deletar período
  const deletePeriodMutation = useMutation({
    mutationFn: (id: string) => academicPeriodsService.remove(id),
    onSuccess: () => {
      toast.success('Período removido com sucesso!');
      refetchPeriods();
      setDeletePeriodModal({ isOpen: false, period: null });
    },
    onError: (err: any) => {
      const errorMsg = err?.message || 'Não foi possível remover o período.';
      toast.error(errorMsg);
    },
  });

  const onSubmitPeriod = (data: CreateAcademicPeriodFormValues) => {
    if (!selectedPeriodPreset) {
      setError('periodPreset', {
        type: 'manual',
        message: 'Selecione um período pré-definido',
      });
      return;
    }

    if (!data.startDate) {
      setError('startDate', {
        type: 'manual',
        message: 'Selecione o mês e o dia de início',
      });
      return;
    }

    if (!data.endDate) {
      setError('endDate', {
        type: 'manual',
        message: 'Selecione o mês e o dia de término',
      });
      return;
    }

    const parsedStartDate = new Date(`${data.startDate}T00:00:00`);
    const parsedEndDate = new Date(`${data.endDate}T00:00:00`);
    const academicYearStart = new Date(academicYear.startDate);
    const academicYearEnd = new Date(academicYear.endDate);

    if (parsedEndDate <= parsedStartDate) {
      setError('endDate', {
        type: 'manual',
        message: 'A data de término deve ser posterior à data de início',
      });
      return;
    }

    if (parsedStartDate < academicYearStart || parsedEndDate > academicYearEnd) {
      setError('endDate', {
        type: 'manual',
        message: 'As datas do período devem ficar dentro do intervalo do ano letivo',
      });
      return;
    }

    clearErrors(['periodPreset', 'startDate', 'endDate']);

    const payload = {
      academicYearId,
      type: data.type as AcademicPeriodType,
      name: selectedPeriodPreset.name,
      orderNumber: selectedPeriodPreset.orderNumber,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: data.isActive,
    };

    if (editingPeriod) {
      updatePeriodMutation.mutate({
        id: editingPeriod.id,
        data: payload,
      });
      return;
    }

    createPeriodMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Carregando ano letivo..." />
      </div>
    );
  }

  if (!academicYear) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-600 dark:text-gray-400">
          Ano letivo não encontrado
        </div>
      </div>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/academic-years')}
          leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
          className="mb-4"
        >
          Voltar
        </Button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {academicYear.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Detalhes do ano letivo
            </p>
          </div>
          <Button
            onClick={() => router.push(`/admin/academic-years/${academicYearId}/edit`)}
            leftIcon={<PencilIcon className="h-5 w-5" />}
          >
            Editar
          </Button>
        </div>
      </div>

      {/* Informações do Ano Letivo */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <CalendarIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Ano {academicYear.year}
              </h2>
              <Badge variant={academicYear.isActive ? 'success' : 'error'}>
                {academicYear.isActive ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-gray-500 dark:text-gray-400 mb-1">
                  Data de Início
                </label>
                <span className="text-gray-900 dark:text-gray-100">
                  {formatDate(academicYear.startDate)}
                </span>
              </div>
              <div>
                <label className="block text-gray-500 dark:text-gray-400 mb-1">
                  Data de Término
                </label>
                <span className="text-gray-900 dark:text-gray-100">
                  {formatDate(academicYear.endDate)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Períodos Acadêmicos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Períodos Acadêmicos
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {periods?.length || 0} período(s) cadastrado(s)
            </p>
          </div>
          <Button
            size="sm"
            onClick={openCreatePeriodModal}
            leftIcon={<PlusIcon className="h-5 w-5" />}
          >
            Adicionar Período
          </Button>
        </div>

        {/* Lista de períodos */}
        {periods && periods.length > 0 ? (
          <div className="space-y-3">
            {periods
              .sort((a, b) => a.orderNumber - b.orderNumber)
              .map((period) => (
                <div
                  key={period.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {period.name}
                      </span>
                      <Badge variant="info" size="sm">
                        {periodTypeLabels[period.type]}
                      </Badge>
                      {period.isActive && (
                        <Badge variant="success" size="sm">
                          Ativo
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(period.startDate)} - {formatDate(period.endDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditPeriodModal(period)}
                      className="text-gray-600 hover:text-gray-700 dark:text-gray-400 p-2"
                      title="Editar período"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() =>
                        setDeletePeriodModal({ isOpen: true, period })
                      }
                      className="text-red-600 hover:text-red-700 dark:text-red-400 p-2"
                      title="Remover período"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Nenhum período cadastrado. Clique em "Adicionar Período" para começar.
          </div>
        )}
      </div>

      {/* Modal de adicionar período */}
      <Modal
        isOpen={addPeriodModal}
        onClose={closePeriodModal}
        title={editingPeriod ? 'Editar Período Acadêmico' : 'Adicionar Período Acadêmico'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmitPeriod)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Tipo"
              options={[{ value: '', label: 'Selecione...' }, ...periodTypeOptions]}
              {...register('type', { required: 'Tipo é obrigatório' })}
              error={errors.type?.message}
              required
            />
            <Select
              label="Período"
              options={[{ value: '', label: 'Selecione...' }, ...periodPresetOptions]}
              {...register('periodPreset', {
                required: 'Selecione um período pré-definido',
              })}
              error={errors.periodPreset?.message}
              disabled={!selectedType}
              required
            />
          </div>

          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200">
            O ano do período já está definido como <strong>{fixedYear}</strong>. Nome e ordem são preenchidos automaticamente pela opção escolhida.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-900/30">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Início do período
              </p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <Select
                  label="Dia"
                  options={[
                    { value: '', label: 'Selecione...' },
                    ...(startMonth ? startDayOptions : allDayOptions),
                  ]}
                  {...register('startDay')}
                  required
                />
                <Select
                  label="Mês"
                  options={[{ value: '', label: 'Selecione...' }, ...monthOptions]}
                  {...register('startMonth')}
                  required
                />
              </div>
              <input
                type="hidden"
                {...register('startDate', {
                  required: 'Selecione o mês e o dia de início',
                })}
              />
              {errors.startDate?.message ? (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.startDate.message}</p>
              ) : null}
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-900/30">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Término do período
              </p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <Select
                  label="Dia"
                  options={[
                    { value: '', label: 'Selecione...' },
                    ...(endMonth ? endDayOptions : allDayOptions),
                  ]}
                  {...register('endDay')}
                  required
                />
                <Select
                  label="Mês"
                  options={[{ value: '', label: 'Selecione...' }, ...monthOptions]}
                  {...register('endMonth')}
                  required
                />
              </div>
              <input
                type="hidden"
                {...register('endDate', {
                  required: 'Selecione o mês e o dia de término',
                })}
              />
              {errors.endDate?.message ? (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.endDate.message}</p>
              ) : null}
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('isActive')}
                defaultChecked={true}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Período ativo
              </span>
            </label>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="secondary"
              onClick={closePeriodModal}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={createPeriodMutation.isPending || updatePeriodMutation.isPending}
              disabled={createPeriodMutation.isPending || updatePeriodMutation.isPending}
            >
              {editingPeriod ? 'Salvar alterações' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de confirmação de exclusão de período */}
      <Modal
        isOpen={deletePeriodModal.isOpen}
        onClose={() => setDeletePeriodModal({ isOpen: false, period: null })}
        title="Confirmar remoção"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Tem certeza que deseja remover o período{' '}
            <strong>{deletePeriodModal.period?.name}</strong>?
          </p>
          <p className="text-sm text-red-600 dark:text-red-400">
            Esta ação não poderá ser desfeita se houver notas ou planos de aula vinculados.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setDeletePeriodModal({ isOpen: false, period: null })}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                deletePeriodModal.period &&
                deletePeriodMutation.mutate(deletePeriodModal.period.id)
              }
              isLoading={deletePeriodMutation.isPending}
            >
              Remover
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
