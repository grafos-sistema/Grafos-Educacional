'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { classesService } from '@/services/classes.service';
import { coursesService } from '@/services/courses.service';
import { academicYearsService } from '@/services/academic-years.service';
import { usersService } from '@/services/users.service';
import { CreateClassDto } from '@/types/class.types';
import { UserRole } from '@/types/user.types';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

// Opções de turno
const shiftOptions = [
  { value: '', label: 'Selecione um turno' },
  { value: 'Matutino', label: 'Matutino' },
  { value: 'Vespertino', label: 'Vespertino' },
  { value: 'Noturno', label: 'Noturno' },
  { value: 'Integral', label: 'Integral' },
];

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
  } = useForm<CreateClassDto>();

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

  const onSubmit = async (data: CreateClassDto) => {
    if (!user?.institutionId) {
      setError('Instituição não encontrada');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const classData: CreateClassDto = {
        ...data,
        institutionId: user.institutionId,
        maxStudents: data.maxStudents ? Number(data.maxStudents) : undefined,
        mainTeacherId: data.mainTeacherId || undefined, // Converte string vazia para undefined
        isActive: data.isActive ?? true,
      };

      await classesService.create(classData);

      // Invalidar cache para forçar refresh da lista de turmas
      await queryClient.invalidateQueries({ queryKey: ['classes'] });

      toast.success('Turma criada com sucesso!');
      router.push('/admin/classes');
    } catch (err: any) {
      console.error('Erro ao criar turma:', err);
      const errorMsg = err?.message || 'Erro ao criar turma. Tente novamente.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          Nova Turma
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Preencha os dados para criar uma nova turma
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
                {...register('name', { required: 'Nome é obrigatório' })}
                error={errors.name?.message}
                placeholder="Ex: 1º Ano A, 2º Ano B"
                required
              />
              <Input
                label="Série/Ano"
                {...register('grade', { required: 'Série/Ano é obrigatório' })}
                error={errors.grade?.message}
                placeholder="Ex: 1º Ano, 2º Ano, 3º Ano"
                required
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

          {/* Curso e Ano Letivo */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Vinculação
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Curso"
                {...register('courseId', { required: 'Curso é obrigatório' })}
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
                {...register('academicYearId', { required: 'Ano letivo é obrigatório' })}
                options={[
                  { value: '', label: 'Selecione um ano letivo' },
                  ...(academicYearsData?.data.map((year) => ({
                    value: year.id,
                    label: `${year.year} - ${year.name}`,
                  })) || []),
                ]}
                error={errors.academicYearId?.message}
                required
                disabled={loadingYears}
              />
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
