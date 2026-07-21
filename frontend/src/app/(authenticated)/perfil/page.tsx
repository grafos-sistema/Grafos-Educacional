'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  IdentificationIcon,
  CakeIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { usersService } from '@/services/users.service';
import { UpdateUserData, Gender } from '@/types/user.types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const genderLabels: Record<Gender, string> = {
  MALE: 'Masculino',
  FEMALE: 'Feminino',
  OTHER: 'Outro',
  NOT_INFORMED: 'Não informado',
};

export default function PerfilPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthStore();
  const toast = useToast();

  const [formData, setFormData] = useState<UpdateUserData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    cpf: user?.cpf || '',
    phone: user?.phone || '',
    birthDate: user?.birthDate || '',
    gender: user?.gender || Gender.NOT_INFORMED,
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zipCode: user?.zipCode || '',
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateUserData) => {
      if (!user?.id) throw new Error('Usuário não encontrado');
      return await usersService.update(user.id, data);
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['user', user?.id] });
      toast.success('Perfil atualizado com sucesso!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erro ao atualizar perfil';
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (field: keyof UpdateUserData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Carregando..." />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
          className="mb-4"
        >
          Voltar
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Meu Perfil
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie suas informações pessoais
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Avatar Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Informações Pessoais */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <UserCircleIcon className="h-6 w-6" />
            Informações Pessoais
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              required
            />
            <Input
              label="Sobrenome"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              required
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
              leftIcon={<EnvelopeIcon className="h-5 w-5 text-gray-400" />}
            />
            <Input
              label="Telefone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="(00) 00000-0000"
              leftIcon={<PhoneIcon className="h-5 w-5 text-gray-400" />}
            />
            <Input
              label="CPF"
              value={formData.cpf}
              onChange={(e) => handleChange('cpf', e.target.value)}
              placeholder="000.000.000-00"
              leftIcon={<IdentificationIcon className="h-5 w-5 text-gray-400" />}
            />
            <Input
              label="Data de Nascimento"
              type="date"
              value={formData.birthDate}
              onChange={(e) => handleChange('birthDate', e.target.value)}
              leftIcon={<CakeIcon className="h-5 w-5 text-gray-400" />}
            />
            <Select
              label="Gênero"
              value={formData.gender || ''}
              onChange={(e) => handleChange('gender', e.target.value as Gender)}
              options={Object.entries(genderLabels).map(([value, label]) => ({ value, label }))}
            />
          </div>
        </div>

        {/* Endereço */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MapPinIcon className="h-6 w-6" />
            Endereço
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Endereço"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Rua, número, complemento"
              />
            </div>
            <Input
              label="Cidade"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
            />
            <Input
              label="Estado"
              value={formData.state}
              onChange={(e) => handleChange('state', e.target.value)}
              placeholder="UF"
              maxLength={2}
            />
            <Input
              label="CEP"
              value={formData.zipCode}
              onChange={(e) => handleChange('zipCode', e.target.value)}
              placeholder="00000-000"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            disabled={updateMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            isLoading={updateMutation.isPending}
            disabled={updateMutation.isPending}
          >
            Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  );
}
