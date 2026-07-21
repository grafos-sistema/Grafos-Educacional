'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { institutionsService } from '@/services/institutions.service';
import { PublicRegisterData, RequestedProfileType, Gender } from '@/types/user.types';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { MaskedInput, masks, removeMask, validateCPF } from '@/components/ui/MaskedInput';
import { InstitutionSearch } from '@/components/ui/InstitutionSearch';
import { UserIcon, AcademicCapIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useAccessibleForm } from '@/hooks/useAccessibleForm';

const profileTypeOptions = [
  {
    value: RequestedProfileType.TEACHER,
    label: 'Professor',
    description: 'Quero lecionar e gerenciar turmas',
    icon: AcademicCapIcon,
  },
  {
    value: RequestedProfileType.STUDENT,
    label: 'Aluno',
    description: 'Quero acessar minhas aulas e atividades',
    icon: UserIcon,
  },
  {
    value: RequestedProfileType.PARENT,
    label: 'Responsável',
    description: 'Quero acompanhar o desempenho dos meus filhos',
    icon: UsersIcon,
  },
];

const genderOptions = [
  { value: Gender.MALE, label: 'Masculino' },
  { value: Gender.FEMALE, label: 'Feminino' },
  { value: Gender.OTHER, label: 'Outro' },
  { value: Gender.NOT_INFORMED, label: 'Não informar' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { login: storeLogin } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProfileType, setSelectedProfileType] = useState<RequestedProfileType | null>(null);
  const { formId } = useAccessibleForm('register');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PublicRegisterData>();

  // Buscar instituições ativas
  const { data: institutions, isLoading: isLoadingInstitutions } = useQuery({
    queryKey: ['public-institutions'],
    queryFn: () => institutionsService.getPublicInstitutions(),
  });

  const onSubmit = async (data: PublicRegisterData) => {
    if (!data.requestedProfileType) {
      setError('Por favor, selecione o tipo de perfil desejado');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Remove máscaras antes de enviar
      const registerData = {
        ...data,
        cpf: data.cpf ? removeMask(data.cpf) : undefined,
        phone: data.phone ? removeMask(data.phone) : undefined,
        zipCode: data.zipCode ? removeMask(data.zipCode) : undefined,
      };

      const response = await authService.publicRegister(registerData);

      // Armazena tokens e usuário
      storeLogin(response.user, response.accessToken, response.refreshToken);

      // Redireciona para página de aguardando aprovação
      router.push('/pending-approval');
    } catch (err: any) {
      console.error('Erro ao registrar:', err);
      setError(err?.response?.data?.message || err?.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const institutionId = watch('institutionId');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg mb-4">
              <AcademicCapIcon className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Criar Conta
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Preencha seus dados para começar
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" id={formId} aria-label="Formulário de cadastro">
            {/* Erro geral */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4" role="alert" aria-live="assertive">
                <p className="text-red-800 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Escolher tipo de perfil */}
            <div role="group" aria-labelledby="profile-type-label" aria-required="true">
              <label id="profile-type-label" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Como você quer se registrar? <span className="text-red-600" aria-label="obrigatório">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {profileTypeOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedProfileType === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={`${option.label}: ${option.description}`}
                      onClick={() => {
                        setSelectedProfileType(option.value);
                        setValue('requestedProfileType', option.value);
                      }}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                      }`}
                    >
                      <Icon className={`h-8 w-8 mx-auto mb-2 ${
                        isSelected ? 'text-primary-600' : 'text-gray-400'
                      }`} aria-hidden="true" />
                      <div className="text-center">
                        <p className={`font-medium ${
                          isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'
                        }`}>
                          {option.label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {option.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {errors.requestedProfileType && (
                <p className="mt-1 text-sm text-red-600" role="alert">{errors.requestedProfileType.message}</p>
              )}
            </div>

            {/* Instituição */}
            <div>
              <input type="hidden" {...register('institutionId', { required: 'Instituição é obrigatória' })} />
              <InstitutionSearch
                label="Instituição"
                institutions={institutions || []}
                value={institutionId}
                onChange={(id) => setValue('institutionId', id, { shouldValidate: true })}
                error={errors.institutionId?.message}
                required
                isLoading={isLoadingInstitutions}
                placeholder="Buscar instituição por nome ou cidade..."
              />
            </div>

            {/* Dados pessoais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nome"
                {...register('firstName', { required: 'Nome é obrigatório' })}
                error={errors.firstName?.message}
                required
              />
              <Input
                label="Sobrenome"
                {...register('lastName', { required: 'Sobrenome é obrigatório' })}
                error={errors.lastName?.message}
                required
              />
            </div>

            {/* Email e Senha */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                {...register('email', {
                  required: 'Email é obrigatório',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email inválido',
                  },
                })}
                error={errors.email?.message}
                required
              />
              <Input
                label="Senha"
                type="password"
                {...register('password', {
                  required: 'Senha é obrigatória',
                  minLength: {
                    value: 6,
                    message: 'Senha deve ter no mínimo 6 caracteres',
                  },
                })}
                error={errors.password?.message}
                helpText="Mínimo de 6 caracteres"
                required
              />
            </div>

            {/* Dados adicionais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MaskedInput
                label="CPF (opcional)"
                mask={masks.cpf}
                maskChar={null}
                {...register('cpf', {
                  validate: (value) => {
                    if (!value) return true;
                    if (removeMask(value).length !== 11) {
                      return 'CPF deve conter 11 dígitos';
                    }
                    if (!validateCPF(value)) {
                      return 'CPF inválido';
                    }
                    return true;
                  },
                })}
                error={errors.cpf?.message}
                placeholder="000.000.000-00"
              />
              <MaskedInput
                label="Telefone (opcional)"
                mask={masks.phone}
                maskChar={null}
                {...register('phone')}
                error={errors.phone?.message}
                placeholder="(00) 00000-0000"
              />
              <Input
                label="Data de Nascimento (opcional)"
                type="date"
                {...register('birthDate')}
                error={errors.birthDate?.message}
              />
              <Select
                label="Gênero (opcional)"
                options={genderOptions}
                placeholder="Selecione o gênero"
                {...register('gender')}
                error={errors.gender?.message}
              />
            </div>

            {/* Endereço */}
            <details className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                Endereço (opcional)
              </summary>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Endereço"
                    {...register('address')}
                    error={errors.address?.message}
                  />
                </div>
                <Input
                  label="Cidade"
                  {...register('city')}
                  error={errors.city?.message}
                />
                <Input
                  label="Estado"
                  {...register('state')}
                  error={errors.state?.message}
                  maxLength={2}
                  placeholder="UF"
                />
                <MaskedInput
                  label="CEP"
                  mask={masks.cep}
                  maskChar={null}
                  {...register('zipCode')}
                  error={errors.zipCode?.message}
                  placeholder="00000-000"
                />
              </div>
            </details>

            {/* Botões */}
            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                isLoading={isSubmitting}
                disabled={isSubmitting || !selectedProfileType}
                className="w-full"
              >
                Criar Conta
              </Button>
              <Link href="/login">
                <Button type="button" variant="secondary" className="w-full">
                  Já tenho uma conta
                </Button>
              </Link>
            </div>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Ao criar uma conta, você concorda com nossos{' '}
            <a href="#" className="text-primary-600 hover:text-primary-500">
              Termos de Uso
            </a>{' '}
            e{' '}
            <a href="#" className="text-primary-600 hover:text-primary-500">
              Política de Privacidade
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
