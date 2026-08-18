'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon, EyeIcon, EyeSlashIcon, AcademicCapIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import { usersService } from '@/services/users.service';
import { UpdateUserData, Gender } from '@/types/user.types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { removeMask, formatCPF, formatPhone, formatCEP } from '@/components/ui/MaskedInput';
import { StudentFormTabs } from '@/app/(authenticated)/admin/users/new/components/StudentFormTabs';
import { UserRole } from '@/types/user.types';
import { RoleBasedUserWizard } from '@/app/(authenticated)/admin/users/components/RoleBasedUserWizard';
import { authService } from '@/services/auth.service';
import { institutionsService } from '@/services/institutions.service';
import { supabase } from '@/lib/supabase';
import { teachersService } from '@/services/teachers.service';
import { teacherSubjectsService } from '@/services/teacher-subjects.service';
import { getUserListRouteByRole } from '@/lib/user-route-utils';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAuthStore } from '@/stores/authStore';
import { Modal } from '@/components/ui/Modal';
import { presentFriendlyError } from '@/lib/friendly-error';
import { Dropdown } from '@/components/ui/HeroDropdown';

function buildInitialPassword(email?: string) {
  if (!email) return '';
  const [localPart] = email.trim().toLowerCase().split('@');
  return localPart ? `${localPart}@Grafos` : '';
}

const genderOptions = [
  { value: Gender.MALE, label: 'Masculino' },
  { value: Gender.FEMALE, label: 'Feminino' },
  { value: Gender.OTHER, label: 'Outro' },
  { value: Gender.NOT_INFORMED, label: 'Não informado' },
];

const roleOptions = [
  { value: UserRole.DIRECTOR, label: 'Diretor(a)' },
  { value: UserRole.INSTITUTION_ADMIN, label: 'Secretário(a)' },
  { value: UserRole.COORDINATOR, label: 'Coordenador' },
  { value: UserRole.TEACHER, label: 'Professor' },
  { value: UserRole.STUDENT, label: 'Aluno' },
  { value: UserRole.PARENT, label: 'Responsável' },
];

interface EditUserPageContentProps {
  userId?: string;
  backRoute?: string;
  successRoute?: string;
}

type EditUserFormData = UpdateUserData & {
  confirmPassword?: string;
};

