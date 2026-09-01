import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

type SyncParentsBody = {
  studentId: string;
  institutionId: string;
  responsaveis: any[];
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

function buildInitialPassword(cpf?: string | null) {
  const digits = String(cpf ?? "").replace(/\D/g, "");
  return digits.length >= 6 ? digits.slice(0, 6) : null;
}

const adultOnlyRelationships = new Set(["primo", "prima", "irmão", "irmã"]);

function isAtLeast18(value?: string | null) {
  if (!value) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return false;

  const birthDate = new Date(year, month - 1, day);
  if (Number.isNaN(birthDate.getTime())) return false;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const birthdayNotReached =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() < birthDate.getDate());

  if (birthdayNotReached) age -= 1;
  return age >= 18;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    const body: SyncParentsBody = await req.json();
    const { studentId, institutionId, responsaveis } = body;

    if (!studentId || !institutionId || !Array.isArray(responsaveis)) {
      return json({ error: "Parâmetros inválidos" }, 400);
    }

    const responsibleWithInvalidAge = responsaveis.find((resp: any) => {
      const relationship = String(resp?.parentesco ?? "")
        .trim()
        .toLocaleLowerCase("pt-BR");
      return (
        resp?.nome?.trim() &&
        adultOnlyRelationships.has(relationship) &&
        !isAtLeast18(resp?.dataNascimento ?? resp?.birthDate)
      );
    });

    if (responsibleWithInvalidAge) {
      return json(
        {
          error: "responsible_must_be_adult",
          details:
            "Para irmão, irmã, primo ou prima, informe uma data de nascimento que confirme idade igual ou superior a 18 anos.",
        },
        400,
      );
    }

    const emergencyContactCount = responsaveis.filter((resp: any) =>
      Boolean(resp?.nome?.trim() && resp?.contatoEmergencia),
    ).length;
    if (emergencyContactCount > 2) {
      return json(
        {
          error: "too_many_emergency_contacts",
          details: "O aluno pode ter no máximo dois contatos de emergência.",
        },
        400,
      );
    }

    const now = new Date().toISOString();

    // 1. Get all current parents for this student
    const { data: existingLinks, error: existingLinksError } = await supabase
      .from("student_parents")
      .select("id, parentId")
      .eq("studentId", studentId);

    if (existingLinksError) {
      return json(
        {
          error: "failed_to_read_student_parents",
          details: existingLinksError.message,
        },
        500,
      );
    }

    const currentLinkIds = new Set(
      (existingLinks || []).map((link) => link.id),
    );

    // 2. Processar array de responsáveis
    for (const resp of responsaveis) {
      if (!resp.nome?.trim()) continue;

      const nomeCompleto = resp.nome.trim();
      const primeiroNome = nomeCompleto.split(" ")[0];
      const ultimoNome =
        nomeCompleto.split(" ").slice(1).join(" ") || "Responsável";
      // A tela usa dataNascimento; aceitar birthDate também mantém a função
      // compatível com versões anteriores do formulário e evita perder o dado.
      const responsibleBirthDate =
        resp.dataNascimento ?? resp.birthDate ?? null;

      let parentUserId: string | null = null;
      let parentProfileId: string | null = null;

      // Prefer the existing relationship sent by the edit screen. This is
      // essential for responsible records without e-mail/CPF: matching only
      // by those fields could create a second parent and leave the old date
      // disconnected from the student.
      if (resp.linkId || resp.parentId) {
        let linkQuery = supabase
          .from("student_parents")
          .select("id, parentId, parents!inner(id, userId)")
          .eq("studentId", studentId);

        if (resp.linkId) {
          linkQuery = linkQuery.eq("id", resp.linkId);
        } else {
          linkQuery = linkQuery.eq("parentId", resp.parentId);
        }

        const { data: existingLink } = await linkQuery.maybeSingle();
        const existingParent = (existingLink as any)?.parents;
        if (existingParent) {
          parentProfileId = existingParent.id;
          parentUserId = existingParent.userId;
        }
      }

      if (!parentUserId && resp.parentUserId) {
        const { data: existingParent } = await supabase
          .from("parents")
          .select("id, userId")
          .eq("id", resp.parentId)
          .eq("userId", resp.parentUserId)
          .maybeSingle();
        if (existingParent) {
          parentProfileId = existingParent.id;
          parentUserId = existingParent.userId;
        }
      }

      const normalizedParentCpf = resp.cpf
        ? resp.cpf.replace(/\D/g, "") || null
        : null;

      // Tentar encontrar responsável existente por CPF (prioritário) ou email
      if (!parentUserId && (resp.cpf || resp.email)) {
        let query = supabase
          .from("users")
          .select("id")
          .eq("institutionId", institutionId)
          .eq("role", "PARENT");
        if (normalizedParentCpf && resp.email) {
          query = query.or(
            `cpf.eq.${normalizedParentCpf},email.eq.${resp.email}`,
          );
        } else if (normalizedParentCpf) {
          query = query.eq("cpf", normalizedParentCpf);
        } else if (resp.email) {
          query = query.eq("email", resp.email);
        }

        const { data: existingParent } = await query.maybeSingle();
        if (existingParent) {
          parentUserId = existingParent.id;
        }
      }

      // Independentemente de como o responsável foi localizado (vínculo,
      // CPF ou e-mail), os dados pessoais precisam ser atualizados no mesmo
      // usuário. Antes, a atualização só acontecia no caminho de CPF/e-mail;
      // por isso a data preenchida em um vínculo já existente era perdida ao
      // reabrir a edição.
      if (parentUserId) {
        const { error: parentUpdateError } = await supabase
          .from("users")
          .update({
            name: nomeCompleto,
            firstName: primeiroNome,
            lastName: ultimoNome,
            cpf: normalizedParentCpf ?? undefined,
            phone: resp.celular ?? null,
            whatsapp: resp.whatsapp ?? null,
            birthDate: responsibleBirthDate,
            updatedAt: now,
          })
          .eq("id", parentUserId);

        if (parentUpdateError) {
          return json(
            {
              error: "failed_to_update_parent_user",
              details: parentUpdateError.message,
            },
            500,
          );
        }
      }

      if (!parentUserId) {
        // Se tem email real → criar conta auth para acesso ao sistema
        // Se não tem email → usar email placeholder (sem acesso ao sistema)
        const temEmailReal = !!resp.email?.trim();
        const parentEmail = temEmailReal
          ? resp.email.trim().toLowerCase()
          : `responsavel_${crypto.randomUUID()}@sem-acesso.grafos.internal`;

        // Responsáveis sem e-mail não terão acesso e recebem uma senha
        // aleatória apenas para satisfazer o requisito do Auth. Quando há
        // e-mail real, o CPF é obrigatório para gerar a senha conhecida do
        // primeiro acesso.
        const parentPassword = temEmailReal
          ? buildInitialPassword(normalizedParentCpf)
          : crypto.randomUUID();

        if (!parentPassword) {
          return json(
            { error: "missing_cpf_for_parent_initial_password" },
            400,
          );
        }

        const { data: pAuth, error: pAuthError } =
          await supabase.auth.admin.createUser({
            email: parentEmail,
            password: parentPassword,
            email_confirm: true,
            user_metadata: {
              fullName: nomeCompleto,
              temEmailReal,
              mustChangePassword: true,
            },
          });

        if (pAuthError) {
          console.error(
            "Erro ao criar Auth do Responsável (Sync):",
            pAuthError,
          );
          return json(
            { error: `Erro na criação do Auth: ${pAuthError.message}` },
            500,
          );
        }

        if (pAuth?.user) {
          parentUserId = pAuth.user.id;
          const { error: parentInsertError } = await supabase
            .from("users")
            .insert({
              id: parentUserId,
              auth_user_id: parentUserId,
              email: parentEmail,
              password: null,
              role: "PARENT",
              name: nomeCompleto,
              firstName: primeiroNome,
              lastName: ultimoNome,
              cpf: normalizedParentCpf,
              phone: resp.celular ?? null,
              whatsapp: resp.whatsapp ?? null,
              birthDate: responsibleBirthDate,
              institutionId,
              isActive: true,
              emailVerified: temEmailReal,
              createdAt: now,
              updatedAt: now,
            });

          if (parentInsertError) {
            return json(
              {
                error: "failed_to_create_parent_user",
                details: parentInsertError.message,
              },
              500,
            );
          }
        }
      }

      if (parentUserId) {
        if (!parentProfileId) {
          const { data: pProfile } = await supabase
            .from("parents")
            .select("id")
            .eq("userId", parentUserId)
            .maybeSingle();

          if (pProfile) {
            parentProfileId = pProfile.id;
          } else {
            parentProfileId = crypto.randomUUID();
            const { error: parentProfileError } = await supabase
              .from("parents")
              .insert({
                id: parentProfileId,
                userId: parentUserId,
                createdAt: now,
                updatedAt: now,
              });

            if (parentProfileError) {
              return json(
                {
                  error: "failed_to_create_parent_profile",
                  details: parentProfileError.message,
                },
                500,
              );
            }
          }
        }

        // Verificar se o vínculo já existe e sempre atualizar seus dados,
        // inclusive quando o vínculo veio da própria tela de edição.
        const { data: existingLink } = await supabase
          .from("student_parents")
          .select("id")
          .eq("studentId", studentId)
          .eq("parentId", parentProfileId)
          .maybeSingle();

        if (existingLink) {
          // Atualizar vínculo existente
          const { error: linkUpdateError } = await supabase
            .from("student_parents")
            .update({
              relationship: resp.parentesco ?? "Responsável",
              isPrimary: resp.financeiro ?? false,
              notificacoes: resp.notificacoes ?? false,
              podeRetirar: resp.podeRetirar ?? false,
            })
            .eq("id", existingLink.id);
          if (linkUpdateError) {
            return json(
              {
                error: "failed_to_update_student_parent_link",
                details: linkUpdateError.message,
              },
              500,
            );
          }
          currentLinkIds.delete(existingLink.id);
        } else {
          // Criar novo vínculo
          const { error: linkInsertError } = await supabase
            .from("student_parents")
            .insert({
              id: crypto.randomUUID(),
              studentId: studentId,
              parentId: parentProfileId,
              relationship: resp.parentesco ?? "Responsável",
              isPrimary: resp.financeiro ?? false,
              notificacoes: resp.notificacoes ?? false,
              podeRetirar: resp.podeRetirar ?? false,
              createdAt: now,
            });
          if (linkInsertError) {
            return json(
              {
                error: "failed_to_create_student_parent_link",
                details: linkInsertError.message,
              },
              500,
            );
          }
        }
      }
    }

    // 3. Remove links that were deleted in the UI
    if (currentLinkIds.size > 0) {
      const idsToDelete = Array.from(currentLinkIds);
      const { error: deleteLinksError } = await supabase
        .from("student_parents")
        .delete()
        .in("id", idsToDelete);
      if (deleteLinksError) {
        return json(
          {
            error: "failed_to_remove_student_parent_links",
            details: deleteLinksError.message,
          },
          500,
        );
      }
    }

    return json({ success: true }, 200);
  } catch (error: any) {
    console.error("Error in admin-sync-student-parents:", error);
    return json({ error: error.message }, 500);
  }
});
