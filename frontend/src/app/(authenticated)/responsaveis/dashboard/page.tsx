'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { UserRole } from '@/types/user.types';
import {
  UserGroupIcon,
  CalendarDaysIcon,
  ClipboardDocumentCheckIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ArrowRightIcon,
  UsersIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { usersService } from '@/services/users.service';
import { parentsService, ParentStudent } from '@/services/parents.service';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import BarChart from '@/components/charts/BarChart';

export default function PaisDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  // Buscar perfil completo do responsável para obter o ID do parent
  const { data: parentProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ['parent-profile', user?.id],
    queryFn: () => usersService.findOne(user!.id),
    enabled: !!user?.id && user?.role === UserRole.PARENT,
  });

  // Buscar dados dos filhos (students) com informações de matrícula e desempenho
  const { data: children, isLoading: loadingChildren } = useQuery<ParentStudent[]>({
    queryKey: ['parent-children', parentProfile?.parentProfile?.id],
    queryFn: () => parentsService.getChildren(parentProfile!.parentProfile!.id),
    enabled: !!parentProfile?.parentProfile?.id,
  });

  const quickActions = [
    {
      title: 'Boletim',
      description: 'Ver notas dos filhos',
      icon: ClipboardDocumentCheckIcon,
      href: '/responsaveis/grades',
      color: 'bg-green-500',
    },
    {
      title: 'Frequência',
      description: 'Acompanhar presença',
      icon: CalendarDaysIcon,
      href: '/responsaveis/attendance',
      color: 'bg-blue-500',
    },
    {
      title: 'Horários',
      description: 'Ver grade de aulas',
      icon: BookOpenIcon,
      href: '/responsaveis/schedule',
      color: 'bg-purple-500',
    },
    {
      title: 'Disciplinas',
      description: 'Matérias dos filhos',
      icon: AcademicCapIcon,
      href: '/responsaveis/subjects',
      color: 'bg-orange-500',
    },
  ];

  // Estatísticas gerais
  const totalChildren = children?.length || 0;
  const totalClasses = children?.reduce((acc, child) => acc + (child.enrollments?.length || 0), 0) || 0;
  const totalSubjects = children?.reduce((acc, child) => acc + (child.subjectsCount || 0), 0) || 0;

  const stats = [
    {
      name: 'Filhos',
      value: totalChildren,
      subtitle: totalChildren === 1 ? 'Cadastrado' : 'Cadastrados',
      icon: UsersIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Turmas',
      value: totalClasses,
      subtitle: 'Total',
      icon: UserGroupIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Disciplinas',
      value: totalSubjects,
      subtitle: 'Total',
      icon: BookOpenIcon,
      color: 'bg-purple-500',
    },
    {
      name: 'Desempenho',
      value: '-',
      subtitle: 'Em desenvolvimento',
      icon: ChartBarIcon,
      color: 'bg-orange-500',
    },
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Carregando..." />
      </div>
    );
  }

  const isLoading = loadingProfile || loadingChildren;

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Portal da Família
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Bem-vindo, {user.firstName}! Acompanhe o desenvolvimento dos seus filhos.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                {stat.name}
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{stat.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Acesso Rápido
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.title}
                onClick={() => router.push(action.href)}
                className="text-left bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md hover:-translate-y-0.5 transition-all group border border-gray-100 dark:border-gray-700"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${action.color} mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {action.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparativo entre Filhos */}
      {children && children.length > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5 text-blue-600" />
            Comparativo de Matrículas e Disciplinas
          </h2>
          <BarChart
            data={children.map((child) => ({
              nome: `${child.student?.firstName} ${child.student?.lastName?.charAt(0)}.`,
              'Turmas': child.enrollments?.length || 0,
              'Disciplinas': child.subjectsCount || 0,
            }))}
            xKey="nome"
            yKeys={[
              { key: 'Turmas', name: 'Turmas', color: '#3B82F6' },
              { key: 'Disciplinas', name: 'Disciplinas', color: '#10B981' },
            ]}
            height={250}
          />
        </div>
      )}

      {/* My Children */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Meus Filhos
          </h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="md" text="Carregando filhos..." />
          </div>
        ) : children && children.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {children.map((childData) => {
              if (!childData) return null;
              const { student, enrollments = [], subjectsCount = 0, alerts = [] } = childData;

              return (
                <div
                  key={student.id}
                  className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  {/* Student Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <AcademicCapIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {student.firstName} {student.lastName}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {enrollments.length > 0
                          ? enrollments[0].class.name
                          : 'Sem turma'}
                      </p>
                    </div>
                    <Badge variant={student.isActive ? 'success' : 'error'} size="sm">
                      {student.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  {/* Alerts */}
                  {alerts.length > 0 && (
                    <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div className="flex items-start gap-2">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                            {alerts.length === 1
                              ? '1 alerta de desempenho'
                              : `${alerts.length} alertas de desempenho`}
                          </p>
                          <div className="space-y-1">
                            {alerts.slice(0, 2).map((alert: any, index: number) => (
                              <p key={index} className="text-xs text-yellow-700 dark:text-yellow-400">
                                • {alert.type === 'grade' ? 'Nota baixa' : 'Presença baixa'} em{' '}
                                {alert.subjectName}: {alert.value}
                              </p>
                            ))}
                            {alerts.length > 2 && (
                              <p className="text-xs text-yellow-600 dark:text-yellow-500">
                                +{alerts.length - 2} mais...
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Student Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Turmas
                      </div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {enrollments.length}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Matérias
                      </div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {subjectsCount}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Nota
                      </div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                        -
                      </div>
                    </div>
                  </div>

                  {/* Enrollments */}
                  {enrollments.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {enrollments.slice(0, 2).map((enrollment: any) => (
                        <div
                          key={enrollment.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <UserGroupIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300">
                            {enrollment.class.name}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">
                            • {enrollment.class.course?.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push(`/responsaveis/children/${student.id}`)}
                      className="flex-1"
                    >
                      Ver Detalhes
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/responsaveis/children/${student.id}/grades`)}
                    >
                      Notas
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <UsersIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhum filho cadastrado
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Você ainda não tem filhos vinculados à sua conta
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Entre em contato com a secretaria para vincular seus filhos
            </p>
          </div>
        )}
      </div>
    </>
  );
}
