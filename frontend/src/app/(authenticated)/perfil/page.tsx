'use client';

import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import { Menu, Transition } from '@headlessui/react';
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
  CameraIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthStore } from '@/stores/authStore';
import { usersService } from '@/services/users.service';
import { UpdateUserData, Gender, User } from '@/types/user.types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import {
  formatCPF,
  formatPhone,
  removeMask,
} from '@/components/ui/MaskedInput';
import { AvatarCropModal } from '@/components/ui/AvatarCropModal';
import { BRAZILIAN_UF_OPTIONS } from '@/lib/constants/document-options';
import { formatCep } from '@/lib/address-utils';

const genderLabels: Record<Gender, string> = {
  MALE: 'Masculino',
  FEMALE: 'Feminino',
  OTHER: 'Outro',
  NOT_INFORMED: 'Não informado',
};

function dateOnly(value?: string) {
  return value ? String(value).split('T')[0] : '';
}

function buildOwnProfilePatch(
  data: UpdateUserData,
  currentUser: User,
): UpdateUserData {
  const patch: UpdateUserData = {};

  const assignIfChanged = <K extends keyof UpdateUserData>(
    key: K,
    nextValue: UpdateUserData[K],
    currentValue: unknown,
  ) => {
    if (nextValue !== currentValue) {
      patch[key] = nextValue;
    }
  };

  assignIfChanged('firstName', data.firstName?.trim(), currentUser.firstName);
  assignIfChanged('lastName', data.lastName?.trim(), currentUser.lastName);

  const nextEmail = data.email?.trim().toLowerCase();
  const currentEmail = currentUser.email?.trim().toLowerCase();
  assignIfChanged('email', nextEmail, currentEmail);

  const nextCpf = data.cpf ? removeMask(data.cpf) : '';
  const currentCpf = currentUser.cpf ? removeMask(currentUser.cpf) : '';
  if (nextCpf !== currentCpf) {
    assignIfChanged('cpf', nextCpf, currentCpf);
  }

  const nextPhone = data.phone ? removeMask(data.phone) : '';
  const currentPhone = currentUser.phone ? removeMask(currentUser.phone) : '';
  if (nextPhone !== currentPhone) {
    assignIfChanged('phone', nextPhone, currentPhone);
  }

  assignIfChanged(
    'birthDate',
    dateOnly(data.birthDate),
    dateOnly(currentUser.birthDate),
  );
  assignIfChanged('gender', data.gender, currentUser.gender);
  assignIfChanged('address', data.address?.trim(), currentUser.address);
  assignIfChanged('numero', data.numero?.trim(), currentUser.numero);
  assignIfChanged(
    'complemento',
    data.complemento?.trim(),
    currentUser.complemento,
  );
  assignIfChanged('bairro', data.bairro?.trim(), currentUser.bairro);
  assignIfChanged('city', data.city?.trim(), currentUser.city);
  assignIfChanged(
    'state',
    data.state?.trim().toUpperCase(),
    currentUser.state?.trim().toUpperCase(),
  );

  const nextZipCode = data.zipCode ? removeMask(data.zipCode) : '';
  const currentZipCode = currentUser.zipCode
    ? removeMask(currentUser.zipCode)
    : '';
  if (nextZipCode !== currentZipCode) {
    assignIfChanged('zipCode', nextZipCode, currentZipCode);
  }

  return patch;
}

