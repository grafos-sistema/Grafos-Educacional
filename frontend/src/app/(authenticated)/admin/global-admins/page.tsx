'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  PlusIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { usersService } from '@/services/users.service';
import { User, UserRole } from '@/types/user.types';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { presentFriendlyError } from '@/lib/friendly-error';

function splitFullName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR');
}

export default function GlobalAdminsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [passwordEdited, setPasswordEdited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isGlobalAdmin = user?.role === UserRole.SUPER_ADMIN_GLOBAL;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['global-admins'],
    queryFn: () =>
      usersService.findAll({
        role: UserRole.SUPER_ADMIN_GLOBAL,
        page: 1,
        limit: 100,
        includeGlobalAdmins: true,
        includeAllInstitutions: true,
      }),
    enabled: isGlobalAdmin,
  });

  const generatedPassword = useMemo(() => {
    const localPart = email.trim().toLowerCase().split('@')[0];
    return localPart ? `${localPart}@Grafos` : '';
  }, [email]);

  useEffect(() => {
    if (!passwordEdited) {
      setPassword(generatedPassword);
    }
  }, [generatedPassword, passwordEdited]);

  if (!isGlobalAdmin) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
          Acesso restrito aos Super Admins Globais.
        </div>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = splitFullName(fullName);

    if (!name.firstName || !name.lastName) {
      toast.error('Informe nome e sobrenome do novo Super Admin Global.');
      return;
    }

    if (!email.includes('@')) {
      toast.error('Informe um email válido.');
      return;
    }

    if (password.length < 6) {
      toast.error('A senha precisa ter no mínimo 6 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      await usersService.createGlobalAdmin({
        email,
        password,
        firstName: name.firstName,
        lastName: name.lastName,
        cpf: cpf || undefined,
      });

      toast.success('Super Admin Global criado com sucesso.');
      setFullName('');
      setEmail('');
      setCpf('');
      setPassword('');
      setPasswordEdited(false);
      await refetch();
    } catch (error) {
      presentFriendlyError(error, 'Não foi possível criar o Super Admin Global agora.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.push('/admin/users')}
            className="mb-3 inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Todos os usuários
          </button>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-100 p-3 text-indigo-700">
              <ShieldCheckIcon className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Super Admins Globais</h1>
              <p className="text-gray-600">Gerencie os administradores com acesso total ao sistema.</p>
            </div>
          </div>
        </div>
        <Badge variant="info" size="md">
          Acesso global
        </Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2 text-green-700">
              <PlusIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Novo Super Admin Global</h2>
              <p className="text-sm text-gray-500">A conta não fica vinculada a uma instituição.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nome completo"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Nome e sobrenome"
              disabled={isSubmitting}
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@seudominio.com.br"
              leftIcon={<EnvelopeIcon className="h-5 w-5 text-gray-400" />}
              disabled={isSubmitting}
            />
            <Input
              label="CPF (opcional)"
              value={cpf}
              onChange={(event) => setCpf(event.target.value)}
              placeholder="000.000.000-00"
              disabled={isSubmitting}
            />
            <div>
              <Input
                label="Senha inicial"
                type="text"
                value={password}
                onChange={(event) => {
                  setPasswordEdited(true);
                  setPassword(event.target.value);
                }}
                placeholder="Gerada a partir do email"
                disabled={isSubmitting}
              />
              <p className="mt-1 text-xs text-gray-500">
                A senha vem preenchida automaticamente e deverá ser alterada no primeiro acesso.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Criando...' : 'Criar Super Admin Global'}
            </Button>
          </form>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2 text-indigo-700">
              <UserGroupIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Administradores cadastrados</h2>
              <p className="text-sm text-gray-500">Somente contas SUPER_ADMIN_GLOBAL aparecem aqui.</p>
            </div>
          </div>

          {isLoading ? (
            <div className="py-10 text-center text-sm text-gray-500">Carregando administradores...</div>
          ) : data?.data.length ? (
            <div className="space-y-3">
              {data.data.map((admin: User) => (
                <div
                  key={admin.id}
                  className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {admin.firstName} {admin.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{admin.email}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Criado em {formatDate(admin.createdAt)}
                    </p>
                  </div>
                  <Badge variant={admin.isActive ? 'success' : 'error'} size="sm">
                    {admin.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 py-10 text-center text-sm text-gray-500">
              Nenhum Super Admin Global encontrado.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
