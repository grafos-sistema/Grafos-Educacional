"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  DocumentCheckIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BookOpenIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useAuthStore } from "@/stores/authStore";
import { classesService } from "@/services/classes.service";
import { attendancesService } from "@/services/attendances.service";
import {
  classSchedulesService,
  ClassSchedule,
} from "@/services/class-schedules.service";
import { AttendanceStatus } from "@/types/attendance.types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/hooks/useToast";
import { useTeacherClassSubjects } from "@/hooks/useTeacherClassSubjects";

const formatInputDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function AttendancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const toast = useToast();

  const [selectedClassSubjectId, setSelectedClassSubjectId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedDate, setSelectedDate] = useState(formatInputDate(new Date()));
  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selectedClassScheduleId, setSelectedClassScheduleId] = useState("");
  const [dateWasChosen, setDateWasChosen] = useState(false);
  const [pendingScheduleDate, setPendingScheduleDate] = useState("");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [attendanceData, setAttendanceData] = useState<
    Record<string, { status: AttendanceStatus; notes: string }>
  >({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Helper para formatar data corretamente (evitar problemas de timezone)
  const formatDateLocal = (dateString: string): string => {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("pt-BR");
  };

  // Estados para aba de histórico
  const [activeTab, setActiveTab] = useState<
    "register" | "history" | "schedule"
  >("register");
  const [historyFilters, setHistoryFilters] = useState({
    classId: "",
    subjectId: "",
    classSubjectId: "",
    academicPeriodId: "",
  });

  const { data: teacherSubjects = [] } = useTeacherClassSubjects();

  // Sincronizar filtro do histórico com a seleção da aba de registro
  useEffect(() => {
    if (
      activeTab === "history" &&
      selectedClassSubjectId &&
      !historyFilters.classSubjectId
    ) {
      const selectedAssignment = teacherSubjects.find(
        (subject) => subject.id === selectedClassSubjectId,
      );
      setHistoryFilters((prev) => ({
        ...prev,
        classId: selectedAssignment?.classId || "",
        subjectId:
          selectedAssignment?.subjectId || selectedAssignment?.subject?.id || "",
        classSubjectId: selectedClassSubjectId,
      }));
    }
  }, [
    activeTab,
    selectedClassSubjectId,
    historyFilters.classSubjectId,
    teacherSubjects,
  ]);

  const classSubjectIdFromUrl = searchParams.get("classSubjectId") || "";

  useEffect(() => {
    if (!classSubjectIdFromUrl || teacherSubjects.length === 0) return;
    const hasMatchingSubject = teacherSubjects.some(
      (subject) => subject.id === classSubjectIdFromUrl,
    );
    const matchingSubject = teacherSubjects.find(
      (subject) => subject.id === classSubjectIdFromUrl,
    );
    if (hasMatchingSubject && matchingSubject) {
      setSelectedClassSubjectId(matchingSubject.id);
      setSelectedClassId(matchingSubject.classId);
      setSelectedSubjectId(
        matchingSubject.subjectId || matchingSubject.subject?.id || "",
      );
    }
  }, [classSubjectIdFromUrl, teacherSubjects]);

  const selectedSubject = teacherSubjects?.find(
    (s) => s.id === selectedClassSubjectId,
  );
  const teacherId = user?.teacherId || user?.teacherProfile?.id;

  const classOptions = useMemo(() => {
    const classes = new Map<
      string,
      { id: string; name: string; grade: string }
    >();
    teacherSubjects.forEach((assignment) => {
      if (!assignment.classId || classes.has(assignment.classId)) return;
      classes.set(assignment.classId, {
        id: assignment.classId,
        name: assignment.class?.name || "Turma sem nome",
        grade: assignment.class?.grade || "",
      });
    });
    return Array.from(classes.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR"),
    );
  }, [teacherSubjects]);

  const subjectOptions = useMemo(() => {
    const subjects = new Map<string, { id: string; name: string }>();
    teacherSubjects
      .filter((assignment) => assignment.classId === selectedClassId)
      .forEach((assignment) => {
        const subjectId = assignment.subjectId || assignment.subject?.id;
        if (!subjectId || subjects.has(subjectId)) return;
        subjects.set(subjectId, {
          id: subjectId,
          name: assignment.subject?.name || "Disciplina sem nome",
        });
      });
    return Array.from(subjects.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR"),
    );
  }, [selectedClassId, teacherSubjects]);

  const getDayOfWeek = (dateString: string) => {
    const [year, month, day] = dateString.split("-").map(Number);
    return [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ][new Date(year, month - 1, day).getDay()];
  };

  const isDateInsidePeriod = (
    dateString: string,
    period: { startDate: string; endDate: string },
  ) => {
    const date = dateString.slice(0, 10);
    return (
      date >= period.startDate.slice(0, 10) &&
      date <= period.endDate.slice(0, 10)
    );
  };

  const todayKey = formatInputDate(new Date());

  const getPeriodForDate = (dateString: string) =>
    attendanceAvailability?.academicYear.periods
      .slice()
      .sort((a, b) => a.orderNumber - b.orderNumber)
      .find((period) => isDateInsidePeriod(dateString, period));

  const getSchedulesForDate = (dateString: string) =>
    (attendanceAvailability?.schedules ?? []).filter(
      (schedule) => schedule.dayOfWeek === getDayOfWeek(dateString),
    );

  const calendarDays = useMemo(() => {
    const firstDay = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      1,
    );
    const lastDay = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth() + 1,
      0,
    );
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - firstDay.getDay());
    const gridEnd = new Date(lastDay);
    gridEnd.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

    const days: Date[] = [];
    const cursor = new Date(gridStart);
    while (cursor <= gridEnd) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, [calendarMonth]);

  const { data: attendanceAvailability, isLoading: loadingAvailability } =
    useQuery({
      queryKey: [
        "attendance-availability",
        selectedSubject?.classId,
        selectedClassSubjectId,
        teacherId,
      ],
      queryFn: () =>
        attendancesService.getAvailability(
          selectedSubject!.classId,
          selectedClassSubjectId,
          teacherId,
        ),
      enabled:
        !!selectedSubject?.classId && !!selectedClassSubjectId && !!teacherId,
    });

  const schedulesForSelectedDate = getSchedulesForDate(selectedDate);
  const schedulesForPendingDate = getSchedulesForDate(pendingScheduleDate);
  const selectedPeriod = getPeriodForDate(selectedDate);
  const selectedSchedule = schedulesForSelectedDate.find(
    (schedule) => schedule.id === selectedClassScheduleId,
  );
  const hasValidAttendanceSession =
    dateWasChosen &&
    !!selectedSubject &&
    !!selectedPeriod &&
    schedulesForSelectedDate.length > 0 &&
    (schedulesForSelectedDate.length === 1 || !!selectedSchedule);

  useEffect(() => {
    if (schedulesForSelectedDate.length === 1) {
      setSelectedClassScheduleId(schedulesForSelectedDate[0].id);
      return;
    }

    if (
      !schedulesForSelectedDate.some(
        (schedule) => schedule.id === selectedClassScheduleId,
      )
    ) {
      setSelectedClassScheduleId("");
    }
  }, [selectedDate, attendanceAvailability, selectedClassScheduleId]);

  const handleDateChange = (date: string) => {
    if (!attendanceAvailability) {
      setSelectedDate(date);
      return;
    }

    const schedules = getSchedulesForDate(date);
    if (schedules.length === 0) {
      toast.warning(
        "Não há aula desta disciplina neste dia. Escolha um dia previsto na grade.",
      );
      return;
    }

    if (!getPeriodForDate(date)) {
      toast.warning(
        "A data escolhida não pertence a um bimestre do ano letivo desta turma.",
      );
      return;
    }

    setSelectedDate(date);
    setDateWasChosen(true);
    setPendingScheduleDate(date);
    setSelectedClassScheduleId("");
    setShowScheduleModal(true);
    setCalendarMonth(
      new Date(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, 1),
    );
  };

  const cancelScheduleSelection = () => {
    setShowScheduleModal(false);
    setDateWasChosen(false);
    setPendingScheduleDate("");
    setSelectedClassScheduleId("");
  };

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setSelectedSubjectId("");
    setSelectedClassSubjectId("");
    setSelectedClassScheduleId("");
    setDateWasChosen(false);
    setPendingScheduleDate("");
    setShowScheduleModal(false);
    setAttendanceData({});
  };

  const handleSubjectChange = (subjectId: string) => {
    const assignment = teacherSubjects.find(
      (item) =>
        item.classId === selectedClassId &&
        (item.subjectId === subjectId || item.subject?.id === subjectId),
    );
    setSelectedSubjectId(subjectId);
    setSelectedClassSubjectId(assignment?.id || "");
    setSelectedClassScheduleId("");
    setDateWasChosen(false);
    setPendingScheduleDate("");
    setShowScheduleModal(false);
    setAttendanceData({});
  };

  const { data: enrollments, isLoading: loadingEnrollments } = useQuery({
    queryKey: ["class-enrollments-attendance", selectedSubject?.classId],
    queryFn: async () => {
      if (!selectedSubject?.classId) return [];
      return await classesService.getEnrollmentsFromApi(
        selectedSubject.classId,
      );
    },
    enabled: !!selectedSubject?.classId,
  });

  const { data: existingAttendances } = useQuery({
    queryKey: [
      "existing-attendances",
      selectedSubject?.classId,
      selectedClassSubjectId,
      selectedDate,
      selectedClassScheduleId,
    ],
    queryFn: async () => {
      if (!selectedSubject?.classId || !selectedClassSubjectId || !selectedDate)
        return [];
      const result = await attendancesService.getClassAttendanceByDate(
        selectedSubject.classId,
        selectedClassSubjectId,
        selectedDate,
        selectedClassScheduleId || undefined,
      );
      return result || [];
    },
    enabled:
      !!selectedSubject?.classId &&
      !!selectedClassSubjectId &&
      !!selectedDate &&
      hasValidAttendanceSession,
  });

  const historySubject = teacherSubjects.find(
    (subject) => subject.id === historyFilters.classSubjectId,
  );
  const { data: historyAvailability } = useQuery({
    queryKey: [
      "attendance-history-availability",
      historySubject?.classId,
      historyFilters.classSubjectId,
      teacherId,
    ],
    queryFn: () =>
      attendancesService.getAvailability(
        historySubject!.classId,
        historyFilters.classSubjectId,
        teacherId,
      ),
    enabled:
      activeTab === "history" &&
      !!historySubject?.classId &&
      !!historyFilters.classSubjectId &&
      !!teacherId,
  });

  const historyPeriods = (historyAvailability?.academicYear.periods ?? [])
    .slice()
    .sort((a, b) => a.orderNumber - b.orderNumber);
  const selectedHistoryPeriod = historyPeriods.find(
    (period) => period.id === historyFilters.academicPeriodId,
  );
  const historyStartDate =
    selectedHistoryPeriod?.startDate || historyPeriods[0]?.startDate;
  const historyEndDate =
    selectedHistoryPeriod?.endDate ||
    historyPeriods[historyPeriods.length - 1]?.endDate;

  // Query para histórico de frequências
  const {
    data: historyData,
    isLoading: loadingHistory,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: [
      "attendance-history",
      historyFilters.classSubjectId,
      historyFilters.academicPeriodId,
      historyStartDate,
      historyEndDate,
    ],
    queryFn: async () => {
      if (!historyFilters.classSubjectId) return [];

      // Buscar todas as frequências da disciplina no período
      const startDate = historyStartDate
        ? historyStartDate.slice(0, 10)
        : formatInputDate(new Date());
      const endDate = historyEndDate
        ? historyEndDate.slice(0, 10)
        : formatInputDate(new Date());

      const result = await attendancesService.findAll({
        classSubjectId: historyFilters.classSubjectId,
        academicPeriodId: historyFilters.academicPeriodId || undefined,
        startDate,
        endDate,
        limit: 1000,
      });

      // O interceptor do axios já extrai response.data, então result É o array direto
      return Array.isArray(result) ? result : result.data || [];
    },
    enabled:
      activeTab === "history" &&
      !!historyFilters.classSubjectId &&
      !!historyAvailability,
    refetchOnMount: "always", // Sempre buscar dados atualizados ao montar
  });

  // Query para grade de horários - busca TODOS os horários da turma
  const { data: allClassSchedules = [] } = useQuery({
    queryKey: ["all-class-schedules", selectedSubject?.classId],
    queryFn: async () => {
      if (!selectedSubject?.classId) return [];
      try {
        const schedules = await classSchedulesService.getClassSchedules(
          selectedSubject.classId,
        );
        // Garantir que sempre retorna um array
        return Array.isArray(schedules) ? schedules : [];
      } catch (error) {
        console.error("Erro ao buscar grade de horários:", error);
        return [];
      }
    },
    enabled: !!selectedSubject?.classId,
  });

  // Filtrar apenas os horários da disciplina selecionada para usar no histórico
  const classSchedules = allClassSchedules.filter(
    (s) => s.classSubjectId === selectedClassSubjectId,
  );

  // Preencher dados existentes quando carregados OU pré-marcar todos como PRESENT
  useEffect(() => {
    if (!hasValidAttendanceSession) {
      setAttendanceData({});
      return;
    }

    if (existingAttendances && existingAttendances.length > 0) {
      // Carregar registros existentes
      const data: Record<string, { status: AttendanceStatus; notes: string }> =
        {};
      existingAttendances.forEach((att: any) => {
        data[att.studentId] = {
          status: att.status,
          notes: att.notes || "",
        };
      });
      setAttendanceData(data);
    } else if (enrollments && enrollments.length > 0) {
      // PRÉ-MARCAR TODOS COMO PRESENT (lógica de exceção)
      const data: Record<string, { status: AttendanceStatus; notes: string }> =
        {};
      enrollments.forEach((enrollment) => {
        data[enrollment.studentId] = {
          status: AttendanceStatus.PRESENT,
          notes: "",
        };
      });
      setAttendanceData(data);
    } else {
      // Limpar dados quando não há alunos
      setAttendanceData({});
    }
  }, [existingAttendances, enrollments, hasValidAttendanceSession]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSubject || !user) return;

      if (!teacherId) {
        throw new Error("Perfil de professor não encontrado");
      }
      if (
        !hasValidAttendanceSession ||
        !selectedClassScheduleId ||
        !selectedPeriod
      ) {
        throw new Error(
          "Selecione uma aula prevista na grade e um bimestre válido para esta data",
        );
      }

      const attendances = Object.entries(attendanceData).map(
        ([studentId, data]) => ({
          studentId,
          status: data.status,
          notes: data.notes,
        }),
      );

      if (attendances.length === 0) {
        throw new Error("Nenhuma frequência foi marcada");
      }

      await attendancesService.createBulk({
        date: selectedDate,
        classId: selectedSubject.classId,
        classSubjectId: selectedClassSubjectId,
        teacherId,
        classScheduleId: selectedClassScheduleId,
        attendances,
      });
    },
    onSuccess: () => {
      // Invalidar todas as queries relacionadas a frequências
      queryClient.invalidateQueries({ queryKey: ["existing-attendances"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-history"] });
      queryClient.invalidateQueries({
        queryKey: ["class-enrollments-attendance"],
      });

      const isUpdate = existingAttendances && existingAttendances.length > 0;
      toast.success(
        isUpdate
          ? "Frequências atualizadas com sucesso!"
          : "Frequências salvas com sucesso!",
      );
      setShowConfirmDialog(false);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error.message ||
        "Erro ao salvar frequências";
      toast.error(message);
      setShowConfirmDialog(false);
    },
  });

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: {
        status,
        notes: prev[studentId]?.notes || "",
      },
    }));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status || AttendanceStatus.PRESENT,
        notes,
      },
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const data: Record<string, { status: AttendanceStatus; notes: string }> =
      {};
    enrollments?.forEach((enrollment) => {
      data[enrollment.studentId] = {
        status,
        notes: attendanceData[enrollment.studentId]?.notes || "",
      };
    });
    setAttendanceData(data);
    toast.info(`Todos os alunos marcados como "${getStatusLabel(status)}"`);
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-300";
      case AttendanceStatus.ABSENT:
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-300";
      case AttendanceStatus.LATE:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300";
      case AttendanceStatus.EXCUSED:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400 border-gray-300";
    }
  };

  const getStatusLabel = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return "Presente";
      case AttendanceStatus.ABSENT:
        return "Ausente";
      case AttendanceStatus.LATE:
        return "Atrasado";
      case AttendanceStatus.EXCUSED:
        return "Justificado";
      default:
        return "";
    }
  };

  // Filtrar alunos pela busca
  const filteredEnrollments = enrollments?.filter((enrollment) => {
    if (!searchTerm) return true;
    const fullName =
      `${enrollment.student?.firstName} ${enrollment.student?.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const stats = {
    present: Object.values(attendanceData).filter(
      (d) => d.status === AttendanceStatus.PRESENT,
    ).length,
    absent: Object.values(attendanceData).filter(
      (d) => d.status === AttendanceStatus.ABSENT,
    ).length,
    late: Object.values(attendanceData).filter(
      (d) => d.status === AttendanceStatus.LATE,
    ).length,
    excused: Object.values(attendanceData).filter(
      (d) => d.status === AttendanceStatus.EXCUSED,
    ).length,
  };

  const hasUnsavedChanges =
    hasValidAttendanceSession && Object.keys(attendanceData).length > 0;

  const historySchedules = (historyAvailability?.schedules ??
    classSchedules) as ClassSchedule[];

  // Cada sessão é uma combinação de data + horário da grade. Assim, duas
  // aulas da mesma disciplina no mesmo dia aparecem como duas frequências.
  const historyByDate = historyData?.reduce((acc: any, att: any) => {
    const dateKey = new Date(att.date).toLocaleDateString("pt-BR");
    const dayOfWeek = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ][new Date(att.date).getDay()];

    const scheduleForDay = att.classScheduleId
      ? historySchedules.find((schedule) => schedule.id === att.classScheduleId)
      : historySchedules.find((schedule) => schedule.dayOfWeek === dayOfWeek);
    const sessionKey = `${dateKey}-${att.classScheduleId || "legacy"}`;

    if (!acc[sessionKey]) {
      acc[sessionKey] = {
        key: sessionKey,
        date: att.date,
        dateFormatted: dateKey,
        dayOfWeek,
        schedule: scheduleForDay,
        attendances: [],
        stats: { present: 0, absent: 0, late: 0, excused: 0, total: 0 },
      };
    }
    const session = acc[sessionKey];
    session.attendances.push(att);
    const statusKey = String(att.status || "").toLowerCase();
    if (statusKey in session.stats && statusKey !== "total") {
      session.stats[statusKey]++;
    }
    session.stats.total++;
    return acc;
  }, {});

  const historyDates = historyByDate
    ? Object.values(historyByDate).sort(
        (a: any, b: any) =>
          new Date(b.date).getTime() - new Date(a.date).getTime(),
      )
    : [];

  // Calcular aulas programadas vs realizadas
  const scheduledClassesCount =
    historySchedules.length > 0
      ? classSchedulesService.calculateScheduledClasses(
          historySchedules,
          new Date(historyStartDate || new Date()),
          new Date(historyEndDate || new Date()),
        )
      : 0;

  const givenClassesCount = historyDates.length;

  return (
    <>
      <div className="p-0 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/professor/dashboard")}
            leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
            className="mb-4"
          >
            Voltar
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Lançar Frequência
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Registre a presença dos alunos na aula
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab("register")}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === "register"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Registrar Frequência
            </button>
            <button
              onClick={() => setActiveTab("schedule")}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === "schedule"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Grade de Horários
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === "history"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Histórico
            </button>
          </div>
        </div>

        {/* Aba: Registrar Frequência */}
        {activeTab === "register" && (
          <>
            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Select
                  label="Turma"
                  value={selectedClassId}
                  onChange={(e) => handleClassChange(e.target.value)}
                  required
                  options={[
                    { value: "", label: "Selecione a turma..." },
                    ...classOptions.map((classItem) => ({
                      value: classItem.id,
                      label: classItem.grade
                        ? `${classItem.name} • ${classItem.grade}`
                        : classItem.name,
                    })),
                  ]}
                />
                <Select
                  label="Disciplina"
                  value={selectedSubjectId}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  required
                  disabled={!selectedClassId}
                  options={[
                    {
                      value: "",
                      label: selectedClassId
                        ? "Selecione a disciplina..."
                        : "Selecione uma turma primeiro",
                    },
                    ...subjectOptions.map((subject) => ({
                      value: subject.id,
                      label: subject.name,
                    })),
                  ]}
                />
              </div>

              {selectedClassSubjectId && (
                <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/30">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Escolha a data da aula
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Os dias com uma bolinha têm aula desta disciplina na
                        grade.
                      </p>
                    </div>
                  </div>

                  {loadingAvailability ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner
                        size="md"
                        text="Carregando calendário..."
                      />
                    </div>
                  ) : (
                    <>
                      <div className="mb-3 flex items-center justify-between">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label="Mês anterior"
                          onClick={() =>
                            setCalendarMonth(
                              new Date(
                                calendarMonth.getFullYear(),
                                calendarMonth.getMonth() - 1,
                                1,
                              ),
                            )
                          }
                          leftIcon={<ChevronLeftIcon className="h-4 w-4" />}
                        >
                          <span className="sr-only">Mês anterior</span>
                        </Button>
                        <span className="font-semibold capitalize text-gray-900 dark:text-white">
                          {calendarMonth.toLocaleDateString("pt-BR", {
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label="Próximo mês"
                          onClick={() =>
                            setCalendarMonth(
                              new Date(
                                calendarMonth.getFullYear(),
                                calendarMonth.getMonth() + 1,
                                1,
                              ),
                            )
                          }
                          rightIcon={<ChevronRightIcon className="h-4 w-4" />}
                        >
                          <span className="sr-only">Próximo mês</span>
                        </Button>
                      </div>

                      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(
                          (day) => (
                            <span key={day} className="py-2">
                              {day}
                            </span>
                          ),
                        )}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day) => {
                          const date = formatInputDate(day);
                          const hasSchedule =
                            getSchedulesForDate(date).length > 0;
                          const hasPeriod = Boolean(getPeriodForDate(date));
                          const isCurrentMonth =
                            day.getMonth() === calendarMonth.getMonth();
                          const isFuture = date > todayKey;
                          const isSelected = dateWasChosen && date === selectedDate;
                          const isSelectable =
                            isCurrentMonth && hasSchedule && hasPeriod && !isFuture;

                          return (
                            <button
                              key={date}
                              type="button"
                              disabled={!isSelectable}
                              onClick={() => handleDateChange(date)}
                              aria-label={`${day.toLocaleDateString("pt-BR")}${hasSchedule ? ", há aula na grade" : ", sem aula na grade"}`}
                              className={`relative flex min-h-11 flex-col items-center justify-center rounded-lg text-sm transition-colors ${
                                !isCurrentMonth
                                  ? "text-gray-300 dark:text-gray-600"
                                  : ""
                              } ${
                                isSelectable
                                  ? "cursor-pointer text-gray-700 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-200 dark:hover:bg-blue-900/30"
                                  : "cursor-not-allowed text-gray-300 dark:text-gray-600"
                              } ${isSelected && isSelectable ? "bg-blue-600 font-semibold text-white hover:bg-blue-700 hover:text-white" : ""}`}
                            >
                              <span>{day.getDate()}</span>
                              {isCurrentMonth && hasSchedule && hasPeriod && (
                                <span
                                  className={`mt-0.5 h-1.5 w-1.5 rounded-full ${isSelected && isSelectable ? "bg-white" : "bg-blue-600"}`}
                                  aria-hidden="true"
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />{" "}
                          Dia com aula
                        </span>
                      </div>

                      {dateWasChosen && selectedPeriod && (
                        <div className="mt-3 flex items-end gap-3 border-t border-gray-200 pt-3 dark:border-gray-700">
                          <div className="min-w-0 flex-1">
                            <Select
                              label="Aula da grade"
                              value={selectedClassScheduleId}
                              onChange={(e) =>
                                setSelectedClassScheduleId(e.target.value)
                              }
                              required
                              options={[
                                {
                                  value: "",
                                  label:
                                    schedulesForSelectedDate.length > 0
                                      ? "Selecione o horário..."
                                      : "Nenhuma aula neste dia",
                                },
                                ...schedulesForSelectedDate.map((schedule) => ({
                                  value: schedule.id,
                                  label: `${schedule.startTime} às ${schedule.endTime}${schedule.room ? ` • ${schedule.room}` : ""}`,
                                })),
                              ]}
                            />
                          </div>
                          <span className="pb-1 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                            {selectedPeriod.name}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Resumo da frequência
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Acompanhe os registros da data selecionada.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-center gap-1.5">
                          <CheckIcon className="h-4 w-4 text-green-600" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            Presentes
                          </span>
                        </div>
                        <div className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                          {stats.present}
                        </div>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-center gap-1.5">
                          <XMarkIcon className="h-4 w-4 text-red-600" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            Ausentes
                          </span>
                        </div>
                        <div className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                          {stats.absent}
                        </div>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-center gap-1.5">
                          <ClockIcon className="h-4 w-4 text-yellow-600" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            Atrasados
                          </span>
                        </div>
                        <div className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                          {stats.late}
                        </div>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-center gap-1.5">
                          <DocumentCheckIcon className="h-4 w-4 text-blue-600" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            Justificados
                          </span>
                        </div>
                        <div className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                          {stats.excused}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedSubject && !loadingAvailability && (
                <div className="mt-4 space-y-2">
                  {schedulesForSelectedDate.length === 0 && (
                    <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                      <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 flex-shrink-0" />
                      <span>
                        Não há aula desta disciplina neste dia. O professor só
                        pode registrar frequência nos dias previstos na grade.
                      </span>
                    </div>
                  )}
                  {!selectedPeriod && (
                    <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                      <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 flex-shrink-0" />
                      <span>
                        A data escolhida não pertence a um bimestre ativo do ano
                        letivo desta turma.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Content */}
            {!selectedClassSubjectId ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
                <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Selecione uma turma
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Escolha a turma e disciplina para lançar a frequência
                </p>
              </div>
            ) : loadingEnrollments ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" text="Carregando alunos..." />
              </div>
            ) : loadingAvailability ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner
                  size="lg"
                  text="Verificando a grade e o bimestre..."
                />
              </div>
            ) : !hasValidAttendanceSession ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
                <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Frequência indisponível para esta data
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Escolha um dia com aula na grade e dentro de um bimestre
                  ativo.
                  {schedulesForSelectedDate.length > 1 &&
                    " Selecione também o horário da aula."}
                </p>
              </div>
            ) : enrollments && enrollments.length > 0 ? (
              <>
                {/* Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                    <Input
                      placeholder="Buscar aluno por nome ou matrícula..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
                      className="flex-1"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleMarkAll(AttendanceStatus.PRESENT)}
                        leftIcon={<CheckIcon className="h-4 w-4" />}
                      >
                        Todos Presentes
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAll(AttendanceStatus.ABSENT)}
                        leftIcon={<XMarkIcon className="h-4 w-4" />}
                      >
                        Todos Ausentes
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Student List */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                          <th className="px-3 py-2 text-left text-[11px] font-medium uppercase text-gray-500 dark:text-gray-400">
                            Aluno
                          </th>
                          <th className="px-3 py-2 text-left text-[11px] font-medium uppercase text-gray-500 dark:text-gray-400">
                            Status
                          </th>
                          <th className="px-3 py-2 text-left text-[11px] font-medium uppercase text-gray-500 dark:text-gray-400">
                            Observações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredEnrollments &&
                        filteredEnrollments.length > 0 ? (
                          filteredEnrollments.map((enrollment) => {
                            const status =
                              attendanceData[enrollment.studentId]?.status;
                            return (
                              <tr
                                key={enrollment.id}
                                className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                              >
                                <td className="whitespace-nowrap px-3 py-2">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-xs font-semibold text-white">
                                      {enrollment.student?.avatar ? (
                                        <>
                                          <img
                                            src={enrollment.student.avatar}
                                            alt={`Foto de ${enrollment.student.firstName} ${enrollment.student.lastName}`}
                                            loading="lazy"
                                            className="h-full w-full rounded-full object-cover"
                                            onError={(event) => {
                                              event.currentTarget.style.display =
                                                "none";
                                              event.currentTarget.nextElementSibling?.classList.remove(
                                                "hidden",
                                              );
                                            }}
                                          />
                                          <span className="hidden">
                                            {enrollment.student?.firstName?.[0]}
                                            {enrollment.student?.lastName?.[0]}
                                          </span>
                                        </>
                                      ) : (
                                        <span>
                                          {enrollment.student?.firstName?.[0]}
                                          {enrollment.student?.lastName?.[0]}
                                        </span>
                                      )}
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        {enrollment.student?.firstName}{" "}
                                        {enrollment.student?.lastName}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Matrícula: {enrollment.student?.registrationNumber || "Não informada"}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-2">
                                  <div className="flex flex-wrap gap-1.5">
                                    {Object.values(AttendanceStatus).map(
                                      (s) => (
                                        <button
                                          key={s}
                                          onClick={() =>
                                            handleStatusChange(
                                              enrollment.studentId,
                                              s,
                                            )
                                          }
                                          className={`h-8 rounded-md border px-2 text-[11px] font-medium transition-all ${
                                            status === s
                                              ? getStatusColor(s)
                                              : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border-transparent hover:border-gray-300"
                                          }`}
                                        >
                                          {getStatusLabel(s)}
                                        </button>
                                      ),
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-2">
                                  <Input
                                    placeholder="Adicionar observação..."
                                    value={
                                      attendanceData[enrollment.studentId]
                                        ?.notes || ""
                                    }
                                    onChange={(e) =>
                                      handleNotesChange(
                                        enrollment.studentId,
                                        e.target.value,
                                      )
                                    }
                                    className="h-8 text-xs"
                                  />
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td
                              colSpan={3}
                              className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                            >
                              Nenhum aluno encontrado com "{searchTerm}"
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Save Button */}
                <div className="mt-6 flex justify-end gap-3">
                  {hasUnsavedChanges && !saveMutation.isPending && (
                    <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mr-auto">
                      <ExclamationTriangleIcon className="h-5 w-5" />
                      <span className="text-sm">Alterações não salvas</span>
                    </div>
                  )}
                  {saveMutation.isPending && (
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mr-auto">
                      <LoadingSpinner size="sm" />
                      <span className="text-sm">Salvando frequências...</span>
                    </div>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setAttendanceData({});
                      toast.info("Frequências limpas");
                    }}
                    disabled={!hasUnsavedChanges || saveMutation.isPending}
                  >
                    Limpar
                  </Button>
                  <Button
                    onClick={() => setShowConfirmDialog(true)}
                    disabled={!hasUnsavedChanges || saveMutation.isPending}
                  >
                    {saveMutation.isPending
                      ? "Salvando..."
                      : `Salvar Frequências (${Object.keys(attendanceData).length})`}
                  </Button>
                </div>
              </>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
                <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Nenhum aluno matriculado
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Esta turma não possui alunos matriculados
                </p>
              </div>
            )}
          </>
        )}

        {/* Aba: Grade de Horários */}
        {activeTab === "schedule" && (
          <>
            {/* Seleção de Turma/Disciplina */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
              <Select
                label="Turma e Disciplina"
                value={selectedClassSubjectId}
                onChange={(e) => {
                  setSelectedClassSubjectId(e.target.value);
                }}
                required
                options={[
                  { value: "", label: "Selecione..." },
                  ...(teacherSubjects?.map((subject) => ({
                    value: subject.id,
                    label: `${subject.class?.name} - ${subject.subject?.name}`,
                  })) || []),
                ]}
              />
            </div>

            {/* Grade de Horários */}
            {!selectedClassSubjectId ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
                <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Selecione uma turma
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Escolha a turma e disciplina para visualizar a grade de
                  horários
                </p>
              </div>
            ) : allClassSchedules.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Grade de Horários - {selectedSubject?.class?.name}
                </h3>

                <div className="space-y-3">
                  {Object.entries(
                    classSchedulesService.getFormattedSchedules(
                      allClassSchedules,
                    ),
                  ).map(
                    ([day, schedules]) =>
                      schedules.length > 0 && (
                        <div
                          key={day}
                          className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                          <div className="w-20 flex-shrink-0 pt-1">
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              {classSchedulesService.getDayAbbreviation(day)}
                            </div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {
                                classSchedulesService
                                  .translateDayOfWeek(day)
                                  .split("-")[0]
                              }
                            </div>
                          </div>
                          <div className="flex-1 space-y-2">
                            {schedules.map((schedule) => (
                              <div
                                key={schedule.id}
                                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border-l-4"
                                style={{
                                  borderLeftColor:
                                    schedule.classSubject?.subject?.color ||
                                    "#6B7280",
                                }}
                              >
                                <ClockIcon
                                  className="h-5 w-5"
                                  style={{
                                    color:
                                      schedule.classSubject?.subject?.color ||
                                      "#6B7280",
                                  }}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                      {schedule.startTime} - {schedule.endTime}
                                    </span>
                                    <span
                                      className="px-2 py-0.5 rounded text-xs font-medium"
                                      style={{
                                        backgroundColor: schedule.classSubject
                                          ?.subject?.color
                                          ? `${schedule.classSubject.subject.color}20`
                                          : "#E5E7EB",
                                        color:
                                          schedule.classSubject?.subject
                                            ?.color || "#6B7280",
                                      }}
                                    >
                                      {schedule.classSubject?.subject?.name}
                                    </span>
                                  </div>
                                  {schedule.room && (
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      Sala: {schedule.room}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ),
                  )}
                </div>

                {/* Estatísticas de aulas */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpenIcon className="h-5 w-5 text-blue-600" />
                    <h4 className="font-medium text-blue-900 dark:text-blue-300">
                      Informações das Aulas
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
                    <div>
                      <div className="text-sm text-blue-700 dark:text-blue-400">
                        Aulas por semana
                      </div>
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                        {allClassSchedules.length}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-blue-700 dark:text-blue-400">
                        Disciplinas
                      </div>
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                        {
                          new Set(
                            allClassSchedules.map((s) => s.classSubjectId),
                          ).size
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-blue-700 dark:text-blue-400">
                        Dias letivos
                      </div>
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                        {
                          new Set(allClassSchedules.map((s) => s.dayOfWeek))
                            .size
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-blue-700 dark:text-blue-400">
                        Total horas/semana
                      </div>
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                        {allClassSchedules
                          .reduce((acc, s) => {
                            const start = s.startTime.split(":").map(Number);
                            const end = s.endTime.split(":").map(Number);
                            const hours =
                              end[0] - start[0] + (end[1] - start[1]) / 60;
                            return acc + hours;
                          }, 0)
                          .toFixed(1)}
                        h
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
                <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Nenhuma grade de horários cadastrada
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Esta turma/disciplina ainda não possui horários configurados
                </p>
              </div>
            )}
          </>
        )}

        {/* Aba: Histórico */}
        {activeTab === "history" && (
          <>
            {/* Filtros de histórico */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Select
                  label="Turma"
                  value={historyFilters.classId}
                  onChange={(e) =>
                    setHistoryFilters({
                      ...historyFilters,
                      classId: e.target.value,
                      subjectId: "",
                      classSubjectId: "",
                      academicPeriodId: "",
                    })
                  }
                  required
                  options={[
                    { value: "", label: "Selecione uma turma" },
                    ...classOptions.map((classItem) => ({
                      value: classItem.id,
                      label: classItem.grade
                        ? `${classItem.name} • ${classItem.grade}`
                        : classItem.name,
                    })),
                  ]}
                />
                <Select
                  label="Disciplina"
                  value={historyFilters.subjectId}
                  onChange={(e) => {
                    const assignment = teacherSubjects.find(
                      (subject) =>
                        subject.classId === historyFilters.classId &&
                        (subject.subjectId === e.target.value ||
                          subject.subject?.id === e.target.value),
                    );
                    setHistoryFilters({
                      ...historyFilters,
                      subjectId: e.target.value,
                      classSubjectId: assignment?.id || "",
                      academicPeriodId: "",
                    });
                  }}
                  options={[
                    {
                      value: "",
                      label: historyFilters.classId
                        ? "Selecione a disciplina"
                        : "Selecione uma turma primeiro",
                    },
                    ...Array.from(
                      new Map(
                        teacherSubjects
                          .filter(
                            (subject) =>
                              subject.classId === historyFilters.classId,
                          )
                          .map((subject) => [
                            subject.subjectId || subject.subject?.id || "",
                            subject.subject?.name || "Disciplina sem nome",
                          ]),
                      ).entries(),
                    ).map(([value, label]) => ({ value, label })),
                  ]}
                  disabled={!historyFilters.classId}
                />
                <Select
                  label="Período"
                  value={historyFilters.academicPeriodId}
                  onChange={(e) =>
                    setHistoryFilters({
                      ...historyFilters,
                      academicPeriodId: e.target.value,
                    })
                  }
                  options={[
                    { value: "", label: "Anual" },
                    ...(historyAvailability?.academicYear.periods
                      .slice()
                      .sort((a, b) => a.orderNumber - b.orderNumber)
                      .map((period) => ({
                        value: period.id,
                        label: period.name,
                      })) ?? []),
                  ]}
                  disabled={
                    !historyFilters.classSubjectId || !historyAvailability
                  }
                />
              </div>
              {historyFilters.classSubjectId && (
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => refetchHistory()}
                    disabled={loadingHistory}
                  >
                    {loadingHistory ? "Atualizando..." : "Atualizar Dados"}
                  </Button>
                </div>
              )}
            </div>

            {/* Conteúdo do histórico */}
            {!historyFilters.classSubjectId ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
                <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Selecione uma turma
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Escolha a turma e disciplina para visualizar o histórico
                </p>
              </div>
            ) : loadingHistory ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" text="Carregando histórico..." />
              </div>
            ) : historyDates.length > 0 ? (
              <div className="space-y-4">
                {/* Resumo de aulas dadas vs programadas */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Resumo do Período
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpenIcon className="h-5 w-5 text-blue-600" />
                        <span className="text-sm text-blue-700 dark:text-blue-400">
                          Aulas Programadas
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                        {scheduledClassesCount}
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckIcon className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-green-700 dark:text-green-400">
                          Aulas Realizadas
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-green-900 dark:text-green-300">
                        {givenClassesCount}
                      </div>
                    </div>
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <ClockIcon className="h-5 w-5 text-yellow-600" />
                        <span className="text-sm text-yellow-700 dark:text-yellow-400">
                          Pendentes
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">
                        {Math.max(0, scheduledClassesCount - givenClassesCount)}
                      </div>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <DocumentCheckIcon className="h-5 w-5 text-purple-600" />
                        <span className="text-sm text-purple-700 dark:text-purple-400">
                          Cumprimento
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                        {scheduledClassesCount > 0
                          ? Math.round(
                              (givenClassesCount / scheduledClassesCount) * 100,
                            )
                          : 0}
                        %
                      </div>
                    </div>
                  </div>
                  {scheduledClassesCount > 0 &&
                    givenClassesCount < scheduledClassesCount && (
                      <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <div className="flex items-start gap-2">
                          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-yellow-800 dark:text-yellow-300">
                            <strong>Atenção:</strong> Há{" "}
                            {scheduledClassesCount - givenClassesCount} aula(s)
                            programada(s) sem frequência lançada neste período.
                          </div>
                        </div>
                      </div>
                    )}
                </div>

                {/* Lista de frequências por data */}
                {historyDates.map((dateData: any) => (
                  <div
                    key={dateData.key}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {dateData.dateFormatted}
                        </h3>
                        {dateData.schedule && (
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                            <ClockIcon className="h-4 w-4" />
                            <span>
                              {dateData.schedule.startTime} -{" "}
                              {dateData.schedule.endTime}
                            </span>
                            {dateData.schedule.room && (
                              <span className="ml-2">
                                • Sala: {dateData.schedule.room}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>{dateData.stats.total} alunos registrados</span>
                      </div>
                    </div>

                    {/* Estatísticas */}
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {dateData.stats.present}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Presentes
                        </div>
                      </div>
                      <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {dateData.stats.absent}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Faltas
                        </div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                          {dateData.stats.late}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Atrasos
                        </div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {dateData.stats.excused}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Justificados
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
                <DocumentCheckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Nenhum registro encontrado
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Não há registros de frequência para este período
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={showScheduleModal}
        onClose={cancelScheduleSelection}
        title="Selecione um horário"
        description={
          pendingScheduleDate
            ? `Escolha a aula da grade para ${formatDateLocal(pendingScheduleDate)}.`
            : "Escolha a aula da grade para registrar a frequência."
        }
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={cancelScheduleSelection}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => setShowScheduleModal(false)}
              disabled={!selectedClassScheduleId}
            >
              Continuar
            </Button>
          </div>
        }
      >
        <div className="space-y-2" role="listbox" aria-label="Aulas da grade">
          {schedulesForPendingDate.map((schedule) => {
            const isSelected = schedule.id === selectedClassScheduleId;
            return (
              <button
                key={schedule.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => setSelectedClassScheduleId(schedule.id)}
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left text-sm transition-colors ${
                  isSelected
                    ? "border-primary-600 bg-primary-50 text-primary-800 dark:border-primary-400 dark:bg-primary-900/20 dark:text-primary-200"
                    : "border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                <span className="font-medium">
                  {schedule.startTime} às {schedule.endTime}
                </span>
                {schedule.room && (
                  <span className="ml-3 text-xs text-gray-500 dark:text-gray-400">
                    {schedule.room}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={() => saveMutation.mutate()}
        title="Confirmar salvamento"
        message={`Você está prestes a salvar a frequência de ${Object.keys(attendanceData).length} aluno(s) para o dia ${formatDateLocal(selectedDate)}. Deseja continuar?`}
        confirmText="Sim, salvar"
        cancelText="Cancelar"
      />
    </>
  );
}
