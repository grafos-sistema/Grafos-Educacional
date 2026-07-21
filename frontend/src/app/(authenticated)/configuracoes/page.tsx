'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  BellIcon,
  UserCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { usersService } from '@/services/users.service';
import { ChangePasswordData } from '@/types/user.types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  INSTITUTION_ADMIN: 'Admin da Instituição',
  COORDINATOR: 'Coordenador',
  TEACHER: 'Professor',
  STUDENT: 'Aluno',
  PARENT: 'Responsável',
};

export default function ConfiguracoesPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const toast = useToast();

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordData) => {
      if (!user?.id) throw new Error('Usuário não encontrado');
      return await usersService.changePassword(user.id, data);
    },
    onSuccess: () => {
      toast.success('Senha alterada com sucesso!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erro ao alterar senha';
      toast.error(message);
    },
  });

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('As senhas não conferem');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
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
          Configurações
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie sua conta e preferências
        </p>
      </div>

      {/* Informações da Conta */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <UserCircleIcon className="h-6 w-6" />
          Informações da Conta
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Nome</p>
              <p className="text-gray-900 dark:text-white">
                {user.firstName} {user.lastName}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</p>
              <p className="text-gray-900 dark:text-white">{user.email}</p>
            </div>
            {user.emailVerified ? (
              <Badge variant="success" size="sm">
                Verificado
              </Badge>
            ) : (
              <Badge variant="warning" size="sm">
                Não verificado
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Perfil</p>
              <p className="text-gray-900 dark:text-white">{roleLabels[user.role]}</p>
            </div>
            <Badge variant="info" size="sm">
              {user.role}
            </Badge>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</p>
              <p className="text-gray-900 dark:text-white">
                {user.isActive ? 'Conta Ativa' : 'Conta Inativa'}
              </p>
            </div>
            <Badge variant={user.isActive ? 'success' : 'error'} size="sm">
              {user.isActive ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="secondary"
            onClick={() => router.push('/perfil')}
            className="w-full md:w-auto"
          >
            Editar Perfil
          </Button>
        </div>
      </div>

      {/* Alterar Senha */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <LockClosedIcon className="h-6 w-6" />
          Segurança
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex gap-2">
              <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Dicas para uma senha segura:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Use pelo menos 8 caracteres</li>
                  <li>Combine letras maiúsculas e minúsculas</li>
                  <li>Inclua números e caracteres especiais</li>
                  <li>Não use informações pessoais óbvias</li>
                </ul>
              </div>
            </div>
          </div>

          <Input
            label="Senha Atual"
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) =>
              setPasswordData({ ...passwordData, currentPassword: e.target.value })
            }
            required
            leftIcon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
          />
          <Input
            label="Nova Senha"
            type="password"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            required
            minLength={6}
            leftIcon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
          />
          <Input
            label="Confirmar Nova Senha"
            type="password"
            value={passwordData.confirmPassword}
            onChange={(e) =>
              setPasswordData({ ...passwordData, confirmPassword: e.target.value })
            }
            required
            minLength={6}
            leftIcon={<ShieldCheckIcon className="h-5 w-5 text-gray-400" />}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
              }
              disabled={changePasswordMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={changePasswordMutation.isPending}
              disabled={changePasswordMutation.isPending}
            >
              Alterar Senha
            </Button>
          </div>
        </form>
      </div>

      {/* Preferências (Futuro) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <BellIcon className="h-6 w-6" />
          Notificações
        </h3>
        <div className="text-center py-8">
          <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Configurações de notificações em breve
          </p>
        </div>
      </div>

      {/* Zona de Perigo */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 border-red-200 dark:border-red-800 p-6">
        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
          Zona de Perigo
        </h3>
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-700 dark:text-red-300 mb-3">
              <strong>Sair da conta:</strong> Você será desconectado do sistema e precisará fazer
              login novamente.
            </p>
            <Button variant="danger" onClick={logout} className="w-full md:w-auto">
              Sair da Conta
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