export default function PerfilPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading, refreshProfile } = useAuth();
  const setUser = useAuthStore((state) => state.setUser);
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [formData, setFormData] = useState<UpdateUserData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    cpf: user?.cpf ? formatCPF(user.cpf) : '',
    phone: user?.phone ? formatPhone(user.phone) : '',
    birthDate: user?.birthDate || '',
    gender: user?.gender || Gender.NOT_INFORMED,
    address: user?.address || '',
    numero: user?.numero || '',
    complemento: user?.complemento || '',
    bairro: user?.bairro || '',
    city: user?.city || '',
    state: user?.state || '',
    zipCode: user?.zipCode ? formatCep(user.zipCode) : '',
  });

  useEffect(() => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      cpf: user?.cpf ? formatCPF(user.cpf) : '',
      phone: user?.phone ? formatPhone(user.phone) : '',
      birthDate: user?.birthDate ? String(user.birthDate).split('T')[0] : '',
      gender: user?.gender || Gender.NOT_INFORMED,
      address: user?.address || '',
      numero: user?.numero || '',
      complemento: user?.complemento || '',
      bairro: user?.bairro || '',
      city: user?.city || '',
      state: user?.state || '',
      zipCode: user?.zipCode ? formatCep(user.zipCode) : '',
    });
  }, [user]);

  const avatarPreview = useMemo(() => {
    if (photoFile) {
      return URL.createObjectURL(photoFile);
    }
    return user?.avatar || '';
  }, [photoFile, user?.avatar]);

  useEffect(() => {
    const lookupCep = async () => {
      const normalizedCep = (formData.zipCode ?? '').replace(/\D/g, '');

      if (normalizedCep.length !== 8) {
        return;
      }

      try {
        const response = await fetch(
          `https://viacep.com.br/ws/${normalizedCep}/json/`,
        );
        if (!response.ok) return;

        const result = (await response.json()) as {
          erro?: boolean;
          logradouro?: string;
          bairro?: string;
          localidade?: string;
          uf?: string;
        };

        if (result.erro) return;

        setFormData((prev) => ({
          ...prev,
          zipCode: formatCep(normalizedCep),
          address: prev.address || result.logradouro || '',
          bairro: prev.bairro || result.bairro || '',
          city: prev.city || result.localidade || '',
          state: prev.state || result.uf || '',
        }));
      } catch {
        // Mantém edição livre mesmo se a consulta falhar
      }
    };

    lookupCep();
  }, [formData.zipCode]);

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateUserData) => {
      if (!user?.id) throw new Error('Usuário não encontrado');
      const profilePatch = buildOwnProfilePatch(data, user);
      const updatedUser = Object.keys(profilePatch).length
        ? await usersService.update(user.id, profilePatch)
        : await usersService.findOne(user.id);

      if (photoFile) {
        const uploadResult = await usersService.uploadAvatar(
          user.id,
          photoFile,
        );
        return {
          ...updatedUser,
          avatar: uploadResult.avatar,
        };
      }

      return updatedUser;
    },
    onSuccess: async (updatedUser) => {
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['user', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setPhotoFile(null);
      await refreshProfile();
      toast.success('Perfil atualizado com sucesso!');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Erro ao atualizar perfil';
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleDeleteAvatar = async () => {
    if (!user?.id) return;

    try {
      await usersService.deleteAvatar(user.id);
      setPhotoFile(null);
      setUser({ ...user, avatar: undefined });
      queryClient.invalidateQueries({ queryKey: ['user', user.id] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Foto removida com sucesso.');
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível remover a foto agora.');
    }
  };

  const handleChange = (field: keyof UpdateUserData, value: any) => {
    const normalizedValue =
      field === 'phone'
        ? formatPhone(String(value))
        : field === 'cpf'
          ? formatCPF(String(value))
          : field === 'zipCode'
            ? formatCep(String(value))
            : value;

    setFormData((prev) => ({
      ...prev,
      [field]: normalizedValue,
    }));
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem válido.');
      event.target.value = '';
      return;
    }

    setPendingPhotoFile(file);
    setIsCropModalOpen(true);
    event.target.value = '';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Carregando..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <div className="max-w-md rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-900">
          Não foi possível carregar seus dados agora. Atualize a página ou entre
          novamente no sistema.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-6">
              <Menu as="div" className="relative">
                {({ open }) => (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <Menu.Button className="relative block rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt={`${user.firstName} ${user.lastName}`}
                          className="h-24 w-24 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                          {user.firstName?.[0]}
                          {user.lastName?.[0]}
                        </div>
                      )}
                      {open && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/35">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-md">
                            <CameraIcon className="h-5 w-5" />
                          </div>
                        </div>
                      )}
                    </Menu.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute left-0 z-20 mt-3 w-56 origin-top-left rounded-xl bg-white py-2 shadow-lg ring-1 ring-black/5 focus:outline-none dark:bg-gray-800">
                        {avatarPreview && (
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                type="button"
                                onClick={() => setIsImagePreviewOpen(true)}
                                className={`flex w-full items-center gap-3 px-4 py-2 text-sm ${
                                  active
                                    ? 'bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-white'
                                    : 'text-gray-700 dark:text-gray-200'
                                }`}
                              >
                                <UserCircleIcon className="h-5 w-5" />
                                Visualizar imagem
                              </button>
                            )}
                          </Menu.Item>
                        )}
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className={`flex w-full items-center gap-3 px-4 py-2 text-sm ${
                                active
                                  ? 'bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-white'
                                  : 'text-gray-700 dark:text-gray-200'
                              }`}
                            >
                              <CameraIcon className="h-5 w-5" />
                              {avatarPreview
                                ? 'Trocar imagem'
                                : 'Adicionar imagem'}
                            </button>
                          )}
                        </Menu.Item>
                        {avatarPreview && (
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                type="button"
                                onClick={handleDeleteAvatar}
                                className={`flex w-full items-center gap-3 px-4 py-2 text-sm ${
                                  active
                                    ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                                    : 'text-red-600 dark:text-red-400'
                                }`}
                              >
                                <TrashIcon className="h-5 w-5" />
                                Excluir imagem
                              </button>
                            )}
                          </Menu.Item>
                        )}
                      </Menu.Items>
                    </Transition>
                  </>
                )}
              </Menu>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                {photoFile && (
                  <p className="mt-2 text-sm text-primary-600 dark:text-primary-400">
                    Nova imagem selecionada: {photoFile.name}
                  </p>
                )}
              </div>
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
              placeholder="(00) 0 0000-0000"
              leftIcon={<PhoneIcon className="h-5 w-5 text-gray-400" />}
            />
            <Input
              label="CPF"
              value={formData.cpf}
              onChange={(e) => handleChange('cpf', e.target.value)}
              placeholder="000.000.000-00"
              leftIcon={
                <IdentificationIcon className="h-5 w-5 text-gray-400" />
              }
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
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                handleChange('gender', e.target.value as Gender)
              }
              options={Object.entries(genderLabels).map(([value, label]) => ({
                value,
                label,
              }))}
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
                placeholder="Rua / Avenida"
              />
            </div>
            <Input
              label="Número"
              value={formData.numero || ''}
              onChange={(e) => handleChange('numero', e.target.value)}
            />
            <Input
              label="Complemento"
              value={formData.complemento || ''}
              onChange={(e) => handleChange('complemento', e.target.value)}
            />
            <Input
              label="Bairro"
              value={formData.bairro || ''}
              onChange={(e) => handleChange('bairro', e.target.value)}
            />
            <Input
              label="Cidade"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
            />
            <Select
              label="Estado"
              value={formData.state || ''}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                handleChange('state', e.target.value)
              }
              options={[
                { value: '', label: 'Selecione a UF' },
                ...BRAZILIAN_UF_OPTIONS,
              ]}
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

      <Modal
        isOpen={isImagePreviewOpen}
        onClose={() => setIsImagePreviewOpen(false)}
        size="xl"
        showCloseButton={false}
        panelClassName="bg-transparent p-0 shadow-none rounded-none overflow-visible"
        headerClassName="hidden"
        contentClassName="mt-0 flex justify-center"
      >
        <div className="flex justify-center">
          {avatarPreview ? (
            <div className="relative aspect-square w-[min(88vw,78vh)] max-w-[640px] overflow-hidden">
              <button
                type="button"
                onClick={() => setIsImagePreviewOpen(false)}
                className="absolute left-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/90"
              >
                <span className="sr-only">Fechar visualização</span>
                <XMarkIcon className="h-6 w-6" />
              </button>
              <img
                src={avatarPreview}
                alt={`${user.firstName} ${user.lastName}`}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="relative aspect-square w-[min(88vw,78vh)] max-w-[640px] overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500">
              <button
                type="button"
                onClick={() => setIsImagePreviewOpen(false)}
                className="absolute left-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/90"
              >
                <span className="sr-only">Fechar visualização</span>
                <XMarkIcon className="h-6 w-6" />
              </button>
              <div className="flex h-full w-full items-center justify-center text-6xl font-bold text-white">
                {user.firstName?.[0]}
                {user.lastName?.[0]}
              </div>
            </div>
          )}
        </div>
      </Modal>

      <AvatarCropModal
        isOpen={isCropModalOpen}
        file={pendingPhotoFile}
        onCancel={() => {
          setIsCropModalOpen(false);
          setPendingPhotoFile(null);
        }}
        onConfirm={(nextFile) => {
          setPhotoFile(nextFile);
          setIsCropModalOpen(false);
          setPendingPhotoFile(null);
        }}
      />
    </div>
  );
}
