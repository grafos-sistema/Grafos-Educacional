'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { AcademicCapIcon, EnvelopeIcon, LockClosedIcon , EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useFormWithToast } from '@/hooks/useFormWithToast';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';
import { useAccessibleForm } from '@/hooks/useAccessibleForm';

export default function LoginPage() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { getFieldProps, getInputProps } = useAccessibleForm('login');

  const {
    register,
    onSubmit,
    formState: { errors },
  } = useFormWithToast<LoginFormData>({
    schema: loginSchema,
    onSubmitSuccess: async (data) => {
      setIsLoading(true);
      try {
        await login(data);
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Back to home */}
          <Link
            href="/"
            className="inline-flex items-center text-sm text-secondary-600 hover:text-primary-600 mb-8 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar para seleção de perfil
          </Link>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg">
              <AcademicCapIcon className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">Grafos</h1>
              <p className="text-sm text-secondary-500">Sistema de Gestão Escolar</p>
            </div>
          </div>

          {/* Title */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-secondary-900">
              Bem-vindo de volta
            </h2>
            <p className="mt-2 text-sm text-secondary-600">
              Faça login para acessar sua conta
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label
                htmlFor={getFieldProps('email', errors.email?.message).id}
                className="block text-sm font-medium text-secondary-900 mb-2"
              >
                Email <span className="text-danger-600" aria-label="obrigatório">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <EnvelopeIcon className="h-5 w-5 text-secondary-400" />
                </div>
                <input
                  {...register('email')}
                  {...getInputProps('email', errors.email?.message)}
                  type="email"
                  autoComplete="email"
                  required
                  aria-required="true"
                  className="block w-full rounded-xl border-0 py-3 pl-10 pr-4 text-secondary-900 ring-1 ring-inset ring-secondary-300 placeholder:text-secondary-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 transition-all"
                  placeholder="seu@email.com"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p
                  id={getFieldProps('email', errors.email?.message).errorId}
                  className="mt-2 text-sm text-danger-600"
                  role="alert"
                >
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor={getFieldProps('password', errors.password?.message).id}
                className="block text-sm font-medium text-secondary-900 mb-2"
              >
                Senha <span className="text-danger-600" aria-label="obrigatório">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <LockClosedIcon className="h-5 w-5 text-secondary-400" />
                </div>
                <input
                  {...register('password')}
                  {...getInputProps('password', errors.password?.message)}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  aria-required="true"
                  className="block w-full rounded-xl border-0 py-3 pl-10 pr-10 text-secondary-900 ring-1 ring-inset ring-secondary-300 placeholder:text-secondary-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 transition-all"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p
                  id={getFieldProps('password', errors.password?.message).errorId}
                  className="mt-2 text-sm text-danger-600"
                  role="alert"
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-600"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-secondary-700">
                  Lembrar-me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="font-semibold text-primary-600 hover:text-primary-500"
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
                className="flex w-full justify-center rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:from-primary-700 hover:to-primary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                    Entrando...
                  </span>
                ) : (
                  'Entrar'
                )}
              </button>
            </div>
          </form>



          {/* Footer */}
          <div className="mt-6 space-y-3">
            <p className="text-center text-sm text-secondary-500">
              Não tem uma conta?
            </p>
            <Link
              href="/register"
              className="flex w-full justify-center rounded-xl border-2 border-primary-600 bg-white px-4 py-3 text-sm font-semibold text-primary-600 shadow-sm hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-all"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </div>

      {/* Right side - Image/Branding */}
      <div className="relative hidden w-0 flex-1 lg:block bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800">
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="max-w-md text-center">
            <AcademicCapIcon className="h-24 w-24 text-white/90 mx-auto mb-8" />
            <h2 className="text-4xl font-bold text-white mb-4">
              Gestão Escolar Completa
            </h2>
            <p className="text-xl text-primary-100">
              Controle total sobre alunos, professores, notas, frequência e muito mais.
            </p>
            <div className="mt-12 grid grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-3xl font-bold text-white">1000+</p>
                <p className="text-sm text-primary-100 mt-1">Alunos</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-3xl font-bold text-white">50+</p>
                <p className="text-sm text-primary-100 mt-1">Professores</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-3xl font-bold text-white">30+</p>
                <p className="text-sm text-primary-100 mt-1">Turmas</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-3xl font-bold text-white">95%</p>
                <p className="text-sm text-primary-100 mt-1">Satisfação</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
