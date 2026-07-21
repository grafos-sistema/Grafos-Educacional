'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authService } from '@/services/auth.service';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validations/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      await authService.requestPasswordReset(data.email);

      setSuccessMessage(
        'Se o email existir em nossa base, voce recebera um link para redefinir sua senha em alguns minutos.'
      );
    } catch (error: any) {
      setErrorMessage(error?.message || 'Nao foi possivel solicitar a redefinicao de senha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Esqueceu sua senha?</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Informe seu email para receber um link de redefinicao.
          </p>
        </div>

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

          <Input
            label="Email"
            type="email"
            autoComplete="email"
            {...register('email')}
            error={errors.email?.message}
            required
          />

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Enviar link de redefinicao
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
}