export function EditUserPageContent({
  userId: userIdProp,
  backRoute,
  successRoute,
}: EditUserPageContentProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams();
  const currentUser = useAuthStore((state) => state.user);
  const activeProfile = useAuthStore((state) => state.activeProfile);

  const callerRole = activeProfile ?? currentUser?.role;

  const canManagePassword =
    callerRole === UserRole.SUPER_ADMIN ||
    callerRole === UserRole.SUPER_ADMIN_GLOBAL;
  const userId = userIdProp ?? (params?.id as string);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoadingInstitutions, setIsLoadingInstitutions] = useState(false);
  const [availableInstitutions, setAvailableInstitutions] = useState<any[]>([]);
  const [selectedAdditionalInstitutionIds, setSelectedAdditionalInstitutionIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordTermsAccepted, setPasswordTermsAccepted] = useState(false);
  const [pendingPasswordData, setPendingPasswordData] = useState<EditUserFormData | null>(null);
  const [directorInstitutionName, setDirectorInstitutionName] = useState<string | null>(null);
  const [directorUnitName, setDirectorUnitName] = useState<string | null>(null);
  const [loadedPrimaryUnitId, setLoadedPrimaryUnitId] = useState<string | null>(null);
  const [isResetDefaultPasswordOpen, setIsResetDefaultPasswordOpen] = useState(false);
  const [isResettingDefaultPassword, setIsResettingDefaultPassword] = useState(false);

  // Buscar usuário
  const { data: user, isLoading, error: queryError } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => usersService.findOne(userId),
    enabled: !!userId,
  });
  const teacherProfileId = user?.role === UserRole.TEACHER ? user.teacherProfile?.id : undefined;
  const { data: teacherClasses = [], isLoading: isLoadingTeacherClasses } = useQuery({
    queryKey: ['teacher-classes', teacherProfileId],
    queryFn: () => teachersService.getTeacherClasses(teacherProfileId as string),
    enabled: Boolean(teacherProfileId),
  });

  const form = useForm<EditUserFormData>();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = form;
  const watchedPassword = watch('password');
  const watchedConfirmPassword = watch('confirmPassword');
  const hasPasswordChangePending = useMemo(
    () => Boolean(watchedPassword && String(watchedPassword).trim()),
    [watchedPassword]
  );

  // Preencher formulário quando usuário carregar
  useEffect(() => {
    const loadExtraData = async () => {
      if (!user) return;

      setIsLoadingInstitutions(true);

      try {
        const [institutions, userInstitutionLinks, teacherSubjects, parentChildren] = await Promise.all([
          callerRole === UserRole.SUPER_ADMIN || callerRole === UserRole.SUPER_ADMIN_GLOBAL
            ? institutionsService.getPublicInstitutions()
            : authService.getInstitutions().catch(() => institutionsService.getPublicInstitutions()),
          supabase.from('user_institutions').select('institutionId, isPrimary').eq('userId', user.id),
          user.role === UserRole.TEACHER && user.teacherProfile
            ? teacherSubjectsService.getByTeacher(user.teacherProfile.id)
            : Promise.resolve([]),
          user.role === UserRole.PARENT ? usersService.getParentChildren(user.id).catch(() => []) : Promise.resolve([]),
        ]);

        const normalizedInstitutions = institutions.map((institution: any) => ({
          id: institution.id,
          name: institution.name,
          slug: institution.slug,
          city: institution.city,
          state: institution.state,
        }));

        setAvailableInstitutions(normalizedInstitutions);

        const additionalInstitutionIds = ((userInstitutionLinks.data ?? []) as Array<{ institutionId: string; isPrimary: boolean }>)
          .filter((item) => !item.isPrimary && item.institutionId !== user.institutionId)
          .map((item) => item.institutionId);

        setSelectedAdditionalInstitutionIds(additionalInstitutionIds);

        if (user.role === UserRole.DIRECTOR) {
          const { data: unitRows, error: unitError } = await supabase
            .from('institution_units')
            .select('id, name, institutionId')
            .eq('directorUserId', user.id)
            .eq('isActive', true)
            .limit(1);

          if (unitError) throw unitError;

          const unitRow = (unitRows ?? [])[0] as {
            id?: string;
            name?: string | null;
            institutionId?: string | null;
          } | undefined;

          if (unitRow?.id && unitRow.institutionId) {
            setLoadedPrimaryUnitId(unitRow.id);
            setDirectorUnitName(unitRow.name ?? null);
            const { data: institutionRow, error: institutionError } = await supabase
              .from('institutions')
              .select('name')
              .eq('id', unitRow.institutionId)
              .maybeSingle();

            if (institutionError) throw institutionError;
            setDirectorInstitutionName((institutionRow as any)?.name ?? null);
          } else if (user.institutionId) {
            setLoadedPrimaryUnitId(null);
            const { data: institutionRow, error: institutionError } = await supabase
              .from('institutions')
              .select('name')
              .eq('id', user.institutionId)
              .maybeSingle();

            if (institutionError) throw institutionError;
            setDirectorInstitutionName((institutionRow as any)?.name ?? null);
            setDirectorUnitName(null);
          } else {
            setLoadedPrimaryUnitId(null);
            setDirectorInstitutionName(null);
            setDirectorUnitName(null);
          }
        } else {
          setLoadedPrimaryUnitId(null);
          setDirectorInstitutionName(null);
          setDirectorUnitName(null);
        }

        reset({
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        cpf: user.cpf ? formatCPF(user.cpf) : '',
        phone: user.phone ? formatPhone(user.phone) : '',
        birthDate: user.birthDate
          ? String(user.birthDate).split('T')[0]
          : '',
        gender: user.gender,
        address: user.address || '',
        city: user.city || '',
        state: user.state ? String(user.state).toUpperCase().slice(0, 2) : '',
        zipCode: user.zipCode ? formatCEP(user.zipCode) : '',
        isActive: user.isActive,
        socialName: user.socialName || '',
        telefoneFixo: user.telefoneFixo || '',
        numero: user.numero || '',
        complemento: user.complemento || '',
        bairro: user.bairro || '',
        avatar: user.avatar || '',
          institutionId: user.institutionId,
          institutionIds: additionalInstitutionIds,
          subjectIds: Array.isArray(teacherSubjects) ? teacherSubjects.map((item: any) => item.subjectId) : [],
          linkedStudents: Array.isArray(parentChildren)
            ? parentChildren.map((child: any) => ({
                studentId: child.student?.id,
                studentUserId: child.student?.userId,
                studentName: `${child.student?.user?.firstName || ''} ${child.student?.user?.lastName || ''}`.trim(),
                relationship: child.relationship || 'Responsável Legal',
                isPrimary: child.isPrimary || false,
                notificacoes: true,
                podeRetirar: false,
              }))
            : [],
        
        // Student Data
        ...(user.role === UserRole.STUDENT && user.studentProfile ? {
          situacao: user.studentProfile.situacao || 'ATIVO',
          escola: user.studentProfile.escola || '',
          unidade: user.studentProfile.unidade || '',
          anoLetivo: user.studentProfile.anoLetivo || '',
          curso: user.studentProfile.curso || '',
          serie: user.studentProfile.serie || '',
          turma: user.studentProfile.turma || '',
          modalidade: user.studentProfile.modalidade || '',
          turno: user.studentProfile.turno || '',
          dataMatricula: user.studentProfile.enrollmentDate ? String(user.studentProfile.enrollmentDate).split('T')[0] : '',
          observacoes: user.studentProfile.observacoes || '',
          documents: user.studentProfile.documents || [],
          ...user.studentProfile.healthRecord,
          ...user.studentProfile.transportation,
          responsaveis: (user.studentProfile as any).parents?.length > 0 
            ? (user.studentProfile as any).parents.map((p: any, index: number) => ({
                id: index + 1,
                linkId: p.id,
                nome: p.user?.name || `${p.user?.firstName || ''} ${p.user?.lastName || ''}`.trim() || '',
                parentesco: p.relationship || '',
                cpf: p.user?.cpf ? formatCPF(p.user?.cpf) : '',
                email: p.user?.email || '',
                celular: p.user?.phone ? formatPhone(p.user?.phone) : '',
                financeiro: p.isPrimary || false,
              }))
            : [{ id: 1 }],
        } : {}),
          ...(user.role === UserRole.TEACHER && user.teacherProfile ? {
            specialization: user.teacherProfile.specialization || '',
            degree: user.teacherProfile.degree || '',
            registrationNumber: user.teacherProfile.registrationNumber || '',
            hireDate: user.teacherProfile.hireDate ? String(user.teacherProfile.hireDate).split('T')[0] : '',
          } : {}),

          ...(user.role === UserRole.PARENT && user.parentProfile ? {
            occupation: user.parentProfile.occupation || '',
          } : {}),
        });
      } finally {
        setIsLoadingInstitutions(false);
      }
    };

    loadExtraData();
  }, [currentUser?.role, reset, user]);

  const selectedPrimaryInstitutionId = watch('institutionId') ?? user?.institutionId ?? '';

  const toggleAdditionalInstitution = (institutionId: string) => {
    const nextIds = selectedAdditionalInstitutionIds.includes(institutionId)
      ? selectedAdditionalInstitutionIds.filter((id) => id !== institutionId)
      : [...selectedAdditionalInstitutionIds, institutionId];

    setSelectedAdditionalInstitutionIds(nextIds);
    setValue('institutionIds', nextIds, { shouldDirty: true, shouldValidate: true });
  };

  const handlePrimaryInstitutionChange = (institutionId: string) => {
    setValue('institutionId', institutionId, { shouldDirty: true, shouldValidate: true });
    const filtered = selectedAdditionalInstitutionIds.filter((id) => id !== institutionId);
    setSelectedAdditionalInstitutionIds(filtered);
    setValue('institutionIds', filtered, { shouldDirty: true, shouldValidate: true });
  };

  const getSelectedPhotoFile = (value: unknown): File | null => {
    if (!value) return null;
    if (typeof FileList !== 'undefined' && value instanceof FileList) {
      return value.item(0);
    }
    return Array.isArray(value) ? value[0] ?? null : null;
  };

  const handleToggleUserStatus = async () => {
    if (!user) return;

    setIsTogglingStatus(true);
    setError(null);

    try {
      const nextIsActive = !user.isActive;
      await usersService.update(userId, { isActive: nextIsActive });
      setValue('isActive', nextIsActive, { shouldDirty: true, shouldValidate: true });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['coordinators'] });
      toast.success(nextIsActive ? 'Usuário ativado com sucesso!' : 'Usuário desativado com sucesso!');
    } catch (err: any) {
      const info = presentFriendlyError(
        err,
        'Nao foi possivel alterar o status do usuario agora.'
      );
      setError(info.description);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleResetPasswordToDefault = async () => {
    if (!user?.email) return;

    setIsResettingDefaultPassword(true);
    setError(null);

    try {
      const defaultPassword = buildInitialPassword(user.email);
      if (!defaultPassword) {
        throw new Error('Não foi possível gerar a senha padrão a partir do email.');
      }

      await usersService.adminResetPassword(userId, { newPassword: defaultPassword });
      toast.success(
        `Senha redefinida para o padrão! (${defaultPassword}) — avise o usuário para alterá-la no primeiro acesso.`
      );
      setIsResetDefaultPasswordOpen(false);
    } catch (err: any) {
      console.error('Erro ao resetar senha para padrão:', err);
      const info = presentFriendlyError(
        err,
        'Não foi possível redefinir a senha para o padrão agora.'
      );
      setError(info.description);
      toast.error(info.description);
    } finally {
      setIsResettingDefaultPassword(false);
    }
  };

  const submitUserUpdate = async (data: EditUserFormData, shouldResetPassword: boolean) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const pendingStudentDocuments =
        user?.role === UserRole.STUDENT && Array.isArray((data as any).documents)
          ? (data as any).documents
          : [];
      // Remove máscaras antes de enviar
      const userData = {
        ...data,
        cpf: data.cpf ? removeMask(data.cpf) : undefined,
        phone: data.phone ? removeMask(data.phone) : undefined,
        zipCode: data.zipCode ? removeMask(data.zipCode) : undefined,
        institutionId:
          typeof data.institutionId === 'string'
            ? data.institutionId.trim()
            : (user?.institutionId ?? ''),
        institutionIds: Array.from(new Set([data.institutionId || user?.institutionId, ...((data as any).institutionIds ?? [])].filter(Boolean))),
        subjectIds: (data as any).subjectIds ?? [],
        linkedStudents: (data as any).linkedStudents ?? [],
        
        // Group healthInfo if student
        healthInfo: user?.role === UserRole.STUDENT ? {
          tipoSanguineo: (data as any).tipoSanguineo,
          alergias: data.alergias,
          medicamentos: data.medicamentos,
          restricoesAlimentares: data.restricoesAlimentares,
          necessidadesEspeciais: data.necessidadesEspeciais,
          convenioMedico: data.convenioMedico,
          contatoEmergencia: data.contatoEmergencia,
        } : undefined,

        // Group transportInfo if student
        transportInfo: user?.role === UserRole.STUDENT ? {
          usaTransporte: data.usaTransporte,
          tipoTransporte: data.tipoTransporte,
          empresaTransporte: data.empresaTransporte,
          motoristaTransporte: data.motoristaTransporte,
          rotaTransporte: data.rotaTransporte,
        } : undefined,
      };
      const photoFile =
        user?.role === UserRole.TEACHER ||
        user?.role === UserRole.STUDENT ||
        user?.role === UserRole.COORDINATOR ||
        user?.role === UserRole.DIRECTOR
          ? getSelectedPhotoFile((data as any).photo)
          : null;

      // Clean up top-level flattened fields for health/transport so they don't pollute users table
      if (user?.role === UserRole.STUDENT) {
        delete (userData as any).tipoSanguineo;
        delete userData.alergias;
        delete userData.medicamentos;
        delete userData.restricoesAlimentares;
        delete userData.necessidadesEspeciais;
        delete userData.convenioMedico;
        delete userData.contatoEmergencia;
        delete userData.usaTransporte;
        delete userData.tipoTransporte;
        delete userData.empresaTransporte;
        delete userData.motoristaTransporte;
        delete userData.rotaTransporte;
      }
      
      if (userData.responsaveis && Array.isArray(userData.responsaveis)) {
        userData.responsaveis = userData.responsaveis.map((r: any) => ({
          ...r,
          cpf: r.cpf ? removeMask(r.cpf) : undefined,
          celular: r.celular ? removeMask(r.celular) : undefined,
          whatsapp: r.whatsapp ? removeMask(r.whatsapp) : undefined,
        }));
      }
      
      // Clean up auxiliary fields before passing to service
      delete userData.photo;
      delete userData.password;
      delete (userData as any).confirmPassword;

      await usersService.update(userId, userData as UpdateUserData);

      if (
        user?.role === UserRole.STUDENT &&
        user.studentProfile?.id &&
        pendingStudentDocuments.some((document: any) => document?.file)
      ) {
        await usersService.uploadStudentDocuments(
          user.studentProfile.id,
          pendingStudentDocuments
        );
      }

      if (shouldResetPassword && data.password) {
        await usersService.adminResetPassword(userId, {
          newPassword: data.password,
        });
      }

      if (
        (user?.role === UserRole.TEACHER ||
          user?.role === UserRole.STUDENT ||
          user?.role === UserRole.COORDINATOR ||
          user?.role === UserRole.DIRECTOR ||
          user?.role === UserRole.INSTITUTION_ADMIN) &&
        photoFile
      ) {
        const uploadResult = await usersService.uploadAvatar(userId, photoFile);
        setValue('avatar', uploadResult.avatar, { shouldDirty: true });
      }

      // Link / unlink director unit when unitId is provided in the form
      const roleWithUnit =
        user?.role === UserRole.DIRECTOR || user?.role === UserRole.INSTITUTION_ADMIN
          ? user.role
          : undefined;
      if (roleWithUnit) {
        const submittedUnitId = ((data as any).unitId as string | undefined)?.trim() || undefined;
        const previousUnitId = loadedPrimaryUnitId ?? null;

        try {
          // If unitId changed, update the new unit and clear the old one
          if (submittedUnitId && submittedUnitId !== previousUnitId) {
            const { error: newUnitErr } = await supabase
              .from('institution_units')
              .update({ directorUserId: userId })
              .eq('id', submittedUnitId);

            if (newUnitErr) {
              console.error('Erro ao vincular diretor(a) ao anexo:', newUnitErr);
              toast.error(
                'Não foi possível vincular como diretor(a) ao novo anexo. Verifique a tela do anexo.'
              );
            }

            if (previousUnitId && previousUnitId !== submittedUnitId) {
              // Clear previous unit director only if it's still pointing to the same user
              const { error: oldUnitErr } = await supabase
                .from('institution_units')
                .update({ directorUserId: null })
                .eq('id', previousUnitId)
                .eq('directorUserId', userId);
              if (oldUnitErr) {
                console.warn('Aviso: não foi possível limpar vínculo antigo do diretor(a):', oldUnitErr);
              }
            }
          } else if (!submittedUnitId && previousUnitId && user?.role !== UserRole.DIRECTOR) {
            // If user changed to INSTITUTION_ADMIN and unit was cleared, we leave the existing link
            // unless the institution admin is not supposed to be a director anymore
            // (The user can clear the checkbox to indicate they are no longer director)
          }
        } catch (err) {
          console.error('Erro ao atualizar vínculo diretor/anexo:', err);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['coordinators'] });
      
      toast.success(
        shouldResetPassword
          ? 'Usuário atualizado e senha redefinida com sucesso!'
          : 'Usuário atualizado com sucesso!'
      );
      setValue('password', '', { shouldDirty: false });
      setValue('confirmPassword', '', { shouldDirty: false });
      router.push(successRoute ?? getUserListRouteByRole(user?.role));
    } catch (err: any) {
      console.error('Erro ao atualizar usuário:', err);
      const info = presentFriendlyError(
        err,
        'Nao foi possivel atualizar o usuario agora. Revise os dados e tente novamente.'
      );
      setError(info.description);
      toast.error(info.description);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: EditUserFormData) => {
    const nextPassword = data.password?.trim();
    const confirmPassword = data.confirmPassword?.trim();

    if (nextPassword) {
      if (!canManagePassword) {
        const errorMsg = 'Apenas o Super Admin pode redefinir a senha por este fluxo.';
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      if (nextPassword.length < 6) {
        const errorMsg = 'A nova senha deve ter no mínimo 6 caracteres.';
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      if (!confirmPassword) {
        const errorMsg = 'Confirme a nova senha para continuar.';
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      if (nextPassword !== confirmPassword) {
        const errorMsg = 'A confirmação da senha não confere.';
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      setPendingPasswordData(data);
      setPasswordTermsAccepted(false);
      setIsPasswordModalOpen(true);
      return;
    }

    await submitUserUpdate(data, false);
  };

  const handleConfirmPasswordReset = async () => {
    if (!pendingPasswordData || !passwordTermsAccepted) return;

    setIsPasswordModalOpen(false);
    await submitUserUpdate(pendingPasswordData, true);
    setPendingPasswordData(null);
    setPasswordTermsAccepted(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Carregando usuário..." />
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-600 dark:text-gray-400">
          {queryError instanceof Error ? queryError.message : 'Usuário não encontrado'}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-600 dark:text-gray-400">
          Usuário não encontrado
        </div>
      </div>
    );
  }

  return (
    <div className="p-0 w-full">
      {/* Header */}
      <div className="mb-6 pt-1">
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => (backRoute ? router.push(backRoute) : router.back())}
              className="p-2 h-9 w-9 flex items-center justify-center rounded-full"
              aria-label="Voltar"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Editar Usuário
            </h1>
          </div>
          <Dropdown
            trigger={(
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                aria-label="Ações do usuário"
                disabled={isSubmitting || isTogglingStatus || isResettingDefaultPassword}
              >
                <EllipsisHorizontalIcon className="h-5 w-5" />
              </button>
            )}
            items={[
              ...(canManagePassword ? [{
                key: 'reset-default-password',
                label: 'Resetar senha para padrão',
                onClick: () => setIsResetDefaultPasswordOpen(true),
              }] : []),
              {
                key: user.isActive ? 'deactivate-user' : 'activate-user',
                label: user.isActive ? 'Desativar Usuário' : 'Ativar Usuário',
                onClick: handleToggleUserStatus,
              },
            ]}
          />
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm ml-12">
          Atualize as informações do usuário
        </p>
      </div>

      {/* Formulário */}
      <div className="">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Erro geral */}
          {error && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
              <p className="text-sm text-slate-700 dark:text-slate-200">{error}</p>
            </div>
          )}

          {user.role === UserRole.STUDENT ? (
            <div className="">
              <StudentFormTabs
                form={form as any}
                availableInstitutions={availableInstitutions}
                isLoadingInstitutions={isLoadingInstitutions}
                mode="edit"
                studentProfileId={user.studentProfile?.id}
                passwordField={(
                  canManagePassword ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Nova senha"
                          type={showPassword ? 'text' : 'password'}
                          {...register('password')}
                          helperText="Defina uma nova senha para o aluno. A alteração será confirmada em modal."
                          rightIcon={
                            <button
                              type="button"
                              tabIndex={-1}
                              onClick={() => setShowPassword((value) => !value)}
                              className="pointer-events-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                            >
                              {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            </button>
                          }
                        />
                        <Input
                          label="Confirmar nova senha"
                          type={showConfirmPassword ? 'text' : 'password'}
                          {...register('confirmPassword')}
                          helperText="Repita a senha para liberar a confirmação final."
                          rightIcon={
                            <button
                              type="button"
                              tabIndex={-1}
                              onClick={() => setShowConfirmPassword((value) => !value)}
                              className="pointer-events-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              aria-label={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
                            >
                              {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            </button>
                          }
                        />
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-lg border border-blue-200 bg-blue-50/70 dark:border-blue-900/40 dark:bg-blue-950/30">
                        <AcademicCapIcon className="h-5 w-5 text-blue-700 dark:text-blue-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">Senha padrão automática</p>
                          <p className="text-xs text-blue-800/90 dark:text-blue-300/90 mt-0.5 truncate">
                            {user?.email ? buildInitialPassword(user.email) : 'Preencha o email do usuário para gerar.'}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => setIsResetDefaultPasswordOpen(true)}
                          disabled={!user?.email || isResettingDefaultPassword}
                          isLoading={isResettingDefaultPassword}
                        >
                          Resetar para padrão
                        </Button>
                      </div>
                    </div>
                  ) : null
                )}
              />
            </div>
          ) : (
            <RoleBasedUserWizard
              form={form as any}
              mode="edit"
              availableInstitutions={availableInstitutions}
              isLoadingInstitutions={isLoadingInstitutions}
              roleOptions={roleOptions}
              selectedPrimaryInstitutionId={selectedPrimaryInstitutionId}
              selectedAdditionalInstitutionIds={selectedAdditionalInstitutionIds}
              onPrimaryInstitutionChange={handlePrimaryInstitutionChange}
              onToggleAdditionalInstitution={toggleAdditionalInstitution}
              isRoleLocked
              teacherClasses={teacherClasses}
              isLoadingTeacherClasses={isLoadingTeacherClasses}
              directorInstitutionName={directorInstitutionName}
              directorUnitName={directorUnitName}
              defaultUnitId={loadedPrimaryUnitId ?? undefined}
              passwordField={(
                canManagePassword ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Nova senha"
                        type={showPassword ? 'text' : 'password'}
                        {...register('password')}
                        helperText="Defina uma nova senha para o usuário. A alteração será confirmada em modal."
                        rightIcon={
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowPassword((value) => !value)}
                            className="pointer-events-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                          >
                            {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                          </button>
                        }
                      />
                      <Input
                        label="Confirmar nova senha"
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...register('confirmPassword')}
                        helperText="Repita a senha para liberar a confirmação final."
                        rightIcon={
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowConfirmPassword((value) => !value)}
                            className="pointer-events-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            aria-label={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
                          >
                            {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                          </button>
                        }
                      />
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-lg border border-blue-200 bg-blue-50/70 dark:border-blue-900/40 dark:bg-blue-950/30">
                      <AcademicCapIcon className="h-5 w-5 text-blue-700 dark:text-blue-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">Senha padrão automática</p>
                        <p className="text-xs text-blue-800/90 dark:text-blue-300/90 mt-0.5 truncate">
                          {user?.email ? buildInitialPassword(user.email) : 'Preencha o email do usuário para gerar.'}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => setIsResetDefaultPasswordOpen(true)}
                        disabled={!user?.email || isResettingDefaultPassword}
                        isLoading={isResettingDefaultPassword}
                      >
                        Resetar para padrão
                      </Button>
                    </div>
                  </div>
                ) : null
              )}
            />
          )}

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="secondary"
              onClick={() => (backRoute ? router.push(backRoute) : router.back())}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>

      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          if (isSubmitting) return;
          setIsPasswordModalOpen(false);
          setPendingPasswordData(null);
          setPasswordTermsAccepted(false);
        }}
        title="Confirmar alteração de senha"
        description="Essa ação redefine a senha do usuário sem exigir a senha atual. Confirme que você está autorizado a realizar essa alteração."
        size="md"
      >
        <div className="space-y-5">
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
            <p className="text-sm font-semibold text-amber-900">Confirmação obrigatória</p>
            <p className="mt-2 text-sm text-amber-800">
              Ao confirmar, a senha do usuário será alterada imediatamente e o acesso anterior deixará de funcionar.
            </p>
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-gray-200 px-4 py-3">
            <input
              type="checkbox"
              checked={passwordTermsAccepted}
              onChange={(event) => setPasswordTermsAccepted(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Confirmo que estou autorizado a redefinir a senha deste usuário e assumo a responsabilidade por essa ação.
            </span>
          </label>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsPasswordModalOpen(false);
                setPendingPasswordData(null);
                setPasswordTermsAccepted(false);
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmPasswordReset}
              disabled={!passwordTermsAccepted || isSubmitting}
              isLoading={isSubmitting}
            >
              Confirmar alteração
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reset Senha Padrão Modal */}
      <Modal
        isOpen={isResetDefaultPasswordOpen}
        onClose={() => {
          if (isResettingDefaultPassword) return;
          setIsResetDefaultPasswordOpen(false);
        }}
        title="Resetar senha para padrão"
        size="sm"
      >
        <div className="space-y-5">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-amber-100 dark:bg-amber-900/30">
              <AcademicCapIcon className="h-6 w-6 text-amber-700 dark:text-amber-400" />
            </div>
            <div className="flex-1 space-y-2">
              {user?.email ? (
                <>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Senha padrão gerada automaticamente
                  </p>
                  <div className="p-3 rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/60 font-mono text-sm font-bold text-gray-900 dark:text-gray-100 break-all">
                    {buildInitialPassword(user.email)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    O usuário receberá esta senha e deverá alterá-la no primeiro acesso ao sistema.
                  </p>
                </>
              ) : (
                <p className="text-sm text-red-600 dark:text-red-400">
                  Usuário sem email válido para gerar a senha padrão.
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                if (isResettingDefaultPassword) return;
                setIsResetDefaultPasswordOpen(false);
              }}
              disabled={isResettingDefaultPassword}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleResetPasswordToDefault}
              disabled={!user?.email || isResettingDefaultPassword}
              isLoading={isResettingDefaultPassword}
            >
              Resetar senha
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function EditUserPage() {
  return <EditUserPageContent />;
}
