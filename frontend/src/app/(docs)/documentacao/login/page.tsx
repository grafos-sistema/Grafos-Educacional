'use client';

import { FormEvent, useEffect, useState } from 'react';
import { BookOpenIcon, LockClosedIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function DocumentationLoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace('/documentacao');
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login({ email, password });
    } catch {
      setError('Não foi possível entrar. Confira o e-mail e a senha e tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[#e3e5e9] bg-white p-8 shadow-sm">
        <div className="mb-8 flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#33a551] text-white">
            <BookOpenIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#33a551]">Grafos</p>
            <h1 className="text-2xl font-bold text-slate-900">Documentação de uso</h1>
            <p className="mt-1 text-sm text-slate-500">Acesso exclusivo para a equipe escolar.</p>
          </div>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input label="E-mail" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required leftIcon={<EnvelopeIcon className="h-4 w-4" />} />
          <Input label="Senha" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required leftIcon={<LockClosedIcon className="h-4 w-4" />} />
          {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
          <Button type="submit" className="w-full" isLoading={submitting} disabled={submitting}>Entrar na documentação</Button>
        </form>
        <p className="mt-6 text-center text-xs text-slate-500">Use o mesmo usuário e senha do sistema Grafos.</p>
      </div>
    </main>
  );
}
