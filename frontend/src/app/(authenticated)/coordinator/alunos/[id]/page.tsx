'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  CalendarIcon,
  EnvelopeIcon,
  IdentificationIcon,
  MapPinIcon,
  PhoneIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { usersService } from '@/services/users.service';
import { enrollmentsService } from '@/services/enrollments.service';
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

export default function CoordinatorStudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  const { data: user, isLoading } = useQuery({
    queryKey: ['coordinator-student-detail', userId],
    queryFn: () => usersService.findOne(userId),
    enabled: Boolean(userId),
  });

  const { data: parents = [] } = useQuery({
    queryKey: ['coordinator-student-parents', userId],
    queryFn: () => usersService.getStudentParents(userId),
    enabled: Boolean(userId),
  });

  const studentProfileId = user?.studentProfile?.id;

  const { data: currentEnrollment } = useQuery({
    queryKey: ['coordinator-student-current-enrollment', studentProfileId],
    queryFn: async () => {
      if (!studentProfileId) return null;
      const result = await enrollmentsService.findAll({
        studentId: studentProfileId,
        isActive: true,
        limit: 1,
      });
      return result.data[0] ?? null;
    },
    enabled: Boolean(studentProfileId),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" text="Carregando aluno..." />
      </div>
    );
  }

  if (!user || user.role !== UserRole.STUDENT) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-600 dark:text-gray-400">Aluno não encontrado.</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/coordinator/alunos')}
          leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
          className="mb-4"
        >
          Voltar
        </Button>
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          Detalhes do Aluno
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Informações completas do aluno</p>
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
              {user.firstName?.charAt(0).toUpperCase() || 'A'}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="success">Aluno</Badge>
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
              RG
            </label>
            <div className="flex items-center gap-2">
              <IdentificationIcon className="h-5 w-5 text-gray-400" />
              <span className="text-gray-900 dark:text-gray-100">{user.rg || '-'}</span>
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
        </div>
      </div>

      {(user.address || user.city || user.state || user.zipCode) && (
        <div className="mb-6 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Endereço</h3>
          <div className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
            <MapPinIcon className="mt-0.5 h-5 w-5 text-gray-400" />
            <div>
              {user.address ? (
                <div>
                  {user.address}
                  {user.numero ? `, ${user.numero}` : ''}
                  {user.complemento ? ` - ${user.complemento}` : ''}
                </div>
              ) : null}
              {user.bairro ? <div>{user.bairro}</div> : null}
              {(user.city || user.state) && (
                <div>
                  {user.city}
                  {user.city && user.state ? ', ' : ''}
                  {user.state}
                </div>
              )}
              {user.zipCode ? <div>CEP: {user.zipCode}</div> : null}
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Informações Acadêmicas
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">
              Matrícula
            </label>
            <span className="text-gray-900 dark:text-gray-100">
              {user.studentProfile?.registrationNumber || user.studentProfile?.enrollmentNumber || '-'}
            </span>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">
              Data da matrícula
            </label>
            <span className="text-gray-900 dark:text-gray-100">
              {formatDate(user.studentProfile?.enrollmentDate)}
            </span>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">
              Turma atual
            </label>
            <span className="text-gray-900 dark:text-gray-100">
              {currentEnrollment?.class?.name || 'Sem turma vinculada'}
            </span>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">
              Ano letivo
            </label>
            <span className="text-gray-900 dark:text-gray-100">
              {currentEnrollment?.class?.academicYear?.year || user.studentProfile?.anoLetivo || '-'}
            </span>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">
              Curso
            </label>
            <span className="text-gray-900 dark:text-gray-100">
              {currentEnrollment?.class?.course?.name || user.studentProfile?.curso || '-'}
            </span>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">
              Turno
            </label>
            <span className="text-gray-900 dark:text-gray-100">
              {currentEnrollment?.class?.shift || user.studentProfile?.turno || '-'}
            </span>
          </div>
        </div>
      </div>

      {parents.length > 0 && (
        <div className="mb-6 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Responsáveis
          </h3>
          <div className="space-y-3">
            {parents.map((link) => (
              <div
                key={link.id}
                className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/60"
              >
                <UserGroupIcon className="mt-0.5 h-5 w-5 text-purple-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {link.parent?.user.firstName} {link.parent?.user.lastName}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {link.relationship}
                    {link.isPrimary ? ' • Contato principal' : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
