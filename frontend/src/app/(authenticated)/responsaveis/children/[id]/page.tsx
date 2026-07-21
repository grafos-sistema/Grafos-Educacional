'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  AcademicCapIcon,
  UserGroupIcon,
  BookOpenIcon,
  CalendarIcon,
  ChartBarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { usersService } from '@/services/users.service';
import { classesService } from '@/services/classes.service';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function ChildDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  const childId = params.id as string;

  // Buscar dados do filho
  const { data: child, isLoading: loadingChild } = useQuery({
    queryKey: ['child-details', childId],
    queryFn: () => usersService.findOne(childId),
    enabled: !!childId,
  });

  // Buscar matrículas do filho
  const { data: enrollments, isLoading: loadingEnrollments } = useQuery({
    queryKey: ['child-enrollments', childId],
    queryFn: async () => {
      const response = await classesService.findAll({
        institutionId: user?.institutionId,
        limit: 100,
      });

      const allEnrollments = await Promise.all(
        response.data.map(async (classItem) => {
          try {
            const enrollments = await classesService.getEnrollments(classItem.id);
            return enrollments
              .filter((e) => e.studentId === childId)
              .map((e) => ({
                ...e,
                class: classItem,
              }));
          } catch {
            return [];
          }
        })
      );

      return allEnrollments.flat();
    },
    enabled: !!childId && !!user?.institutionId,
  });

  // Buscar disciplinas das turmas
  const { data: classSubjects } = useQuery({
    queryKey: ['child-subjects', enrollments],
    queryFn: async () => {
      if (!enrollments || enrollments.length === 0) return [];

      const allSubjects = await Promise.all(
        enrollments.map(async (enrollment) => {
          try {
            const subjects = await classesService.getClassSubjects(enrollment.class.id);
            return subjects.map((s) => ({
              ...s,
              class: enrollment.class,
            }));
          } catch {
            return [];
          }
        })
      );

      return allSubjects.flat();
    },
    enabled: !!enrollments && enrollments.length > 0,
  });

  const quickActions = [
    {
      title: 'Ver Notas',
      description: 'Boletim completo',
      icon: AcademicCapIcon,
      href: `/responsaveis/children/${childId}/grades`,
      color: 'bg-green-500',
    },
    {
      title: 'Ver Frequência',
      description: 'Presença nas aulas',
      icon: CalendarIcon,
      href: `/responsaveis/children/${childId}/attendance`,
      color: 'bg-blue-500',
    },
    {
      title: 'Grade Horária',
      description: 'Horário de aulas',
      icon: ClockIcon,
      href: `/responsaveis/children/${childId}/schedule`,
      color: 'bg-purple-500',
    },
  ];

  if (loadingChild) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Carregando dados..." />
      </div>
    );
  }

  if (!child) {
    return (
      <div className="p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Aluno não encontrado
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Não foi possível encontrar os dados deste aluno
          </p>
          <Button onClick={() => router.push('/responsaveis/dashboard')}>Voltar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/responsaveis/dashboard')}
          leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
          className="mb-4"
        >
          Voltar
        </Button>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
            {child.firstName[0]}
            {child.lastName[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {child.firstName} {child.lastName}
            </h1>
            <div className="flex items-center gap-3">
              <Badge variant={child.isActive ? 'success' : 'error'}>
                {child.isActive ? 'Ativo' : 'Inativo'}
              </Badge>
              <span className="text-gray-600 dark:text-gray-400">
                Matrícula: {child.studentProfile?.registrationNumber}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Turmas</div>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {enrollments?.length || 0}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <BookOpenIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Disciplinas</div>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {classSubjects?.length || 0}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Média Geral</div>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">-</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Em desenvolvimento
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Frequência</div>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">-</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Em desenvolvimento
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Acesso Rápido
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.title}
                onClick={() => router.push(action.href)}
                className="text-left bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md hover:-translate-y-0.5 transition-all group border border-gray-100 dark:border-gray-700"
              >
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${action.color} mb-4 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{action.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Personal Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Informações Pessoais
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Nome Completo</div>
            <div className="text-gray-900 dark:text-white">
              {child.firstName} {child.lastName}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Número de Matrícula
            </div>
            <div className="text-gray-900 dark:text-white">
              {child.studentProfile?.registrationNumber}
            </div>
          </div>
          {child.email && (
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">E-mail</div>
              <div className="text-gray-900 dark:text-white">{child.email}</div>
            </div>
          )}
          {child.birthDate && (
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Data de Nascimento
              </div>
              <div className="text-gray-900 dark:text-white">
                {new Date(child.birthDate).toLocaleDateString('pt-BR')}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Classes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Turmas</h2>
        {loadingEnrollments ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : enrollments && enrollments.length > 0 ? (
          <div className="space-y-3">
            {enrollments.map((enrollment) => (
              <div
                key={enrollment.id}
                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <UserGroupIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {enrollment.class.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {enrollment.class.course?.name} • {enrollment.class.grade}
                    </div>
                  </div>
                </div>
                <Badge variant={enrollment.class.isActive ? 'success' : 'error'} size="sm">
                  {enrollment.class.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Não matriculado em nenhuma turma
          </div>
        )}
      </div>

      {/* Subjects */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Disciplinas</h2>
        {classSubjects && classSubjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {classSubjects.map((subject) => (
              <div
                key={subject.id}
                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center gap-3"
              >
                <div
                  className="p-2 rounded-lg"
                  style={{
                    backgroundColor: subject.subject?.color
                      ? `${subject.subject.color}20`
                      : '#E5E7EB',
                  }}
                >
                  <BookOpenIcon
                    className="h-5 w-5"
                    style={{ color: subject.subject?.color || '#6B7280' }}
                  />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                    {subject.subject?.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Prof. {subject.teacher?.firstName}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Nenhuma disciplina encontrada
          </div>
        )}
      </div>
    </div>
  );
}
