'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  AcademicCapIcon,
  ArrowLeftIcon,
  CalendarIcon,
  EnvelopeIcon,
  IdentificationIcon,
  PhoneIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { usersService } from '@/services/users.service';
import { teachersService } from '@/services/teachers.service';
import { teacherSubjectsService } from '@/services/teacher-subjects.service';
import { UserRole, Gender } from '@/types/user.types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatCPF, formatPhone } from '@/components/ui/MaskedInput';

const genderLabels: Record<Gender, string> = {
  MALE: 'Masculino',
  FEMALE: 'Feminino',
  OTHER: 'Outro',
  NOT_INFORMED: 'Não informado',
};

function formatDate(date?: string) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
}

export default function CoordinatorTeacherDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  const { data: user, isLoading } = useQuery({
    queryKey: ['coordinator-teacher-detail', userId],
    queryFn: () => usersService.findOne(userId),
    enabled: Boolean(userId),
  });

  const teacherProfileId = user?.teacherProfile?.id;

  const { data: teacherClasses = [] } = useQuery({
    queryKey: ['coordinator-teacher-classes', teacherProfileId],
    queryFn: () => teachersService.getTeacherClasses(teacherProfileId!),
    enabled: Boolean(teacherProfileId),
  });

  const { data: teacherSubjects = [] } = useQuery({
    queryKey: ['coordinator-teacher-subjects', teacherProfileId],
    queryFn: () => teacherSubjectsService.getByTeacher(teacherProfileId!),
    enabled: Boolean(teacherProfileId),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" text="Carregando professor..." />
      </div>
    );
  }

  if (!user || user.role !== UserRole.TEACHER) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-600 dark:text-gray-400">
          Professor não encontrado.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/coordinator/professores')}
          leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
          className="mb-4"
        >
          Voltar
        </Button>
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          Detalhes do Professor
        </h1>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-gray-600 dark:text-gray-400">Informações completas do professor</p>
          <Button
            onClick={() => router.push('/coordinator/academic-distribution')}
            leftIcon={<AcademicCapIcon className="h-4 w-4" />}
          >
            Gerenciar distribuição
          </Button>
        </div>
      </div>

      <div className="mb-6 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
          Disciplinas habilitadas
        </h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Estas são as disciplinas que podem ser distribuídas para o professor nas turmas.
        </p>
        {teacherSubjects.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {teacherSubjects.map((item) => (
              <Badge key={item.id} variant="info">
                {item.subject.name}{item.subject.code ? ` (${item.subject.code})` : ''}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nenhuma disciplina habilitada. Use “Gerenciar distribuição” para configurar.
          </p>
        )}
      </div>

      <div className="mb-6 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        <div className="flex items-start gap-4">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={`${user.firstName} ${user.lastName}`}
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-2xl font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              {user.firstName?.charAt(0).toUpperCase() || 'P'}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="info">Professor</Badge>
              <Badge variant={user.isActive ? 'success' : 'error'}>
                {user.isActive ? 'Ativo' : 'Inativo'}
              </Badge>
              {user.emailVerified ? <Badge variant="success">Email Verificado</Badge> : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Informações de Contato
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <EnvelopeIcon className="h-5 w-5 text-gray-400" />
            <span>{user.email}</span>
          </div>
          {user.phone ? (
            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
              <PhoneIcon className="h-5 w-5 text-gray-400" />
              <span>{formatPhone(user.phone)}</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mb-6 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Informações Pessoais
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">
              CPF
            </label>
            <div className="flex items-center gap-2">
              <IdentificationIcon className="h-5 w-5 text-gray-400" />
              <span className="text-gray-900 dark:text-gray-100">
                {user.cpf ? formatCPF(user.cpf) : '-'}
              </span>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">
              Data de Nascimento
            </label>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <span className="text-gray-900 dark:text-gray-100">{formatDate(user.birthDate)}</span>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">
              Gênero
            </label>
            <span className="text-gray-900 dark:text-gray-100">
              {user.gender ? genderLabels[user.gender] : '-'}
            </span>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">
              Matrícula funcional
            </label>
            <span className="text-gray-900 dark:text-gray-100">
              {user.teacherProfile?.registrationNumber || '-'}
            </span>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">
              Especialização
            </label>
            <span className="text-gray-900 dark:text-gray-100">
              {user.teacherProfile?.specialization || '-'}
            </span>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">
              Admissão
            </label>
            <span className="text-gray-900 dark:text-gray-100">
              {formatDate(user.teacherProfile?.hireDate)}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Turmas e Disciplinas
        </h3>

        {teacherClasses.length > 0 ? (
          <div className="space-y-3">
            {teacherClasses.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/60"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className="rounded-lg p-2"
                      style={{
                        backgroundColor: item.subject?.color ? `${item.subject.color}20` : '#E5E7EB',
                      }}
                    >
                      <AcademicCapIcon
                        className="h-5 w-5"
                        style={{ color: item.subject?.color || '#4B5563' }}
                      />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {item.subject?.name || 'Disciplina'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {item.class.name}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.class.course?.name ? <Badge variant="info">{item.class.course.name}</Badge> : null}
                    {item.class.academicYear?.year ? (
                      <Badge variant="info">{String(item.class.academicYear.year)}</Badge>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-600 dark:text-gray-400 md:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <UserGroupIcon className="h-4 w-4" />
                    <span>{item.class._count?.enrollments || 0} alunos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{item.class.shift || 'Turno não informado'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AcademicCapIcon className="h-4 w-4" />
                    <span>{item.weeklyHours ? `${item.weeklyHours}h/semana` : 'Carga horária não informada'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400">
            Nenhuma turma atribuída a este professor.
          </div>
        )}
      </div>
    </div>
  );
}
