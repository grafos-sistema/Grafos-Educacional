'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  BookOpenIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { classSchedulesService } from '@/services/class-schedules.service';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';

const DAYS_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export default function StudentSchedulePage() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Buscar a turma do aluno através do perfil
  const classId = user?.studentProfile?.classEnrollments?.[0]?.classId;
  const className = user?.studentProfile?.classEnrollments?.[0]?.class?.name;

  // Buscar grade de horários da turma
  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['student-class-schedules', classId],
    queryFn: async () => {
      if (!classId) return [];
      try {
        return await classSchedulesService.getClassSchedules(classId);
      } catch {
        return [];
      }
    },
    enabled: !!classId,
  });

  // Agrupar e ordenar horários
  const groupedSchedules = classSchedulesService.getFormattedSchedules(schedules);
  const totalWeeklyHours = schedules.reduce((acc, s) => {
    const start = s.startTime.split(':').map(Number);
    const end = s.endTime.split(':').map(Number);
    const hours = end[0] - start[0] + (end[1] - start[1]) / 60;
    return acc + hours;
  }, 0);

  const uniqueSubjects = new Set(schedules.map(s => s.classSubject?.subject?.name)).size;

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/aluno/dashboard')}
          leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
          className="mb-4"
        >
          Voltar
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Minha Grade de Horários
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Confira os horários das suas aulas
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Carregando grade..." />
        </div>
      ) : !classId ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
          <AcademicCapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Sem matrícula ativa
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Você não está matriculado em nenhuma turma no momento
          </p>
        </div>
      ) : schedules.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
          <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Grade ainda não disponível
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            A grade de horários da sua turma ainda não foi cadastrada
          </p>
        </div>
      ) : (
        <>
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-sm p-6 mb-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              <AcademicCapIcon className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">{className || 'Minha Turma'}</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="text-sm text-blue-100">Disciplinas</div>
                <div className="text-2xl font-bold">{uniqueSubjects}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="text-sm text-blue-100">Aulas/Semana</div>
                <div className="text-2xl font-bold">{schedules.length}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="text-sm text-blue-100">Horas/Semana</div>
                <div className="text-2xl font-bold">{totalWeeklyHours.toFixed(1)}h</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {DAYS_ORDER.map((day) => {
              const daySchedules = groupedSchedules[day] || [];
              if (daySchedules.length === 0) return null;

              return (
                <div key={day} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {classSchedulesService.getDayAbbreviation(day)}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {classSchedulesService.translateDayOfWeek(day)}
                      </h3>
                      <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
                        {daySchedules.length} {daySchedules.length === 1 ? 'aula' : 'aulas'}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    {daySchedules.map((schedule) => (
                      <div key={schedule.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 rounded-lg flex flex-col items-center justify-center"
                            style={{
                              backgroundColor: schedule.classSubject?.subject?.color
                                ? `${schedule.classSubject.subject.color}20`
                                : '#E5E7EB',
                            }}
                          >
                            <BookOpenIcon
                              className="h-6 w-6"
                              style={{ color: schedule.classSubject?.subject?.color || '#6B7280' }}
                            />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {schedule.classSubject?.subject?.name || 'Disciplina'}
                          </h4>
                          {schedule.classSubject?.teacher && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              Prof. {schedule.classSubject.teacher.user.firstName}{' '}
                              {schedule.classSubject.teacher.user.lastName}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-gray-900 dark:text-white font-medium">
                            <ClockIcon className="h-5 w-5 text-blue-600" />
                            <span>{schedule.startTime} - {schedule.endTime}</span>
                          </div>
                          {schedule.room && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {schedule.room}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
