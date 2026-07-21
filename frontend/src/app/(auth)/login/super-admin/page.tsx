'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { ShieldExclamationIcon, EnvelopeIcon, LockClosedIcon, ServerIcon, AcademicCapIcon, GlobeAltIcon , EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function SuperAdminLoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      setIsLoading(true);
      await login(data);
    } catch (err: any) {
      setError(err?.message || 'Erro ao fazer login. Verifique suas credenciais.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Back to home */}
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-purple-600 mb-8 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar para seleção de perfil
          </Link>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg">
              <ShieldExclamationIcon className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Grafos System</h1>
              <p className="text-sm text-gray-500">Administração Global</p>
            </div>
          </div>

          {/* Title */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Super Administrador
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Acesso ao painel de gerenciamento global do sistema
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                Email do Sistema
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="block w-full rounded-xl border-0 py-3 pl-10 pr-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm sm:leading-6 transition-all"
                  placeholder="admin@grafoseducacional.com.br"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                Senha
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password')}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="block w-full rounded-xl border-0 py-3 pl-10 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm sm:leading-6 transition-all"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-600"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Lembrar-me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="font-semibold text-purple-600 hover:text-purple-500"
                >
                  Esqueceu a senha?
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:from-purple-700 hover:to-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Autenticando...
                  </span>
                ) : (
                  'Acessar Painel Global'
                )}
              </button>
            </div>
          </form>

        </div>
      </div>

      {/* Right side - Branding */}
      <div className="relative hidden w-0 flex-1 lg:block bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600">
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="max-w-md text-center">
            <ShieldExclamationIcon className="h-24 w-24 text-white/90 mx-auto mb-8" />
            <h2 className="text-4xl font-bold text-white mb-4">
              Controle Global
            </h2>
            <p className="text-xl text-white/80 mb-12">
              Gerencie todo o ecossistema educacional
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <ServerIcon className="h-8 w-8 text-white mx-auto mb-2" />
                <p className="text-sm text-white/80">Sistema</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <AcademicCapIcon className="h-8 w-8 text-white mx-auto mb-2" />
                <p className="text-sm text-white/80">Questões</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <GlobeAltIcon className="h-8 w-8 text-white mx-auto mb-2" />
                <p className="text-sm text-white/80">Instituições</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
