'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { UserRole } from '@/types/user.types';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentCheckIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { classesService } from '@/services/classes.service';
import { attendancesService } from '@/services/attendances.service';
import { AttendanceStatus } from '@/types/attendance.types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';

export default function StudentAttendancePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');

  // Buscar matrículas do aluno
  const { data: enrollments, isLoading: loadingEnrollments } = useQuery({
    queryKey: ['student-enrollments-attendance', user?.id],
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
              .filter((e) => e.studentId === user?.id)
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
    enabled: !!user?.id && user?.role === UserRole.STUDENT,
  });

  // Buscar disciplinas das turmas matriculadas
  const { data: classSubjects } = useQuery({
    queryKey: ['student-class-subjects-attendance', enrollments],
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

  // Buscar frequências do aluno
  const { data: attendances, isLoading: loadingAttendances } = useQuery({
    queryKey: ['student-attendances', user?.studentProfile?.id, selectedSubjectId],
    queryFn: async () => {
      if (!user?.studentProfile?.id) return [];

      const classSubjectId = selectedSubjectId !== 'all' ? selectedSubjectId : undefined;
      return await attendancesService.getStudentAttendances(
        user.studentProfile.id,
        classSubjectId
      );
    },
    enabled: !!user?.studentProfile?.id,
  });

  // Agrupar frequências por disciplina
  const groupedAttendances = attendances?.reduce((acc, attendance) => {
    const subjectId = attendance.classSubjectId;

    if (!acc[subjectId]) {
      acc[subjectId] = {
        subject: attendance.classSubject?.subject,
        attendances: [],
        stats: {
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          total: 0,
          rate: 0,
        },
      };
    }

    acc[subjectId].attendances.push(attendance);
    acc[subjectId].stats.total++;

    switch (attendance.status) {
      case AttendanceStatus.PRESENT:
        acc[subjectId].stats.present++;
        break;
      case AttendanceStatus.ABSENT:
        acc[subjectId].stats.absent++;
        break;
      case AttendanceStatus.LATE:
        acc[subjectId].stats.late++;
        break;
      case AttendanceStatus.EXCUSED:
        acc[subjectId].stats.excused++;
        break;
    }

    return acc;
  }, {} as Record<string, any>);

  // Calcular taxa de presença
  Object.keys(groupedAttendances || {}).forEach((key) => {
    const group = groupedAttendances![key];
    const effectivePresent = group.stats.present + group.stats.late + group.stats.excused;
    group.stats.rate =
      group.stats.total > 0 ? (effectivePresent / group.stats.total) * 100 : 0;
  });

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return (
          <Badge variant="success" size="sm">
            Presente
          </Badge>
        );
      case AttendanceStatus.ABSENT:
        return (
          <Badge variant="error" size="sm">
            Ausente
          </Badge>
        );
      case AttendanceStatus.LATE:
        return (
          <Badge variant="warning" size="sm">
            Atrasado
          </Badge>
        );
      case AttendanceStatus.EXCUSED:
        return (
          <Badge variant="info" size="sm">
            Justificado
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case AttendanceStatus.ABSENT:
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      case AttendanceStatus.LATE:
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
      case AttendanceStatus.EXCUSED:
        return <DocumentCheckIcon className="h-5 w-5 text-blue-600" />;
      default:
        return null;
    }
  };

  const getRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600 dark:text-green-400';
    if (rate >= 75) return 'text-blue-600 dark:text-blue-400';
    if (rate >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const totalStats = {
    present: attendances?.filter((a) => a.status === AttendanceStatus.PRESENT).length || 0,
    absent: attendances?.filter((a) => a.status === AttendanceStatus.ABSENT).length || 0,
    late: attendances?.filter((a) => a.status === AttendanceStatus.LATE).length || 0,
    excused: attendances?.filter((a) => a.status === AttendanceStatus.EXCUSED).length || 0,
    total: attendances?.length || 0,
  };

  const effectivePresent = totalStats.present + totalStats.late + totalStats.excused;
  const totalRate = totalStats.total > 0 ? (effectivePresent / totalStats.total) * 100 : 0;

  return (
    <div className="p-6">
      {/* Header */}
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
          Minha Frequência
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Acompanhe sua presença nas aulas
        </p>
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <Select
          label="Disciplina"
          value={selectedSubjectId}
          onChange={(e) => setSelectedSubjectId(e.target.value)}
          options={[
            { value: 'all', label: 'Todas as Disciplinas' },
            ...(classSubjects?.map((cs) => ({
              value: cs.id,
              label: cs.subject?.name || '',
            })) || []),
          ]}
        />
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Presentes</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalStats.present}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircleIcon className="h-5 w-5 text-red-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Ausentes</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalStats.absent}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <ClockIcon className="h-5 w-5 text-yellow-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Atrasados</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalStats.late}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <DocumentCheckIcon className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Justificados</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalStats.excused}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <CalendarIcon className="h-5 w-5 text-purple-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Taxa</span>
          </div>
          <div className={`text-2xl font-bold ${getRateColor(totalRate)}`}>
            {totalRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Attendance List */}
      {loadingAttendances || loadingEnrollments ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Carregando frequências..." />
        </div>
      ) : groupedAttendances && Object.keys(groupedAttendances).length > 0 ? (
        <div className="space-y-6">
          {Object.values(groupedAttendances).map((group: any) => (
            <div
              key={group.subject.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
            >
              {/* Subject Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{
                        backgroundColor: group.subject?.color
                          ? `${group.subject.color}20`
                          : '#E5E7EB',
                      }}
                    >
                      <CalendarIcon
                        className="h-6 w-6"
                        style={{ color: group.subject?.color || '#6B7280' }}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {group.subject?.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {group.stats.total} aulas registradas
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Taxa de Presença
                    </div>
                    <div className={`text-3xl font-bold ${getRateColor(group.stats.rate)}`}>
                      {group.stats.rate.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Mini Stats */}
                <div className="grid grid-cols-4 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {group.stats.present}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Presente</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {group.stats.absent}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Ausente</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {group.stats.late}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Atrasado</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {group.stats.excused}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Justificado</div>
                  </div>
                </div>
              </div>

              {/* Attendance Records */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Observações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {group.attendances
                      .sort(
                        (a: any, b: any) =>
                          new Date(b.date).getTime() - new Date(a.date).getTime()
                      )
                      .map((attendance: any) => (
                        <tr
                          key={attendance.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-5 w-5 text-gray-400" />
                              <span className="text-gray-900 dark:text-white">
                                {new Date(attendance.date).toLocaleDateString('pt-BR', {
                                  weekday: 'short',
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(attendance.status)}
                              {getStatusBadge(attendance.status)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                            {attendance.notes || '-'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
          <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Nenhuma frequência registrada
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Sua frequência aparecerá aqui quando o professor lançar as presenças
          </p>
        </div>
      )}
    </div>
  );
}
