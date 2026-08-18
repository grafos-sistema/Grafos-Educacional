'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { classesService } from '@/services/classes.service';
import { coursesService } from '@/services/courses.service';
import { academicYearsService } from '@/services/academic-years.service';
import { CreateClassDto } from '@/types/class.types';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  buildClassName,
  classSectionOptions,
  classShiftOptions,
  getClassSeriesOptions,
  supportsClassSeriesOptions,
} from '@/lib/constants/class-options';
import { presentFriendlyError } from '@/lib/friendly-error';

export default function NewClassPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    clearErrors,
    watch,
  } = useForm<CreateClassDto>();

  const watchedCourseId = watch('courseId') ?? '';
  const watchedAcademicYearId = watch('academicYearId') ?? '';
  const watchedGrade = watch('grade') ?? '';
  const watchedSection = watch('section') ?? '';
  const watchedShift = watch('shift') ?? '';
  const watchedName = watch('name') ?? '';
  // Buscar cursos para o select
  const { data: coursesData, isLoading: loadingCourses } = useQuery({
    queryKey: ['courses', { institutionId: user?.institutionId, limit: 100 }],
    queryFn: () =>
      coursesService.findAll({
        institutionId: user?.institutionId,
        limit: 100,
        isActive: true,
      }),
  });

  // Buscar anos letivos para o select
  const { data: academicYearsData, isLoading: loadingYears } = useQuery({
    queryKey: ['academic-years', { institutionId: user?.institutionId, limit: 100 }],
    queryFn: () =>
      academicYearsService.findAll({
        institutionId: user?.institutionId,
        limit: 100,
        isActive: true,
      }),
  });

  const selectedCourse = useMemo(
    () => coursesData?.data.find((course) => course.id === watchedCourseId),
    [coursesData?.data, watchedCourseId]
  );
  const selectedCourseLevel = selectedCourse?.level;
  const seriesOptions = useMemo(
    () => getClassSeriesOptions(selectedCourseLevel),
    [selectedCourseLevel]
  );
  const supportsSeries = supportsClassSeriesOptions(selectedCourseLevel);
  useEffect(() => {
    if (!supportsSeries && watchedGrade) {
      setValue('grade', '', { shouldValidate: true });
    }
  }, [setValue, supportsSeries, watchedGrade]);

  useEffect(() => {
    const validGradeValues = new Set(seriesOptions.map((option) => option.value));

    if (watchedGrade && !validGradeValues.has(watchedGrade)) {
      setValue('grade', '', { shouldValidate: true });
    }
  }, [seriesOptions, setValue, watchedGrade]);

  useEffect(() => {
    const generatedName = buildClassName({
      courseLevel: selectedCourseLevel,
      grade: watchedGrade,
      section: watchedSection,
    });

    setValue('name', generatedName, { shouldValidate: true });
  }, [selectedCourseLevel, setValue, watchedGrade, watchedSection]);

  const onSubmit = async (data: CreateClassDto) => {
    if (!user?.institutionId) {
      setError('Instituição não encontrada');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (!supportsSeries) {
        setError('Selecione um curso com nível compatível com séries/anos já configurados.');
        setIsSubmitting(false);
        return;
      }

      const classData: CreateClassDto = {
        ...data,
        institutionId: user.institutionId,
        maxStudents: data.maxStudents ? Number(data.maxStudents) : undefined,
        baseRoom: data.name?.trim() || undefined,
        isActive: data.isActive ?? true,
      };

      await classesService.create(classData);

      // A lista fica inativa enquanto o formulário está aberto. RefetchType=all
      // garante que ela seja atualizada antes de voltar para a listagem.
      await queryClient.invalidateQueries({
        queryKey: ['classes'],
        refetchType: 'all',
      });

      toast.success('Turma criada com sucesso!');
      router.push('/admin/classes');
    } catch (err: any) {
      const friendlyError = presentFriendlyError(
        err,
        'Nao foi possivel criar a turma agora. Revise os dados e tente novamente.'
      );
      setError(friendlyError.description);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
          className="mb-4"
        >
          Voltar
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Nova Turma
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Defina a estrutura da turma e sua sala. Os professores entram depois pelos
          vínculos de disciplina.
        </p>
      </div>

      {/* Formulário */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Erro geral */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div>
            <input type="hidden" {...register('courseId', { required: 'Curso é obrigatório' })} />
            <input
              type="hidden"
              {...register('academicYearId', { required: 'Ano letivo é obrigatório' })}
            />
            <input type="hidden" {...register('grade', { required: 'Série / Ano é obrigatório' })} />
            <input type="hidden" {...register('section', { required: 'Turma é obrigatória' })} />
            <input type="hidden" {...register('shift')} />
            <input type="hidden" {...register('baseRoom')} />
            <input type="hidden" {...register('name', { required: 'Nome da turma é obrigatório' })} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Curso"
                value={watchedCourseId}
                onChange={(event) => {
                  setValue('courseId', event.target.value, { shouldValidate: true });
                  clearErrors('courseId');
                }}
                options={[
                  { value: '', label: 'Selecione um curso' },
                  ...(coursesData?.data.map((course) => ({
                    value: course.id,
                    label: course.name,
                  })) || []),
                ]}
                error={errors.courseId?.message}
                required
                disabled={loadingCourses}
              />
              <Select
                label="Ano Letivo"
                value={watchedAcademicYearId}
                onChange={(event) => {
                  setValue('academicYearId', event.target.value, { shouldValidate: true });
                  clearErrors('academicYearId');
                }}
                options={[
                  { value: '', label: 'Selecione um ano letivo' },
                  ...(academicYearsData?.data.map((year) => ({
                    value: year.id,
                    label: String(year.year),
                  })) || []),
                ]}
                error={errors.academicYearId?.message}
                required
                disabled={loadingYears}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Série / Ano"
                value={watchedGrade}
                onChange={(event) => {
                  setValue('grade', event.target.value, { shouldValidate: true });
                  clearErrors('grade');
                }}
                options={seriesOptions}
                error={errors.grade?.message}
                required
                disabled={!supportsSeries || !watchedCourseId}
                helperText={
                  watchedCourseId && !supportsSeries
                    ? 'Para este tipo de curso, os períodos serão implementados depois.'
                    : undefined
                }
              />
              <Select
                label="Turma"
                value={watchedSection}
                onChange={(event) => {
                  setValue('section', event.target.value, { shouldValidate: true });
                  clearErrors('section');
                }}
                options={classSectionOptions}
                error={errors.section?.message}
                required
              />
              <Select
                label="Turno"
                value={watchedShift}
                onChange={(event) => {
                  setValue('shift', event.target.value, { shouldValidate: true });
                  clearErrors('shift');
                }}
                options={classShiftOptions}
                error={errors.shift?.message}
              />
              <Input
                label="Nome da Turma"
                value={watchedName}
                error={errors.name?.message}
                placeholder="Ex: EF1 | 1ª Ano B"
                readOnly
                required
                helperText="Preenchido automaticamente com base no curso, série/ano e turma."
              />
              <Input
                label="Sala"
                value={watchedName}
                placeholder="A própria turma define a sala"
                readOnly
                helperText="Neste sistema, turma e sala são a mesma referência operacional. O horário só sobrescreve isso quando a aula acontecer em outro ambiente."
              />
            </div>
          </div>

          {/* Capacidade */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Capacidade
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Máximo de Alunos"
                type="number"
                min="1"
                {...register('maxStudents')}
                error={errors.maxStudents?.message}
                placeholder="Ex: 30, 40"
                helpText="Deixe em branco para capacidade ilimitada"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('isActive')}
                defaultChecked={true}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Turma ativa
              </span>
            </label>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Turmas ativas podem receber matrículas e atribuições de disciplinas
            </p>
          </div>

          {/* Ações */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
              Criar Turma
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
