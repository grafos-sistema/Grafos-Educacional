'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { classesService } from '@/services/classes.service';
import { coursesService } from '@/services/courses.service';
import { academicYearsService } from '@/services/academic-years.service';
import { usersService } from '@/services/users.service';
import { UpdateClassDto } from '@/types/class.types';
import { UserRole } from '@/types/user.types';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Opções de turno
const shiftOptions = [
  { value: '', label: 'Selecione um turno' },
  { value: 'Matutino', label: 'Matutino' },
  { value: 'Vespertino', label: 'Vespertino' },
  { value: 'Noturno', label: 'Noturno' },
  { value: 'Integral', label: 'Integral' },
];

export default function EditClassPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params?.id as string;
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar turma
  const { data: classData, isLoading } = useQuery({
    queryKey: ['class', classId],
    queryFn: () => classesService.findOne(classId),
    enabled: !!classId,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateClassDto>();

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

  // Buscar professores para o select
  const { data: teachersData, isLoading: loadingTeachers } = useQuery({
    queryKey: ['teachers', { institutionId: user?.institutionId, role: 'TEACHER' }],
    queryFn: () =>
      usersService.findAll({
        institutionId: user?.institutionId,
        role: UserRole.TEACHER,
        isActive: true,
        limit: 1000,
      }),
  });

  // Preencher formulário quando turma carregar
  useEffect(() => {
    if (classData) {
      reset({
        name: classData.name,
        grade: classData.grade,
        section: classData.section || '',
        shift: classData.shift || '',
        maxStudents: classData.maxStudents,
        mainTeacherId: classData.mainTeacherId || '',
        isActive: classData.isActive,
      });
    }
  }, [classData, reset]);

  const onSubmit = async (data: UpdateClassDto) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Remove courseId e academicYearId do update (não podem ser atualizados)
      const { courseId, academicYearId, ...updateFields } = data as any;

      const updateData: UpdateClassDto = {
        ...updateFields,
        maxStudents: data.maxStudents ? Number(data.maxStudents) : undefined,
        mainTeacherId: data.mainTeacherId || undefined, // Converte string vazia para undefined
      };

      await classesService.update(classId, updateData);

      // Invalidar queries para forçar refresh dos dados
      await queryClient.invalidateQueries({ queryKey: ['class', classId] });
      await queryClient.invalidateQueries({ queryKey: ['classes'] });

      toast.success('Turma atualizada com sucesso!');
      router.push(`/admin/classes/${classId}`);
    } catch (err: any) {
      console.error('Erro ao atualizar turma:', err);
      const errorMsg = err?.message || 'Erro ao atualizar turma. Tente novamente.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Carregando turma..." />
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-600 dark:text-gray-400">
          Turma não encontrada
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
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
          Editar Turma
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Atualize as informações da turma
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

          {/* Informações básicas */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Informações da Turma
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nome da Turma"
                {...register('name')}
                error={errors.name?.message}
                placeholder="Ex: 1º Ano A, 2º Ano B"
              />
              <Input
                label="Série/Ano"
                {...register('grade')}
                error={errors.grade?.message}
                placeholder="Ex: 1º Ano, 2º Ano, 3º Ano"
              />
              <Input
                label="Turma/Seção"
                {...register('section')}
                error={errors.section?.message}
                placeholder="Ex: A, B, C"
              />
              <Select
                label="Turno"
                {...register('shift')}
                options={shiftOptions}
                error={errors.shift?.message}
              />
            </div>
          </div>

          {/* Curso e Ano Letivo (somente leitura) */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Vinculação
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              O curso e ano letivo não podem ser alterados após a criação da turma.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Curso
                </label>
                <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
                  <span className="text-gray-900 dark:text-gray-100">
                    {classData?.course?.name || 'Não informado'}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ano Letivo
                </label>
                <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
                  <span className="text-gray-900 dark:text-gray-100">
                    {classData?.academicYear
                      ? `${classData.academicYear.year} - ${classData.academicYear.name}`
                      : 'Não informado'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Professor Titular */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Professor Responsável
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <Select
                label="Professor Titular"
                {...register('mainTeacherId')}
                options={[
                  { value: '', label: 'Selecione um professor (opcional)' },
                  ...(teachersData?.data.map((teacher) => ({
                    value: teacher.teacherProfile?.id || '',
                    label: `${teacher.firstName} ${teacher.lastName} (${teacher.email})`,
                  })) || []),
                ]}
                error={errors.mainTeacherId?.message}
                disabled={loadingTeachers}
                helpText="Professor principal responsável pela turma"
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
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
