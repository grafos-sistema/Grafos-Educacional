'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authService } from '@/services/auth.service';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validations/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export default function ResetPasswordPage() {
  const router = useRouter();
  const clearAuthStore = useAuthStore((state) => state.logout);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasRecoveryToken, setHasRecoveryToken] = useState(false);
  const [hasAuthenticatedSession, setHasAuthenticatedSession] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const recoveryQueryParam =
      searchParams.get('code') || searchParams.get('token_hash') || searchParams.get('type');
    const hash = window.location.hash;
    const hasHashToken = hash.includes('access_token') || hash.includes('type=recovery');

    setHasRecoveryToken(Boolean(recoveryQueryParam) || hasHashToken);

    void supabase.auth.getSession().then(({ data }) => {
      setHasAuthenticatedSession(Boolean(data.session));
    });
  }, []);

  const isAuthenticatedPasswordChange = hasAuthenticatedSession && !hasRecoveryToken;

  const handleBackToLogin = async () => {
    if (isLeaving) return;

    setIsLeaving(true);
    try {
      // A sessão precisa ser encerrada antes da navegação. Se apenas
      // navegarmos para /login, a proteção da área autenticada identifica a
      // sessão ainda ativa e devolve o usuário para esta mesma tela.
      await authService.logout();
    } catch {
      // Mesmo que a revogação remota falhe, limpar o estado local impede um
      // loop de redirecionamento e deixa o usuário voltar a tentar o login.
    } finally {
      clearAuthStore();
      router.replace('/login');
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      if (isAuthenticatedPasswordChange) {
        if (!currentPassword) {
          setErrorMessage('Informe sua senha atual para continuar.');
          return;
        }

        if (currentPassword === data.password) {
          setErrorMessage('A nova senha deve ser diferente da senha atual.');
          return;
        }

        await authService.changePassword(currentPassword, data.password);
      } else {
        await authService.resetPassword('', data.password);
      }

      setSuccessMessage('Senha atualizada com sucesso. Voce ja pode entrar com a nova senha.');

      if (isAuthenticatedPasswordChange) {
        // A troca obrigatória conclui o primeiro acesso. Encerrar a sessão
        // evita que o usuário continue com a sessão inicial e força um novo
        // login usando a senha recém-definida.
        await authService.logout();
        clearAuthStore();

        window.setTimeout(() => {
          router.replace('/login/gestao');
        }, 1200);
      } else if (hasAuthenticatedSession) {
        window.setTimeout(() => {
          router.push('/');
        }, 1200);
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'Nao foi possivel redefinir a senha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Redefinir senha</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Escolha uma nova senha para concluir o acesso com seguranca.
          </p>
        </div>

        {!hasRecoveryToken && !hasAuthenticatedSession && !successMessage && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            Abra esta pagina usando o link enviado por email para concluir a redefinicao da senha.
          </div>
        )}

        {hasAuthenticatedSession && !successMessage && (
          <div className="mb-5 rounded-lg border border-primary-200 bg-primary-50 p-4 text-sm text-primary-800 dark:border-primary-800 dark:bg-primary-950/30 dark:text-primary-300">
            Para continuar usando o sistema, altere sua senha inicial agora.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {successMessage && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
              {errorMessage}
            </div>
          )}

          {isAuthenticatedPasswordChange && (
            <Input
              label="Senha atual"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              helperText="Informe a senha inicial recebida no primeiro acesso. A nova senha precisa ser diferente dela."
              required
            />
          )}

          <Input
            label="Nova senha"
            type="password"
            autoComplete="new-password"
            {...register('password')}
            error={errors.password?.message}
            required
          />

          <Input
            label="Confirmar nova senha"
            type="password"
            autoComplete="new-password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
            required
          />

          <Button
            type="submit"
            className="w-full"
            isLoading={isSubmitting}
            isDisabled={!hasRecoveryToken && !hasAuthenticatedSession && !successMessage}
          >
            Atualizar senha
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <button
            type="button"
            onClick={handleBackToLogin}
            disabled={isLeaving}
            className="font-medium text-primary-600 transition-colors hover:text-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLeaving ? 'Saindo...' : 'Voltar para o login'}
          </button>
        </div>
      </div>
    </div>
  );
}
