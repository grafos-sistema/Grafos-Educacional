"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  PlusIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { usersService } from "@/services/users.service";
import { User, UserRole } from "@/types/user.types";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { presentFriendlyError } from "@/lib/friendly-error";

function splitFullName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

export default function GlobalAdminsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isGlobalAdmin = user?.role === UserRole.SUPER_ADMIN_GLOBAL;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["global-admins"],
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
      toast.error("Informe nome e sobrenome do novo Super Admin Global.");
      return;
    }

    if (!email.includes("@")) {
      toast.error("Informe um email válido.");
      return;
    }

    const normalizedCpf = cpf.replace(/\D/g, "");
    if (normalizedCpf.length < 6) {
      toast.error("Informe um CPF válido para gerar a senha inicial.");
      return;
    }

    setIsSubmitting(true);
    try {
      await usersService.createGlobalAdmin({
        email,
        firstName: name.firstName,
        lastName: name.lastName,
        cpf: normalizedCpf,
      });

      toast.success("Super Admin Global criado com sucesso.");
      setFullName("");
      setEmail("");
      setCpf("");
      await refetch();
    } catch (error) {
      presentFriendlyError(
        error,
        "Não foi possível criar o Super Admin Global agora.",
      );
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
            onClick={() => router.push("/admin/users")}
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
              <h1 className="text-2xl font-bold text-gray-900">
                Super Admins Globais
              </h1>
              <p className="text-gray-600">
                Gerencie os administradores com acesso total ao sistema.
              </p>
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
              <h2 className="font-semibold text-gray-900">
                Novo Super Admin Global
              </h2>
              <p className="text-sm text-gray-500">
                A conta não fica vinculada a uma instituição.
              </p>
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
              label="CPF"
              value={cpf}
              onChange={(event) => setCpf(event.target.value)}
              placeholder="000.000.000-00"
              disabled={isSubmitting}
            />
            <div className="rounded-lg border border-green-100 bg-green-50 p-3 text-sm text-green-800">
              A senha inicial será formada pelos 6 primeiros dígitos do CPF e
              deverá ser alterada no primeiro acesso.
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Criando..." : "Criar Super Admin Global"}
            </Button>
          </form>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2 text-indigo-700">
              <UserGroupIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">
                Administradores cadastrados
              </h2>
              <p className="text-sm text-gray-500">
                Somente contas SUPER_ADMIN_GLOBAL aparecem aqui.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="py-10 text-center text-sm text-gray-500">
              Carregando administradores...
            </div>
          ) : data?.data.length ? (
            <div className="space-y-3">
              {data.data.map((admin: User) => (
                <div
                  key={admin.id}
                  className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {admin.avatar ? (
                      <img
                        src={admin.avatar}
                        alt={`${admin.firstName} ${admin.lastName}`}
                        className="h-11 w-11 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-bold text-white">
                        {admin.firstName?.[0]}
                        {admin.lastName?.[0]}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">
                        {admin.firstName} {admin.lastName}
                      </p>
                      <p className="truncate text-sm text-gray-600">
                        {admin.email}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Criado em {formatDate(admin.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={admin.isActive ? "success" : "error"}
                    size="sm"
                  >
                    {admin.isActive ? "Ativo" : "Inativo"}
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
