'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  XMarkIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { usersService } from '@/services/users.service';
import { CreateUserDto, UserRole } from '@/types/user.types';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { removeMask } from '@/components/ui/MaskedInput';
import { StudentFormTabs } from './components/StudentFormTabs';
import { Institution as InstitutionOption } from '@/components/ui/InstitutionSearch';
import { authService } from '@/services/auth.service';
import { institutionsService } from '@/services/institutions.service';
import { RoleBasedUserWizard } from '../components/RoleBasedUserWizard';

const roleOptions = [
  { value: UserRole.INSTITUTION_ADMIN, label: 'Admin da Instituição' },
  { value: UserRole.COORDINATOR, label: 'Coordenador' },
  { value: UserRole.TEACHER, label: 'Professor' },
  { value: UserRole.STUDENT, label: 'Aluno' },
  { value: UserRole.PARENT, label: 'Responsável' },
];

const roleHeader: Partial<Record<UserRole, { title: string; subtitle: string }>> = {
  [UserRole.STUDENT]: {
    title: 'Novo Aluno',
    subtitle: 'Preencha os dados para cadastrar um novo aluno no sistema',
  },
  [UserRole.COORDINATOR]: {
    title: 'Novo Coordenador',
    subtitle: 'Preencha os dados para cadastrar um novo coordenador no sistema',
  },
  [UserRole.TEACHER]: {
    title: 'Novo Professor',
    subtitle: 'Preencha os dados para cadastrar um novo professor no sistema',
  },
  [UserRole.PARENT]: {
    title: 'Novo Responsável',
    subtitle: 'Preencha os dados para cadastrar um novo responsável no sistema',
  },
};

const defaultHeader = {
  title: 'Novo Usuário',
  subtitle: 'Preencha os dados para criar um novo usuário',
};

interface NewUserPageContentProps {
  fixedRole?: UserRole;
  lockRole?: boolean;
  backRoute?: string;
  successRoute?: string;
}

