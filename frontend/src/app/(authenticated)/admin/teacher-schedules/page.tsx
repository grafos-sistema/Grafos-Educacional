'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { usersService } from '@/services/users.service';
import { teacherAttendancesService } from '@/services/teacher-attendances.service';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const DAYS_OF_WEEK: Record<string, string> = {
  MONDAY: 'Segunda',
  TUESDAY: 'Terça',
  WEDNESDAY: 'Quarta',
  THURSDAY: 'Quinta',
  FRIDAY: 'Sexta',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
};

export default function TeacherSchedulesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Buscar professores
  const { data: teachersData } = useQuery({
    queryKey: ['teachers-list', user?.institutionId],
    queryFn: async () => {
      const response = await usersService.findAll({
        hasTeacherProfile: true,
        isActive: true,
        institutionId: user?.institutionId,
        limit: 200,
      });
      return response;
    },
    enabled: !!user?.institutionId,
  });

  const teachers = teachersData?.data || [];

  // Buscar horários do professor selecionado
  const { data: schedule, isLoading: loadingSchedule } = useQuery({
    queryKey: ['teacher-schedule', selectedTeacherId],
    queryFn: () => teacherAttendancesService.getTeacherSchedule(selectedTeacherId),
    enabled: !!selectedTeacherId,
  });

  // Buscar registros de presença
  const { data: attendances } = useQuery({
    queryKey: ['teacher-attendances', selectedTeacherId, selectedDate],
    queryFn: async () => {
      const [year, month] = selectedDate.split('-');
      return await teacherAttendancesService.getTeacherAttendances(
        selectedTeacherId,
        { month: parseInt(month), year: parseInt(year) }
      );
    },
    enabled: !!selectedTeacherId,
  });

  // Agrupar horários por dia da semana
  const scheduleByDay = schedule?.reduce((acc, item) => {
    if (!acc[item.dayOfWeek]) {
      acc[item.dayOfWeek] = [];
    }
    acc[item.dayOfWeek].push(item);
    return acc;
  }, {} as Record<string, typeof schedule>);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/dashboard')}
          leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
          className="mb-4"
        >
          Voltar
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Gestão de Horários dos Professores
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Visualize a grade horária e registros de presença dos professores
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Professor"
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            required
            options={[
              { value: '', label: 'Selecione um professor...' },
              ...teachers.map((teacher) => ({
                value: teacher.teacherProfile?.id || '',
                label: `${teacher.firstName} ${teacher.lastName}`,
              })),
            ]}
          />
          <Input
            type="month"
            label="Mês/Ano"
            value={selectedDate.substring(0, 7)}
            onChange={(e) => setSelectedDate(e.target.value + '-01')}
            leftIcon={<CalendarIcon className="h-5 w-5" />}
          />
        </div>
      </div>

      {/* Conteúdo */}
      {!selectedTeacherId ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
          <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Selecione um professor
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Escolha um professor para visualizar seus horários e registros
          </p>
        </div>
      ) : loadingSchedule ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Carregando horários..." />
        </div>
      ) : (
        <>
          {/* Grade Horária */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Grade Horária
            </h2>
            {schedule && schedule.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(DAYS_OF_WEEK).map(([key, label]) => {
                  const daySchedule = scheduleByDay?.[key] || [];
                  return (
                    <div
                      key={key}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <h3 className="font-semibold mb-3 text-center text-gray-900 dark:text-white">
                        {label}
                      </h3>
                      {daySchedule.length > 0 ? (
                        <div className="space-y-2">
                          {daySchedule.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <ClockIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {item.startTime} - {item.endTime}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {item.className}
                              </div>
                              <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                {item.subjectName}
                              </div>
                              {item.room && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Sala: {item.room}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
                          Sem aulas
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                Nenhum horário cadastrado para este professor
              </div>
            )}
          </div>

          {/* Registros de Presença */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Registros de Presença -{' '}
              {new Date(selectedDate).toLocaleDateString('pt-BR', {
                month: 'long',
                year: 'numeric',
              })}
            </h2>
            {attendances && attendances.length > 0 ? (
              <div className="space-y-2">
                {attendances.map((att) => {
                  const scheduleItem = schedule?.find(
                    (s) => s.classSubjectId === att.classSubjectId
                  );
                  return (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <CheckCircleIcon className="h-6 w-6 text-green-600" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {new Date(att.date).toLocaleDateString('pt-BR', {
                              weekday: 'long',
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {scheduleItem?.className} - {scheduleItem?.subjectName}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(att.checkInTime).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                Nenhum registro de presença neste período
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
