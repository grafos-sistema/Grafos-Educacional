'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  AcademicCapIcon,
  EyeIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { usersService, UsersFilterParams } from '@/services/users.service';
import { classesService } from '@/services/classes.service';
import { enrollmentsService } from '@/services/enrollments.service';
import { User, UserRole } from '@/types/user.types';
import { ClassEnrollment } from '@/types/class.types';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';

export default function CoordinatorStudentsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [filters, setFilters] = useState<UsersFilterParams>({
    page: 1,
    limit: 20,
    search: '',
    role: UserRole.STUDENT,
    isActive: undefined,
  });
  const [managingStudent, setManagingStudent] = useState<User | null>(null);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [isSavingEnrollment, setIsSavingEnrollment] = useState(false);

  const { data: studentsData, isLoading: loadingStudents, refetch: refetchStudents } = useQuery({
    queryKey: ['coordinator-students', filters, user?.institutionId],
    queryFn: () =>
      usersService.findAll({
        ...filters,
        institutionId: user?.institutionId,
      }),
    enabled: Boolean(user?.institutionId),
  });

  const { data: classesData } = useQuery({
    queryKey: ['coordinator-student-classes', user?.institutionId],
    queryFn: () =>
      classesService.findAll({
        institutionId: user?.institutionId,
        isActive: true,
        limit: 200,
      }),
    enabled: Boolean(user?.institutionId),
  });

  const {
    data: enrollmentsData,
    isLoading: loadingEnrollments,
    refetch: refetchEnrollments,
  } = useQuery({
    queryKey: ['coordinator-student-enrollments', user?.institutionId],
    queryFn: () =>
      enrollmentsService.findAll({
        institutionId: user?.institutionId,
        isActive: true,
        limit: 1000,
      }),
    enabled: Boolean(user?.institutionId),
  });

  const enrollmentByStudentId = useMemo(() => {
    const map = new Map<string, ClassEnrollment>();
    (enrollmentsData?.data || []).forEach((enrollment) => {
      const studentId = enrollment.student?.id || enrollment.studentId;
      if (studentId && !map.has(studentId)) {
        map.set(studentId, enrollment);
      }
    });
    return map;
  }, [enrollmentsData]);

  const classesOptions = useMemo(
    () => [
      { value: '', label: 'Selecione uma turma' },
      ...((classesData?.data || []).map((classItem) => ({
        value: classItem.id,
        label: classItem.name,
      })) || []),
    ],
    [classesData]
  );

  const activeStudents = studentsData?.data || [];
  const totalStudents = studentsData?.meta.total || 0;
  const studentsWithClass = activeStudents.filter((student) =>
    student.studentProfile?.id ? enrollmentByStudentId.has(student.studentProfile.id) : false
  ).length;

  const openEnrollmentModal = (student: User) => {
    const currentEnrollment = student.studentProfile?.id
      ? enrollmentByStudentId.get(student.studentProfile.id)
      : undefined;

    setManagingStudent(student);
    setSelectedClassId(currentEnrollment?.classId || '');
  };

  const closeEnrollmentModal = () => {
    setManagingStudent(null);
    setSelectedClassId('');
    setIsSavingEnrollment(false);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFilters((current) => ({ ...current, page: 1 }));
  };

  const handleSaveEnrollment = async () => {
    if (!managingStudent?.studentProfile?.id) {
      toast.error('Este usuário não possui perfil de aluno vinculado.');
      return;
    }

    if (!selectedClassId) {
      toast.error('Selecione uma turma para continuar.');
      return;
    }

    const currentEnrollment = enrollmentByStudentId.get(managingStudent.studentProfile.id);

    if (currentEnrollment?.classId === selectedClassId) {
      toast.success('O aluno já está vinculado a esta turma.');
      closeEnrollmentModal();
      return;
    }

    setIsSavingEnrollment(true);

    try {
      if (currentEnrollment) {
        await enrollmentsService.transfer(currentEnrollment.id, {
          newClassId: selectedClassId,
        });
        toast.success('Turma do aluno atualizada com sucesso.');
      } else {
        await enrollmentsService.create({
          classId: selectedClassId,
          studentId: managingStudent.studentProfile.id,
        });
        toast.success('Aluno vinculado à turma com sucesso.');
      }

      await Promise.all([refetchEnrollments(), refetchStudents()]);
      closeEnrollmentModal();
    } catch (error: any) {
      console.error('Erro ao salvar vínculo do aluno:', error);
      toast.error(error?.message || 'Não foi possível atualizar a turma do aluno.');
      setIsSavingEnrollment(false);
    }
  };

  const handleRemoveEnrollment = async () => {
    if (!managingStudent?.studentProfile?.id) return;

    const currentEnrollment = enrollmentByStudentId.get(managingStudent.studentProfile.id);
    if (!currentEnrollment) {
      toast.error('Este aluno não possui vínculo ativo com turma.');
      return;
    }

    setIsSavingEnrollment(true);

    try {
      await enrollmentsService.remove(currentEnrollment.id);
      toast.success('Vínculo do aluno removido com sucesso.');
      await Promise.all([refetchEnrollments(), refetchStudents()]);
      closeEnrollmentModal();
    } catch (error: any) {
      console.error('Erro ao remover vínculo do aluno:', error);
      toast.error(error?.message || 'Não foi possível remover o vínculo.');
      setIsSavingEnrollment(false);
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      label: 'Aluno',
      render: (student) => (
        <div className="flex items-center gap-3">
          {student.avatar ? (
            <img
              src={student.avatar}
              alt={`${student.firstName} ${student.lastName}`}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
              {student.firstName?.[0]?.toUpperCase() || 'A'}
            </div>
          )}
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {student.firstName} {student.lastName}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{student.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'registrationNumber',
      label: 'Matrícula',
      render: (student) =>
        student.studentProfile?.registrationNumber ||
        student.studentProfile?.enrollmentNumber ||
        '-',
    },
    {
      key: 'class',
      label: 'Turma',
      render: (student) => {
        const currentEnrollment = student.studentProfile?.id
          ? enrollmentByStudentId.get(student.studentProfile.id)
          : undefined;

        return currentEnrollment?.class?.name ? (
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {currentEnrollment.class.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {currentEnrollment.class.academicYear?.year || 'Ano letivo não informado'}
            </div>
          </div>
        ) : (
          <span className="text-sm text-amber-600 dark:text-amber-400">Sem turma</span>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (student) => (
        <Badge variant={student.isActive ? 'success' : 'error'} size="sm">
          {student.isActive ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Ações',
      className: 'w-36',
      render: (student) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/coordinator/alunos/${student.id}`);
            }}
            className="text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400"
            title="Visualizar dados"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openEnrollmentModal(student);
            }}
            className="text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400"
            title="Gerenciar turma"
          >
            <AcademicCapIcon className="h-5 w-5" />
          </button>
        </div>
      ),
    },
  ];

  const currentEnrollment = managingStudent?.studentProfile?.id
    ? enrollmentByStudentId.get(managingStudent.studentProfile.id)
    : undefined;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Alunos</h1>
        <p className="text-gray-600 dark:text-gray-400">
          A coordenação consulta os dados do aluno e gerencia apenas o vínculo com a turma.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 p-5 text-white shadow-sm">
          <div className="text-sm text-green-100">Alunos encontrados</div>
          <div className="mt-1 text-3xl font-bold">{totalStudents}</div>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-400">Com turma na página atual</div>
          <div className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
            {studentsWithClass}
          </div>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-400">Sem editar cadastro</div>
          <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
            Apenas consulta e vínculo
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
        <form onSubmit={handleSearch} className="flex flex-col gap-3 lg:flex-row">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nome, email, CPF ou matrícula..."
              value={filters.search}
              onChange={(e) =>
                setFilters((current) => ({
                  ...current,
                  search: e.target.value,
                }))
              }
              leftIcon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
            />
          </div>
          <div className="w-full lg:w-40">
            <Select
              options={[
                { value: '', label: 'Todos' },
                { value: 'true', label: 'Ativos' },
                { value: 'false', label: 'Inativos' },
              ]}
              value={filters.isActive?.toString() || ''}
              onChange={(e) =>
                setFilters((current) => ({
                  ...current,
                  isActive: e.target.value ? e.target.value === 'true' : undefined,
                  page: 1,
                }))
              }
            />
          </div>
          <Button type="submit" leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}>
            Buscar
          </Button>
        </form>
      </div>

      <div className="rounded-lg bg-white shadow-sm dark:bg-gray-800">
        <Table
          data={activeStudents}
          columns={columns}
          keyExtractor={(student) => student.id}
          isLoading={loadingStudents || loadingEnrollments}
          emptyMessage="Nenhum aluno encontrado"
        />
      </div>

      {studentsData && studentsData.meta.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            meta={studentsData.meta}
            onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
          />
        </div>
      )}

      <Modal
        isOpen={Boolean(managingStudent)}
        onClose={closeEnrollmentModal}
        title="Vínculo do aluno com a turma"
        size="lg"
      >
        {managingStudent ? (
          <div className="space-y-5">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/60">
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {managingStudent.firstName} {managingStudent.lastName}
              </div>
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {currentEnrollment?.class?.name
                  ? `Turma atual: ${currentEnrollment.class.name}`
                  : 'Este aluno ainda não possui turma vinculada.'}
              </div>
            </div>

            <Select
              label="Turma"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              options={classesOptions}
            />

            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="secondary" onClick={closeEnrollmentModal} disabled={isSavingEnrollment}>
                Cancelar
              </Button>
              {currentEnrollment ? (
                <Button
                  variant="outline"
                  onClick={handleRemoveEnrollment}
                  disabled={isSavingEnrollment}
                >
                  Remover vínculo
                </Button>
              ) : null}
              <Button onClick={handleSaveEnrollment} disabled={isSavingEnrollment}>
                {currentEnrollment ? 'Atualizar turma' : 'Vincular turma'}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
