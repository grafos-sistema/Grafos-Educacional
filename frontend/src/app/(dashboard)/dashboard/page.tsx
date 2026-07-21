'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABELS } from '@/constants/roles';
import {
  AcademicCapIcon,
  UserGroupIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  TrophyIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    {
      name: 'Total de Alunos',
      value: '1,234',
      change: '+12%',
      changeType: 'positive',
      icon: AcademicCapIcon,
      color: 'from-primary-500 to-primary-600',
    },
    {
      name: 'Professores Ativos',
      value: '89',
      change: '+3%',
      changeType: 'positive',
      icon: UserGroupIcon,
      color: 'from-info-500 to-info-600',
    },
    {
      name: 'Turmas Ativas',
      value: '42',
      change: '0%',
      changeType: 'neutral',
      icon: BookOpenIcon,
      color: 'from-success-500 to-success-600',
    },
    {
      name: 'Taxa de Frequência',
      value: '94.2%',
      change: '+2.4%',
      changeType: 'positive',
      icon: ClipboardDocumentCheckIcon,
      color: 'from-warning-500 to-warning-600',
    },
  ];

  const recentActivities = [
    { id: 1, type: 'grade', message: 'Notas do 1º Bimestre publicadas - 9º Ano A', time: '2 horas atrás' },
    { id: 2, type: 'attendance', message: 'Frequência registrada - Matemática - 8º Ano B', time: '3 horas atrás' },
    { id: 3, type: 'announcement', message: 'Novo comunicado: Reunião de Pais - 15/11', time: '5 horas atrás' },
    { id: 4, type: 'assignment', message: 'Nova atividade de História postada - 7º Ano', time: '1 dia atrás' },
  ];

  const upcomingEvents = [
    { id: 1, title: 'Reunião Pedagógica', date: '22/10/2025', time: '14:00', color: 'bg-primary-500' },
    { id: 2, title: 'Entrega de Boletins', date: '25/10/2025', time: 'Todo o dia', color: 'bg-success-500' },
    { id: 3, title: 'Prova de Matemática', date: '28/10/2025', time: '08:00', color: 'bg-warning-500' },
    { id: 4, title: 'Conselho de Classe', date: '30/10/2025', time: '15:00', color: 'bg-info-500' },
  ];

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900">
          Olá, {user?.firstName}! 👋
        </h1>
        <p className="mt-2 text-secondary-600">
          Bem-vindo de volta ao painel de controle.{' '}
          <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700">
            {user?.role && ROLE_LABELS[user.role]}
          </span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="relative overflow-hidden rounded-2xl bg-white px-4 py-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className={`flex-shrink-0 rounded-xl bg-gradient-to-br ${stat.color} p-3 shadow-lg`}>
                <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-secondary-500">{stat.name}</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-secondary-900">{stat.value}</div>
                    <div
                      className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'positive' ? 'text-success-600' : 'text-secondary-500'
                      }`}
                    >
                      {stat.change}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white shadow-sm">
            <div className="border-b border-secondary-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-secondary-900 flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-secondary-400" />
                Atividades Recentes
              </h2>
            </div>
            <div className="p-6">
              <ul className="space-y-4">
                {recentActivities.map((activity) => (
                  <li key={activity.id} className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                        <div className="h-2 w-2 rounded-full bg-primary-500" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-secondary-900">{activity.message}</p>
                      <p className="text-xs text-secondary-500 mt-1">{activity.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl bg-white shadow-sm">
            <div className="border-b border-secondary-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-secondary-900 flex items-center gap-2">
                <CalendarDaysIcon className="h-5 w-5 text-secondary-400" />
                Próximos Eventos
              </h2>
            </div>
            <div className="p-6">
              <ul className="space-y-4">
                {upcomingEvents.map((event) => (
                  <li key={event.id} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className={`h-12 w-1 rounded-full ${event.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-secondary-900">{event.title}</p>
                      <p className="text-xs text-secondary-500 mt-1">{event.date}</p>
                      <p className="text-xs text-secondary-400">{event.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <button className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 p-6 text-left text-white shadow-md hover:shadow-xl transition-all hover:scale-105">
          <AcademicCapIcon className="h-8 w-8 mb-3 opacity-80" />
          <h3 className="text-lg font-semibold">Ver Alunos</h3>
          <p className="text-sm text-primary-100 mt-1">Gerenciar cadastros</p>
        </button>

        <button className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-info-500 to-info-600 p-6 text-left text-white shadow-md hover:shadow-xl transition-all hover:scale-105">
          <BookOpenIcon className="h-8 w-8 mb-3 opacity-80" />
          <h3 className="text-lg font-semibold">Turmas</h3>
          <p className="text-sm text-info-100 mt-1">Visualizar turmas</p>
        </button>

        <button className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-success-500 to-success-600 p-6 text-left text-white shadow-md hover:shadow-xl transition-all hover:scale-105">
          <TrophyIcon className="h-8 w-8 mb-3 opacity-80" />
          <h3 className="text-lg font-semibold">Notas</h3>
          <p className="text-sm text-success-100 mt-1">Lançar avaliações</p>
        </button>

        <button className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-warning-500 to-warning-600 p-6 text-left text-white shadow-md hover:shadow-xl transition-all hover:scale-105">
          <ChartBarIcon className="h-8 w-8 mb-3 opacity-80" />
          <h3 className="text-lg font-semibold">Relatórios</h3>
          <p className="text-sm text-warning-100 mt-1">Gerar relatórios</p>
        </button>
      </div>
    </div>
  );
}
