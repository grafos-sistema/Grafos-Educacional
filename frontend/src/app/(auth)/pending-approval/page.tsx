'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { ClockIcon, CheckCircleIcon, AcademicCapIcon, UserIcon, UsersIcon } from '@heroicons/react/24/outline';

const profileTypeLabels: Record<string, { label: string; icon: any }> = {
  TEACHER: { label: 'Professor', icon: AcademicCapIcon },
  STUDENT: { label: 'Aluno', icon: UserIcon },
  PARENT: { label: 'Responsável', icon: UsersIcon },
};

export default function PendingApprovalPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    // Se não houver usuário, redireciona para login
    if (!user) {
      router.push('/');
      return;
    }

    // Se já tem perfil aprovado, redireciona para dashboard apropriado
    if (user.teacherProfile || user.studentProfile || user.parentProfile) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  const requestedProfile = user.requestedProfileType
    ? profileTypeLabels[user.requestedProfileType]
    : null;

  const ProfileIcon = requestedProfile?.icon || UserIcon;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          {/* Ícone de relógio */}
          <div className="mx-auto h-24 w-24 flex items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 mb-6">
            <ClockIcon className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
          </div>

          {/* Título */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Aguardando Aprovação
          </h1>

          {/* Mensagem de boas-vindas */}
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Olá, <span className="font-semibold text-gray-900 dark:text-white">{user.firstName} {user.lastName}</span>!
          </p>

          {/* Card com informações */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-center mb-4">
              <ProfileIcon className="h-8 w-8 text-primary-600 dark:text-primary-400 mr-3" />
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                Perfil solicitado: <span className="text-primary-600 dark:text-primary-400">{requestedProfile?.label || 'N/A'}</span>
              </p>
            </div>

            <div className="text-left space-y-3 mt-6">
              <p className="text-gray-700 dark:text-gray-300">
                Sua conta foi criada com sucesso! No entanto, para ter acesso completo ao sistema, seu perfil precisa ser aprovado pelo administrador da instituição.
              </p>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center">
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Próximos Passos:
                </h3>
                <ul className="list-disc list-inside text-sm text-blue-800 dark:text-blue-300 space-y-2">
                  <li>O administrador da sua instituição receberá uma notificação sobre seu registro</li>
                  <li>Após a análise, seu perfil de <strong>{requestedProfile?.label}</strong> será ativado</li>
                  <li>Você receberá um email quando sua conta for aprovada</li>
                  <li>Então poderá acessar todas as funcionalidades do sistema</li>
                </ul>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                Enquanto isso, você pode fazer logout e aguardar o email de confirmação.
              </p>
            </div>
          </div>

          {/* Informações adicionais */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Suas Informações:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded p-3 text-left">
                <p className="text-gray-500 dark:text-gray-400">Email</p>
                <p className="font-medium text-gray-900 dark:text-white">{user.email}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded p-3 text-left">
                <p className="text-gray-500 dark:text-gray-400">Status</p>
                <p className="font-medium text-yellow-600 dark:text-yellow-400">Pendente de Aprovação</p>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleLogout}
              variant="secondary"
            >
              Fazer Logout
            </Button>
            <Link href="/login">
              <Button variant="outline">
                Voltar para Login
              </Button>
            </Link>
          </div>

          {/* Suporte */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Problemas ou dúvidas?{' '}
              <a href="mailto:suporte@escola.com" className="text-primary-600 hover:text-primary-500 font-medium">
                Entre em contato conosco
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