export function NewUserPageContent({
  fixedRole,
  lockRole = false,
  backRoute,
  successRoute = '/admin/users',
}: NewUserPageContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const roleFromQuery = searchParams.get('role') as UserRole | null;
  const resolvedInitialRole = fixedRole ?? roleFromQuery ?? undefined;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingInstitutions, setIsLoadingInstitutions] = useState(false);
  const [availableInstitutions, setAvailableInstitutions] = useState<InstitutionOption[]>([]);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateUserDto & Record<string, any>>({
    defaultValues: {
      role: resolvedInitialRole,
      isActive: true,
      institutionIds: [],
      institutionId: user?.institutionId,
    }
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (resolvedInitialRole) {
      setValue('role', resolvedInitialRole);
    }
  }, [resolvedInitialRole, setValue]);

  useEffect(() => {
    const loadInstitutions = async () => {
      if (!user) return;

      setIsLoadingInstitutions(true);

      try {
        const institutions =
          user.role === UserRole.SUPER_ADMIN
            ? await institutionsService.getPublicInstitutions()
            : await authService.getInstitutions();

        const normalizedInstitutions: InstitutionOption[] = institutions.map((institution) => ({
          id: institution.id,
          name: institution.name,
          slug: institution.slug,
          city: 'city' in institution ? institution.city : undefined,
          state: 'state' in institution ? institution.state : undefined,
        }));

        setAvailableInstitutions(normalizedInstitutions);

        const defaultInstitutionId =
          getValues('institutionId') ||
          user.institutionId ||
          normalizedInstitutions[0]?.id ||
          '';

        if (defaultInstitutionId) {
          setValue('institutionId', defaultInstitutionId, { shouldValidate: true });
          const currentExtraInstitutionIds = (getValues('institutionIds') as string[] | undefined) ?? [];
          setValue(
            'institutionIds',
            currentExtraInstitutionIds.filter((institutionId) => institutionId !== defaultInstitutionId),
            { shouldValidate: true }
          );
        }
      } catch (loadError) {
        console.error('Erro ao carregar instituições disponíveis:', loadError);
        toast.error('Não foi possível carregar as instituições disponíveis.');
      } finally {
        setIsLoadingInstitutions(false);
      }
    };

    loadInstitutions();
  }, [getValues, setValue, user]);

  const currentRole = watch('role');
  const currentEmail = watch('email');
  const selectedPrimaryInstitutionId = watch('institutionId') ?? user?.institutionId ?? '';
  const selectedAdditionalInstitutionIds = (watch('institutionIds') as string[] | undefined) ?? [];
  const header = (currentRole && roleHeader[currentRole as UserRole]) || defaultHeader;
  const generatedInitialPassword = (() => {
    if (!currentEmail) return '';
    const [localPart] = currentEmail.trim().toLowerCase().split('@');
    return localPart ? `${localPart}@Grafos` : '';
  })();
  const getSelectedPhotoFile = (value: unknown): File | null => {
    if (!value) return null;
    if (typeof FileList !== 'undefined' && value instanceof FileList) {
      return value.item(0);
    }
    return Array.isArray(value) ? value[0] ?? null : null;
  };

  const toggleAdditionalInstitution = (institutionId: string) => {
    const nextIds = selectedAdditionalInstitutionIds.includes(institutionId)
      ? selectedAdditionalInstitutionIds.filter((id) => id !== institutionId)
      : [...selectedAdditionalInstitutionIds, institutionId];

    setValue('institutionIds', nextIds, { shouldDirty: true, shouldValidate: true });
  };

  const handlePrimaryInstitutionChange = (institutionId: string) => {
    setValue('institutionId', institutionId, { shouldDirty: true, shouldValidate: true });
    setValue(
      'institutionIds',
      selectedAdditionalInstitutionIds.filter((id) => id !== institutionId),
      { shouldDirty: true, shouldValidate: true }
    );
  };

  const onSubmit = async (data: CreateUserDto) => {
    const primaryInstitutionId =
      typeof data.institutionId === 'string'
        ? data.institutionId.trim()
        : (user?.institutionId ?? '');
    const normalizedInstitutionIds = Array.from(
      new Set([
        ...(primaryInstitutionId ? [primaryInstitutionId] : []),
        ...((data.institutionIds ?? []).filter(Boolean) as string[]),
      ])
    );

    if (!primaryInstitutionId) {
      setError('Instituição não encontrada');
      return;
    }

    if (normalizedInstitutionIds.length === 0) {
      setError('Selecione ao menos uma instituição para o usuário.');
      return;
    }

    // Validação: aluno precisa ter ao menos 1 responsável com nome preenchido
    if (data.role === UserRole.STUDENT) {
      const responsaveis = (data as any).responsaveis ?? [];
      const responsaveisValidos = responsaveis.filter((r: any) => r?.nome?.trim());
      if (responsaveisValidos.length === 0) {
        const msg = 'Todo aluno deve ter ao menos um responsável cadastrado. Preencha a aba "Responsáveis".';
        setError(msg);
        toast.error(msg);
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Combinar firstName e lastName para criar o name
      // Remove máscaras de CPF, telefone e CEP antes de enviar
      let userData: any = {
        ...data,
        name: `${data.firstName} ${data.lastName}`,
        institutionId: primaryInstitutionId,
        institutionIds: normalizedInstitutionIds,
        cpf: data.cpf ? removeMask(data.cpf) : undefined,
        phone: data.phone ? removeMask(data.phone) : undefined,
        zipCode: data.zipCode ? removeMask(data.zipCode) : undefined,
        isActive: true,
      };
      const photoFile =
        currentRole === UserRole.TEACHER ||
        currentRole === UserRole.STUDENT ||
        currentRole === UserRole.COORDINATOR
          ? getSelectedPhotoFile((data as any).photo)
          : null;

      if (Array.isArray((data as any).subjectIds)) {
        userData.subjectIds = (data as any).subjectIds;
      }

      if (Array.isArray((data as any).linkedStudents)) {
        userData.linkedStudents = (data as any).linkedStudents;
      }

      if (data.role === UserRole.STUDENT) {
        userData.telefoneFixo = data.telefoneFixo ? removeMask(data.telefoneFixo) : undefined;
        
        userData.healthInfo = {
           tipoSanguineo: data.tipoSanguineo,
           convenioMedico: data.convenioMedico,
           alergias: data.alergias,
           medicamentos: data.medicamentos,
           necessidadesEspeciais: data.necessidadesEspeciais,
           restricoesAlimentares: data.restricoesAlimentares,
           contatoEmergencia: data.contatoEmergencia
        };
        
        userData.transportInfo = {
           usaTransporte: data.usaTransporte,
           tipoTransporte: data.tipoTransporte,
           empresaTransporte: data.empresaTransporte,
           motoristaTransporte: data.motoristaTransporte,
           rotaTransporte: data.rotaTransporte
        };
        
        if (data.responsaveis) {
          userData.responsaveis = data.responsaveis.map((r: any) => ({
             ...r,
             cpf: r.cpf ? removeMask(r.cpf) : undefined,
             celular: r.celular ? removeMask(r.celular) : undefined,
             whatsapp: r.whatsapp ? removeMask(r.whatsapp) : undefined,
          }));
        }
      }

      delete userData.photo;
      delete userData.avatar;

      const createdUser = await usersService.create(userData);

      if (
        (currentRole === UserRole.TEACHER ||
          currentRole === UserRole.STUDENT ||
          currentRole === UserRole.COORDINATOR) &&
        photoFile
      ) {
        await usersService.uploadAvatar(createdUser.id, photoFile);
      }

      toast.success('Usuário criado com sucesso!');
      router.push(successRoute);
    } catch (err: any) {
      console.error('Erro ao criar usuário:', err);
      // Tratar erro específico de responsável obrigatório vindo da Edge Function
      const rawMsg: string = err?.message ?? '';
      const errorMsg = rawMsg.includes('student_requires_at_least_one_guardian')
        ? 'Todo aluno deve ter ao menos um responsável cadastrado.'
        : rawMsg || 'Erro ao criar usuário. Tente novamente.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitAndContinue = handleSubmit(onSubmit);

  return (
    <div className="p-0 w-full">
      {/* Header */}
      <div className="mb-8 pt-2">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => (backRoute ? router.push(backRoute) : router.back())}
              className="mt-1 p-2 h-9 w-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {header.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {header.subtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => (backRoute ? router.push(backRoute) : router.back())}
              disabled={isSubmitting}
              leftIcon={<XMarkIcon className="h-4 w-4" />}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={submitAndContinue}
              isLoading={isSubmitting}
              disabled={isSubmitting}
              rightIcon={<ArrowRightIcon className="h-4 w-4" />}
            >
              Salvar e continuar
            </Button>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <div className="">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Erro geral */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {currentRole !== UserRole.STUDENT ? (
            <RoleBasedUserWizard
              form={form}
              mode="create"
              availableInstitutions={availableInstitutions}
              isLoadingInstitutions={isLoadingInstitutions}
              roleOptions={roleOptions}
              selectedPrimaryInstitutionId={selectedPrimaryInstitutionId}
              selectedAdditionalInstitutionIds={selectedAdditionalInstitutionIds}
              onPrimaryInstitutionChange={handlePrimaryInstitutionChange}
              onToggleAdditionalInstitution={toggleAdditionalInstitution}
              isRoleLocked={lockRole}
            />
          ) : (
            <>
              <StudentFormTabs
                form={form}
                availableInstitutions={availableInstitutions}
                isLoadingInstitutions={isLoadingInstitutions}
                mode="create"
                generatedInitialPassword={generatedInitialPassword}
              />
            </>
          )}
        </form>
      </div>

      {/* Nota de rodapé */}
      <div className="flex items-center gap-2 justify-center mt-6 text-xs text-gray-500 dark:text-gray-400">
        <InformationCircleIcon className="h-4 w-4" />
        Campos com <span className="text-red-500">*</span> são obrigatórios
      </div>
    </div>
  );
}

export default function NewUserPage() {
  return <NewUserPageContent />;
}
