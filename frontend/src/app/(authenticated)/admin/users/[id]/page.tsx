'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  PencilIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  IdentificationIcon,
  UserGroupIcon,
  PlusIcon,
  TrashIcon,
  BookOpenIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { usersService } from '@/services/users.service';
import { teachersService } from '@/services/teachers.service';
import { UserRole, CreateParentStudentDto } from '@/types/user.types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/useToast';
import { OptimizedImage } from '@/components/performance/OptimizedImage';
import { getUserEditRouteByRole } from '@/lib/user-route-utils';

const roleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  INSTITUTION_ADMIN: 'Admin da Instituição',
  COORDINATOR: 'Coordenador',
  TEACHER: 'Professor',
  STUDENT: 'Aluno',
  PARENT: 'Responsável',
};

const genderLabels = {
  MALE: 'Masculino',
  FEMALE: 'Feminino',
  OTHER: 'Outro',
  NOT_INFORMED: 'Não informado',
};

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;
  const { user: currentUser } = useAuthStore();
  const toast = useToast();
  const [linkModal, setLinkModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [relationship, setRelationship] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: '',
  });

  // Buscar usuário
  const { data: user, isLoading, error: queryError, refetch } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => usersService.findOne(userId),
    enabled: !!userId,
  });

  // Buscar filhos (se for pai)
  const { data: children, refetch: refetchChildren } = useQuery({
    queryKey: ['parent-children', userId],
    queryFn: () => usersService.getParentChildren(userId),
    enabled: !!userId && user?.role === UserRole.PARENT,
  });

  // Buscar pais (se for aluno)
  const { data: parents, refetch: refetchParents } = useQuery({
    queryKey: ['student-parents', userId],
    queryFn: () => usersService.getStudentParents(userId),
    enabled: !!userId && user?.role === UserRole.STUDENT,
  });

  // Buscar turmas do professor (se for professor)
  const { data: teacherClasses } = useQuery({
    queryKey: ['teacher-classes', user?.teacherProfile?.id],
    queryFn: () => teachersService.getTeacherClasses(user!.teacherProfile!.id),
    enabled: !!user?.teacherProfile?.id && user?.role === UserRole.TEACHER,
  });

  // Buscar alunos disponíveis (para vincular a um pai)
  const { data: availableStudents } = useQuery({
    queryKey: ['students-list', currentUser?.institutionId],
    queryFn: () =>
      usersService.findAll({
        institutionId: currentUser?.institutionId,
        role: UserRole.STUDENT,
        isActive: true,
        limit: 1000,
      }),
    enabled: linkModal && user?.role === UserRole.PARENT,
  });

  // Buscar pais disponíveis (para vincular a um aluno)
  const { data: availableParents } = useQuery({
    queryKey: ['parents-list', currentUser?.institutionId],
    queryFn: () =>
      usersService.findAll({
        institutionId: currentUser?.institutionId,
        role: UserRole.PARENT,
        isActive: true,
        limit: 1000,
      }),
    enabled: linkModal && user?.role === UserRole.STUDENT,
  });

  // Mutation para vincular pai-filho
  const linkMutation = useMutation({
    mutationFn: (data: CreateParentStudentDto) => usersService.linkParentStudent(data),
    onSuccess: () => {
      toast.success('Vínculo criado com sucesso!');
      refetchChildren();
      refetchParents();
      refetch();
      setLinkModal(false);
      setSelectedUserId('');
      setRelationship('');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erro ao criar vínculo';
      toast.error(message);
    },
  });

  // Mutation para desvincular pai-filho
  const unlinkMutation = useMutation({
    mutationFn: (id: string) => usersService.unlinkParentStudent(id),
    onSuccess: () => {
      toast.success('Vínculo removido com sucesso!');
      refetchChildren();
      refetchParents();
      refetch();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erro ao remover vínculo';
      toast.error(message);
    },
  });

  const handleLink = () => {
    if (!selectedUserId || !relationship) return;

    const data: CreateParentStudentDto =
      user?.role === UserRole.PARENT
        ? { parentId: userId, studentId: selectedUserId, relationship }
        : { parentId: selectedUserId, studentId: userId, relationship };

    linkMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Carregando usuário..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-600 dark:text-gray-400">
          {queryError instanceof Error ? queryError.message : 'Usuário não encontrado'}
        </div>
      </div>
    );
  }

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/users')}
          leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
          className="mb-4"
        >
          Voltar
        </Button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Detalhes do Usuário
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Informações completas do usuário
            </p>
          </div>
          <Button
            onClick={() => router.push(getUserEditRouteByRole(userId, user.role))}
            leftIcon={<PencilIcon className="h-5 w-5" />}
          >
            Editar
          </Button>
        </div>
      </div>

      {/* Perfil */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start gap-4">
          {user.avatar ? (
            <OptimizedImage
              src={user.avatar}
              alt={`${user.firstName} ${user.lastName}`}
              fill
              sizes="80px"
              style={{ objectFit: 'cover' }}
              className="h-20 w-20 rounded-full"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 text-2xl font-medium">
              {user.firstName?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="info">{roleLabels[user.role]}</Badge>
              <Badge variant={user.isActive ? 'success' : 'error'}>
                {user.isActive ? 'Ativo' : 'Inativo'}
              </Badge>
              {user.emailVerified && (
                <Badge variant="success">Email Verificado</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Informações de Contato */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Informações de Contato
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <EnvelopeIcon className="h-5 w-5 text-gray-400" />
            <span>{user.email}</span>
          </div>
          {user.phone && (
            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
              <PhoneIcon className="h-5 w-5 text-gray-400" />
              <span>{user.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Informações Pessoais */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Informações Pessoais
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              CPF
            </label>
            <div className="flex items-center gap-2">
              <IdentificationIcon className="h-5 w-5 text-gray-400" />
              <span className="text-gray-900 dark:text-gray-100">
                {user.cpf || '-'}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              RG
            </label>
            <div className="flex items-center gap-2">
              <IdentificationIcon className="h-5 w-5 text-gray-400" />
              <span className="text-gray-900 dark:text-gray-100">
                {user.rg || '-'} {user.rgEmissor ? `(${user.rgEmissor})` : ''}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Data de Nascimento
            </label>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <span className="text-gray-900 dark:text-gray-100">
                {formatDate(user.birthDate)}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Gênero
            </label>
            <span className="text-gray-900 dark:text-gray-100">
              {user.gender ? genderLabels[user.gender] : '-'}
            </span>
          </div>
          {user.nacionalidade && (
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Nacionalidade / Naturalidade
              </label>
              <span className="text-gray-900 dark:text-gray-100">
                {user.nacionalidade} {user.naturalidade ? `/ ${user.naturalidade}` : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Endereço */}
      {(user.address || user.city || user.state || user.zipCode) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Endereço
          </h3>
          <div className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
            <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              {user.address && (
                <div>
                  {user.address}{user.numero ? `, ${user.numero}` : ''}
                  {user.complemento ? ` - ${user.complemento}` : ''}
                </div>
              )}
              {user.bairro && <div>Bairro: {user.bairro}</div>}
              {(user.city || user.state) && (
                <div>
                  {user.city}
                  {user.city && user.state && ', '}
                  {user.state}
                </div>
              )}
              {user.zipCode && <div>CEP: {user.zipCode}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Perfis Adicionais */}
      {(user.teacherProfile || user.studentProfile || user.parentProfile) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Perfis Adicionais
          </h3>
          <div className="space-y-3">
            {user.teacherProfile && (
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="font-medium text-gray-900 dark:text-white">
                  Professor
                </div>
                {user.teacherProfile.specialization && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Especialização: {user.teacherProfile.specialization}
                  </div>
                )}
                {user.teacherProfile.registrationNumber && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Matrícula: {user.teacherProfile.registrationNumber}
                  </div>
                )}
              </div>
            )}
            {user.studentProfile && (
              <div className="border-l-4 border-green-500 pl-4 py-2 space-y-2">
                <div className="font-medium text-lg text-gray-900 dark:text-white">
                  Dados de Aluno
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Matrícula:</span>{' '}
                    <span className="text-gray-900 dark:text-gray-100">{user.studentProfile.registrationNumber}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Data de matrícula:</span>{' '}
                    <span className="text-gray-900 dark:text-gray-100">{formatDate(user.studentProfile.enrollmentDate)}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Situação:</span>{' '}
                    <span className="text-gray-900 dark:text-gray-100">{user.studentProfile.situacao || '-'}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Escola:</span>{' '}
                    <span className="text-gray-900 dark:text-gray-100">{user.studentProfile.escola || '-'}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Unidade:</span>{' '}
                    <span className="text-gray-900 dark:text-gray-100">{user.studentProfile.unidade || '-'}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Ano Letivo / Curso:</span>{' '}
                    <span className="text-gray-900 dark:text-gray-100">{user.studentProfile.anoLetivo || '-'} / {user.studentProfile.curso || '-'}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Série / Turma:</span>{' '}
                    <span className="text-gray-900 dark:text-gray-100">{user.studentProfile.serie || '-'} / {user.studentProfile.turma || '-'}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Turno:</span>{' '}
                    <span className="text-gray-900 dark:text-gray-100">{user.studentProfile.turno || '-'}</span>
                  </div>
                </div>

                {user.studentProfile.healthRecord && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="font-medium text-gray-900 dark:text-white mb-2">Saúde</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-500">Alergias:</span> {user.studentProfile.healthRecord.alergias || 'Nenhuma'}</div>
                      <div><span className="text-gray-500">Medicamentos:</span> {user.studentProfile.healthRecord.medicamentos || 'Nenhum'}</div>
                      <div><span className="text-gray-500">Restrições Alimentares:</span> {user.studentProfile.healthRecord.restricoesAlimentares || 'Nenhuma'}</div>
                      <div><span className="text-gray-500">Necessidades Especiais:</span> {user.studentProfile.healthRecord.necessidadesEspeciais || 'Nenhuma'}</div>
                      <div><span className="text-gray-500">Convênio Médico:</span> {user.studentProfile.healthRecord.convenioMedico || '-'}</div>
                      <div><span className="text-gray-500">Contato Emergência:</span> {user.studentProfile.healthRecord.contatoEmergencia || '-'}</div>
                    </div>
                  </div>
                )}

                {user.studentProfile.transportation && user.studentProfile.transportation.usaTransporte && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="font-medium text-gray-900 dark:text-white mb-2">Transporte</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-500">Tipo:</span> {user.studentProfile.transportation.tipoTransporte || '-'}</div>
                      <div><span className="text-gray-500">Empresa:</span> {user.studentProfile.transportation.empresaTransporte || '-'}</div>
                      <div><span className="text-gray-500">Motorista:</span> {user.studentProfile.transportation.motoristaTransporte || '-'}</div>
                      <div><span className="text-gray-500">Rota:</span> {user.studentProfile.transportation.rotaTransporte || '-'}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {user.parentProfile && (
              <div className="border-l-4 border-purple-500 pl-4 py-2">
                <div className="font-medium text-gray-900 dark:text-white">
                  Responsável
                </div>
                {user.parentProfile.occupation && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Ocupação: {user.parentProfile.occupation}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gestão de Perfis */}
      {(currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.INSTITUTION_ADMIN) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Gestão de Perfis
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Perfil de Professor */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BookOpenIcon className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-900 dark:text-white">Professor</span>
                </div>
                {user.teacherProfile ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-gray-400" />
                )}
              </div>
              {user.teacherProfile ? (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    if (confirm('Tem certeza que deseja remover o perfil de professor?')) {
                      usersService.removeTeacherProfile(userId).then(() => {
                        toast.success('Perfil removido com sucesso!');
                        refetch();
                      }).catch((err: any) => {
                        toast.error(err.response?.data?.message || 'Erro ao remover perfil');
                      });
                    }
                  }}
                  className="w-full"
                >
                  Remover Perfil
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    usersService.addTeacherProfile(userId).then(() => {
                      toast.success('Perfil adicionado com sucesso!');
                      refetch();
                    }).catch((err: any) => {
                      toast.error(err.response?.data?.message || 'Erro ao adicionar perfil');
                    });
                  }}
                  className="w-full"
                >
                  Adicionar Perfil
                </Button>
              )}
            </div>

            {/* Perfil de Aluno */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AcademicCapIcon className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-gray-900 dark:text-white">Aluno</span>
                </div>
                {user.studentProfile ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-gray-400" />
                )}
              </div>
              {user.studentProfile ? (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    if (confirm('Tem certeza que deseja remover o perfil de aluno?')) {
                      usersService.removeStudentProfile(userId).then(() => {
                        toast.success('Perfil removido com sucesso!');
                        refetch();
                      }).catch((err: any) => {
                        toast.error(err.response?.data?.message || 'Erro ao remover perfil');
                      });
                    }
                  }}
                  className="w-full"
                >
                  Remover Perfil
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    usersService.addStudentProfile(userId).then(() => {
                      toast.success('Perfil adicionado com sucesso!');
                      refetch();
                    }).catch((err: any) => {
                      toast.error(err.response?.data?.message || 'Erro ao adicionar perfil');
                    });
                  }}
                  className="w-full"
                >
                  Adicionar Perfil
                </Button>
              )}
            </div>

            {/* Perfil de Responsável */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-gray-900 dark:text-white">Responsável</span>
                </div>
                {user.parentProfile ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-gray-400" />
                )}
              </div>
              {user.parentProfile ? (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    if (confirm('Tem certeza que deseja remover o perfil de responsável?')) {
                      usersService.removeParentProfile(userId).then(() => {
                        toast.success('Perfil removido com sucesso!');
                        refetch();
                      }).catch((err: any) => {
                        toast.error(err.response?.data?.message || 'Erro ao remover perfil');
                      });
                    }
                  }}
                  className="w-full"
                >
                  Remover Perfil
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    usersService.addParentProfile(userId).then(() => {
                      toast.success('Perfil adicionado com sucesso!');
                      refetch();
                    }).catch((err: any) => {
                      toast.error(err.response?.data?.message || 'Erro ao adicionar perfil');
                    });
                  }}
                  className="w-full"
                >
                  Adicionar Perfil
                </Button>
              )}
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>Dica:</strong> Um usuário pode ter múltiplos perfis. Por exemplo, um responsável pode também ser professor.
            </p>
          </div>
        </div>
      )}

      {/* Turmas do Professor */}
      {user.role === UserRole.TEACHER && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Turmas e Disciplinas ({teacherClasses?.length || 0})
          </h3>
          {teacherClasses && teacherClasses.length > 0 ? (
            <div className="space-y-3">
              {teacherClasses.map((tc) => (
                <div
                  key={tc.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className="p-3 rounded-lg"
                      style={{
                        backgroundColor: tc.subject?.color
                          ? `${tc.subject.color}20`
                          : '#E5E7EB',
                      }}
                    >
                      <BookOpenIcon
                        className="h-6 w-6"
                        style={{ color: tc.subject?.color || '#6B7280' }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {tc.subject?.name}
                        </div>
                        <Badge variant="info" size="sm">
                          {tc.class?.name}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-400">
                        {tc.class?.course && (
                          <div className="flex items-center gap-1.5">
                            <AcademicCapIcon className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{tc.class.course.name}</span>
                          </div>
                        )}
                        {tc.class?.academicYear && (
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                            <span>{tc.class.academicYear.name}</span>
                          </div>
                        )}
                        {tc.class?._count && (
                          <div className="flex items-center gap-1.5">
                            <UserGroupIcon className="h-4 w-4 flex-shrink-0" />
                            <span>{tc.class._count.enrollments} alunos</span>
                          </div>
                        )}
                      </div>
                      {tc.weeklyHours && (
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Carga horária: {tc.weeklyHours}h/semana
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <BookOpenIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-1">Nenhuma turma atribuída</p>
              <p className="text-sm">
                Este professor ainda não foi atribuído a nenhuma turma
              </p>
            </div>
          )}
        </div>
      )}

      {/* Relacionamentos Pai-Filho */}
      {(user.role === UserRole.PARENT || user.role === UserRole.STUDENT) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {user.role === UserRole.PARENT ? 'Filhos Vinculados' : 'Responsáveis'}
            </h3>
            <Button
              onClick={() => setLinkModal(true)}
              leftIcon={<PlusIcon className="h-5 w-5" />}
              size="sm"
            >
              {user.role === UserRole.PARENT ? 'Vincular Filho' : 'Vincular Responsável'}
            </Button>
          </div>

          {user.role === UserRole.PARENT && children && children.length > 0 ? (
            <div className="space-y-2">
              {children.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <UserGroupIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {link.student?.user?.firstName} {link.student?.user?.lastName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Relação: {link.relationship}
                        {link.isPrimary && ' • Contato Principal'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setConfirmDialog({
                        isOpen: true,
                        id: link.id,
                        name: `${link.student?.user?.firstName} ${link.student?.user?.lastName}`,
                      })
                    }
                    className="text-red-600 hover:text-red-700 dark:text-red-400"
                    title="Remover vínculo"
                    disabled={unlinkMutation.isPending}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          ) : user.role === UserRole.STUDENT && parents && parents.length > 0 ? (
            <div className="space-y-2">
              {parents.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <UserGroupIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {link.parent?.user?.firstName} {link.parent?.user?.lastName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Relação: {link.relationship}
                        {link.isPrimary && ' • Contato Principal'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setConfirmDialog({
                        isOpen: true,
                        id: link.id,
                        name: `${link.parent?.user?.firstName} ${link.parent?.user?.lastName}`,
                      })
                    }
                    className="text-red-600 hover:text-red-700 dark:text-red-400"
                    title="Remover vínculo"
                    disabled={unlinkMutation.isPending}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {user.role === UserRole.PARENT
                ? 'Nenhum filho vinculado'
                : 'Nenhum responsável vinculado'}
            </div>
          )}
        </div>
      )}

      {/* Informações do Sistema */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Informações do Sistema
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block text-gray-500 dark:text-gray-400 mb-1">
              Data de Criação
            </label>
            <span className="text-gray-900 dark:text-gray-100">
              {formatDate(user.createdAt)}
            </span>
          </div>
          <div>
            <label className="block text-gray-500 dark:text-gray-400 mb-1">
              Última Atualização
            </label>
            <span className="text-gray-900 dark:text-gray-100">
              {formatDate(user.updatedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Modal de Vincular */}
      <Modal
        isOpen={linkModal}
        onClose={() => {
          setLinkModal(false);
          setSelectedUserId('');
          setRelationship('');
        }}
        title={
          user.role === UserRole.PARENT
            ? 'Vincular Filho'
            : 'Vincular Responsável'
        }
        size="md"
      >
        <div className="space-y-4">
          <Select
            label={user.role === UserRole.PARENT ? 'Selecione o aluno' : 'Selecione o responsável'}
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            options={[
              {
                value: '',
                label:
                  user.role === UserRole.PARENT
                    ? 'Selecione um aluno'
                    : 'Selecione um responsável',
              },
              ...(user.role === UserRole.PARENT
                ? availableStudents?.data
                    .filter(
                      (student) =>
                        !children?.some((c) => c.studentId === student.id)
                    )
                    .map((student) => ({
                      value: student.id,
                      label: `${student.firstName} ${student.lastName}`,
                    })) || []
                : availableParents?.data
                    .filter(
                      (parent) =>
                        !parents?.some((p) => p.parentId === parent.id)
                    )
                    .map((parent) => ({
                      value: parent.id,
                      label: `${parent.firstName} ${parent.lastName}`,
                    })) || []),
            ]}
          />
          <Select
            label="Tipo de Relação"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            options={[
              { value: '', label: 'Selecione o tipo de relação' },
              { value: 'Pai', label: 'Pai' },
              { value: 'Mãe', label: 'Mãe' },
              { value: 'Tutor', label: 'Tutor' },
              { value: 'Responsável Legal', label: 'Responsável Legal' },
              { value: 'Avô/Avó', label: 'Avô/Avó' },
              { value: 'Outro', label: 'Outro' },
            ]}
          />
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setLinkModal(false);
                setSelectedUserId('');
                setRelationship('');
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleLink}
              disabled={!selectedUserId || !relationship || linkMutation.isPending}
              isLoading={linkMutation.isPending}
            >
              Vincular
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, id: '', name: '' })}
        onConfirm={() => {
          unlinkMutation.mutate(confirmDialog.id);
          setConfirmDialog({ isOpen: false, id: '', name: '' });
        }}
        title="Remover Vínculo"
        message={`Tem certeza que deseja remover o vínculo com ${confirmDialog.name}? Esta ação não pode ser desfeita.`}
        confirmText="Remover"
        cancelText="Cancelar"
      />
    </div>
  );
}
