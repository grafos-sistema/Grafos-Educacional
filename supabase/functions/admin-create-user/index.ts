import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
}

type CreateUserBody = {
  email?: string
  password?: string
  role?: string
  firstName?: string
  lastName?: string
  cpf?: string | null
  rg?: string | null
  rgEmissor?: string | null
  rgEmissao?: string | null
  socialName?: string | null
  nacionalidade?: string | null
  naturalidade?: string | null
  phone?: string | null
  telefoneFixo?: string | null
  birthDate?: string | null
  gender?: string | null
  address?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  isActive?: boolean
  institutionId?: string
  institutionIds?: string[]
  specialization?: string | null
  degree?: string | null
  registrationNumber?: string | null
  hireDate?: string | null
  occupation?: string | null
  subjectIds?: string[]
  linkedStudents?: Array<{
    studentId: string
    relationship?: string
    isPrimary?: boolean
    notificacoes?: boolean
    podeRetirar?: boolean
  }>
  
  situacao?: string | null
  escola?: string | null
  unidade?: string | null
  anoLetivo?: string | null
  curso?: string | null
  serie?: string | null
  turma?: string | null
  modalidade?: string | null
  turno?: string | null
  dataMatricula?: string | null
  observacoes?: string | null
  
  healthInfo?: Record<string, any>
  transportInfo?: Record<string, any>
  responsaveis?: any[]
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      Connection: "keep-alive",
    },
  })
}

function getJwt(req: Request) {
  const header = req.headers.get("Authorization") ?? ""
  if (!header.startsWith("Bearer ")) return null
  return header.slice("Bearer ".length)
}

function isAdminRole(role: string) {
  return role === "SUPER_ADMIN" || role === "INSTITUTION_ADMIN"
}

function isAllowedRole(role: string) {
  return [
    "SUPER_ADMIN",
    "INSTITUTION_ADMIN",
    "COORDINATOR",
    "TEACHER",
    "STUDENT",
    "PARENT",
  ].includes(role)
}

function buildInitialPassword(email: string) {
  const [localPart] = email.split("@")
  return `${localPart}@Grafos`
}

async function callerCanAccessInstitution(
  supabase: ReturnType<typeof createClient>,
  caller: { id: string; role: string; institutionId: string },
  institutionId: string,
) {
  if (caller.role === "SUPER_ADMIN" || caller.institutionId === institutionId) {
    return true
  }

  const { data: link, error } = await supabase
    .from("user_institutions")
    .select("id")
    .eq("userId", caller.id)
    .eq("institutionId", institutionId)
    .eq("isActive", true)
    .maybeSingle()

  if (error) {
    throw new Error("failed_to_check_access")
  }

  return !!link
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405)

  const jwt = getJwt(req)
  if (!jwt) return json({ error: "missing_authorization" }, 401)

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "missing_env" }, 500)

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: userData, error: userError } = await supabase.auth.getUser(jwt)
  if (userError || !userData.user) return json({ error: "invalid_token" }, 401)

  const { data: caller, error: callerError } = await supabase
    .from("users")
    .select('id, role, "institutionId"')
    .eq("auth_user_id", userData.user.id)
    .maybeSingle()

  if (callerError) return json({ error: "failed_to_load_profile" }, 500)
  if (!caller) return json({ error: "missing_profile" }, 409)
  if (!isAdminRole(caller.role)) return json({ error: "not_authorized" }, 403)

  const body = await req.json().catch(() => null) as CreateUserBody | null

  const email = body?.email?.trim().toLowerCase()
  const role = body?.role?.trim()
  const firstName = body?.firstName?.trim()
  const lastName = body?.lastName?.trim()
  const institutionId = body?.institutionId?.trim() || caller.institutionId
  const requestedInstitutionIds = Array.isArray(body?.institutionIds)
    ? body?.institutionIds.map((value) => value?.trim()).filter(Boolean) as string[]
    : []
  const institutionIds = Array.from(new Set([institutionId, ...requestedInstitutionIds].filter(Boolean)))
  const isActive = body?.isActive ?? true
  const generatedPassword = email ? buildInitialPassword(email) : null

  if (!email) return json({ error: "missing_email" }, 400)
  if (!generatedPassword || generatedPassword.length < 6) return json({ error: "invalid_password" }, 400)
  if (!role || !isAllowedRole(role)) return json({ error: "invalid_role" }, 400)
  if (!firstName) return json({ error: "missing_firstName" }, 400)
  if (!lastName) return json({ error: "missing_lastName" }, 400)
  if (!institutionId) return json({ error: "missing_institutionId" }, 400)
  if (institutionIds.length === 0) return json({ error: "missing_institutionIds" }, 400)

  if (role === "SUPER_ADMIN" && caller.role !== "SUPER_ADMIN") {
    return json({ error: "not_authorized_for_role" }, 403)
  }

  try {
    for (const targetInstitutionId of institutionIds) {
      const canAccess = await callerCanAccessInstitution(supabase, caller, targetInstitutionId)
      if (!canAccess) return json({ error: "not_authorized_for_institution" }, 403)
    }
  } catch {
    return json({ error: "failed_to_check_access" }, 500)
  }

  const { data: institutions, error: institutionError } = await supabase
    .from("institutions")
    .select('id, "isActive"')
    .in("id", institutionIds)

  if (institutionError) return json({ error: "failed_to_load_institution" }, 500)
  if (!institutions || institutions.length !== institutionIds.length) {
    return json({ error: "institution_not_found" }, 404)
  }
  if (institutions.some((institution) => !institution.isActive)) {
    return json({ error: "institution_inactive" }, 400)
  }

  const now = new Date().toISOString()
  const fullName = `${firstName} ${lastName}`.trim()

  const { data: existingCpf, error: existingCpfError } = body?.cpf
    ? await supabase
        .from("users")
        .select("id")
        .eq("institutionId", institutionId)
        .eq("cpf", body.cpf)
        .maybeSingle()
    : { data: null, error: null }

  if (existingCpfError) return json({ error: "failed_to_check_cpf" }, 500)
  if (existingCpf) return json({ error: "cpf_already_registered" }, 409)

  const { data: authResult, error: createAuthError } = await supabase.auth.admin.createUser({
    email,
    password: generatedPassword,
    email_confirm: true,
    user_metadata: {
      firstName,
      lastName,
      fullName,
      mustChangePassword: true,
    },
  })

  if (createAuthError || !authResult.user) {
    const message = createAuthError?.message ?? "failed_to_create_auth_user"
    const status = /already been registered|already exists|duplicate/i.test(message) ? 409 : 500
    return json({ error: "failed_to_create_auth_user", details: message }, status)
  }

  const authUser = authResult.user

  const cleanup = async () => {
    await supabase.from("user_institutions").delete().eq("userId", authUser.id)
    await supabase.from("users").delete().eq("id", authUser.id)
    await supabase.auth.admin.deleteUser(authUser.id)
  }

  const { data: appUser, error: appUserError } = await supabase
    .from("users")
    .insert({
      id: authUser.id,
      auth_user_id: authUser.id,
      email,
      password: null,
      role,
      name: fullName,
      firstName,
      lastName,
      cpf: body?.cpf ?? null,
      rg: body?.rg ?? null,
      rgEmissor: body?.rgEmissor ?? null,
      rgEmissao: body?.rgEmissao ?? null,
      socialName: body?.socialName ?? null,
      nacionalidade: body?.nacionalidade ?? null,
      naturalidade: body?.naturalidade ?? null,
      phone: body?.phone ?? null,
      telefoneFixo: body?.telefoneFixo ?? null,
      birthDate: body?.birthDate ?? null,
      gender: body?.gender ?? null,
      address: body?.address ?? null,
      numero: body?.numero ?? null,
      complemento: body?.complemento ?? null,
      bairro: body?.bairro ?? null,
      city: body?.city ?? null,
      state: body?.state ?? null,
      zipCode: body?.zipCode ?? null,
      institutionId,
      isActive,
      emailVerified: true,
      requestedProfileType: null,
      createdAt: now,
      updatedAt: now,
    })
    .select('id, email, role, "firstName", "lastName", cpf, phone, "birthDate", avatar, "institutionId", "isActive", "createdAt", "updatedAt"')
    .single()

  if (appUserError || !appUser) {
    await cleanup()
    return json({ error: "failed_to_create_app_user", details: appUserError?.message }, 500)
  }

  const institutionLinks = institutionIds.map((targetInstitutionId) => ({
    id: crypto.randomUUID(),
    userId: appUser.id,
    institutionId: targetInstitutionId,
    isActive: true,
    isPrimary: targetInstitutionId === institutionId,
    createdAt: now,
    updatedAt: now,
  }))

  const { error: linkError } = await supabase
    .from("user_institutions")
    .upsert(institutionLinks, { onConflict: "userId,institutionId" })

  if (linkError) {
    await cleanup()
    return json({ error: "failed_to_link_user_institution", details: linkError.message }, 500)
  }

  // Handle specific roles profiles and related data
  if (role === "STUDENT") {
    // Validar que o aluno tem ao menos 1 responsável com nome preenchido
    const responsaveisValidos = (body?.responsaveis ?? []).filter(
      (r: any) => r?.nome?.trim()
    )
    if (responsaveisValidos.length === 0) {
      await cleanup()
      return json({ error: "student_requires_at_least_one_guardian", details: "Todo aluno deve ter ao menos um responsável cadastrado." }, 400)
    }

    const studentId = crypto.randomUUID()
    
    // Generate a registration number (simple fallback, should ideally use a sequence)
    const registrationNumber = `MAT${Date.now()}`
    
    const { error: studentError } = await supabase.from("students").insert({
      id: studentId,
      userId: appUser.id,
      registrationNumber,
      enrollmentDate: body?.dataMatricula ?? now,
      situacao: body?.situacao ?? 'ATIVO',
      escola: body?.escola ?? null,
      unidade: body?.unidade ?? null,
      anoLetivo: body?.anoLetivo ?? null,
      curso: body?.curso ?? null,
      serie: body?.serie ?? null,
      turma: body?.turma ?? null,
      modalidade: body?.modalidade ?? null,
      turno: body?.turno ?? null,
      observacoes: body?.observacoes ?? null,
      createdAt: now,
      updatedAt: now,
    })

    if (!studentError) {
      if (body?.healthInfo) {
        await supabase.from("student_health_records").insert({
          id: crypto.randomUUID(),
          studentId: studentId,
          ...body.healthInfo,
          createdAt: now,
          updatedAt: now,
        })
      }

      if (body?.transportInfo) {
        await supabase.from("student_transportation").insert({
          id: crypto.randomUUID(),
          studentId: studentId,
          ...body.transportInfo,
          createdAt: now,
          updatedAt: now,
        })
      }

      if (body?.responsaveis && Array.isArray(body.responsaveis)) {
        for (const resp of body.responsaveis) {
          // Apenas o nome é obrigatório; email e CPF são opcionais
          if (!resp.nome?.trim()) continue;

          const nomeCompleto = resp.nome.trim()
          const primeiroNome = nomeCompleto.split(' ')[0]
          const ultimoNome = nomeCompleto.split(' ').slice(1).join(' ') || 'Responsável'

          let parentUserId: string | null = null;

          // Tentar encontrar responsável existente por CPF (prioritário) ou email
          if (resp.cpf || resp.email) {
            let query = supabase.from("users").select("id").eq("institutionId", institutionId)
            if (resp.cpf && resp.email) {
              query = query.or(`cpf.eq.${resp.cpf},email.eq.${resp.email}`)
            } else if (resp.cpf) {
              query = query.eq("cpf", resp.cpf)
            } else if (resp.email) {
              query = query.eq("email", resp.email)
            }
            const { data: existingParent } = await query.maybeSingle()
            if (existingParent) {
              parentUserId = existingParent.id
            }
          }

          if (!parentUserId) {
            // Se tem email real → criar conta auth para acesso ao sistema
            // Se não tem email → usar email placeholder (sem acesso ao sistema)
            const temEmailReal = !!resp.email?.trim()
            const parentEmail = temEmailReal
              ? resp.email.trim().toLowerCase()
              : `responsavel_${crypto.randomUUID()}@sem-acesso.grafos.internal`

            // Senha padrão forte para evitar erro de password policy
            const parentPassword = 'Grafos@2024!'

            const { data: pAuth, error: pAuthError } = await supabase.auth.admin.createUser({
              email: parentEmail,
              password: parentPassword,
              email_confirm: true,
              user_metadata: {
                fullName: nomeCompleto,
                temEmailReal,
              },
            })

            if (pAuthError) {
              console.error("Erro ao criar Auth do Responsável:", pAuthError)
              return json({ error: `Erro na criação do Auth do responsável: ${pAuthError.message}` }, 500)
            }

            if (pAuth?.user) {
              parentUserId = pAuth.user.id
              await supabase.from("users").insert({
                id: parentUserId,
                auth_user_id: parentUserId,
                email: parentEmail,
                password: null,
                role: 'PARENT',
                name: nomeCompleto,
                firstName: primeiroNome,
                lastName: ultimoNome,
                cpf: resp.cpf ?? null,
                phone: resp.celular ?? null,
                whatsapp: resp.whatsapp ?? null,
                institutionId,
                isActive: true,
                // Email verificado somente se o responsável tem email real
                emailVerified: temEmailReal,
                createdAt: now,
                updatedAt: now,
              })
            }
          }

          if (parentUserId) {
            // Garantir que o perfil de responsável (parents) existe
            let parentProfileId: string | null = null;
            const { data: pProfile } = await supabase
              .from("parents")
              .select("id")
              .eq("userId", parentUserId)
              .maybeSingle()

            if (pProfile) {
              parentProfileId = pProfile.id
            } else {
              parentProfileId = crypto.randomUUID()
              await supabase.from("parents").insert({
                id: parentProfileId,
                userId: parentUserId,
                createdAt: now,
                updatedAt: now,
              })
            }

            // Criar vínculo aluno ↔ responsável
            await supabase.from("student_parents").insert({
              id: crypto.randomUUID(),
              studentId: studentId,
              parentId: parentProfileId,
              relationship: resp.parentesco ?? 'Responsável',
              isPrimary: resp.financeiro ?? false,
              notificacoes: resp.notificacoes ?? false,
              podeRetirar: resp.podeRetirar ?? false,
              createdAt: now,
            })
          }
        }
      }
    }
  }

  if (role === "TEACHER") {
    const teacherId = crypto.randomUUID()
    const { error: teacherError } = await supabase.from("teachers").insert({
      id: teacherId,
      userId: appUser.id,
      specialization: body?.specialization ?? null,
      degree: body?.degree ?? null,
      registrationNumber: body?.registrationNumber ?? null,
      hireDate: body?.hireDate ?? null,
      isActive,
      createdAt: now,
      updatedAt: now,
    })

    if (teacherError) {
      await cleanup()
      return json({ error: "failed_to_create_teacher_profile", details: teacherError.message }, 500)
    }

    const subjectIds = Array.isArray(body?.subjectIds)
      ? Array.from(new Set(body.subjectIds.map((value: string) => value?.trim()).filter(Boolean)))
      : []

    if (subjectIds.length > 0) {
      const payload = subjectIds.map((subjectId: string) => ({
        id: crypto.randomUUID(),
        teacherId,
        subjectId,
        createdAt: now,
        updatedAt: now,
      }))

      const { error: subjectsError } = await supabase.from("teacher_subjects").insert(payload)
      if (subjectsError) {
        await cleanup()
        return json({ error: "failed_to_link_teacher_subjects", details: subjectsError.message }, 500)
      }
    }
  }

  if (role === "PARENT") {
    const parentId = crypto.randomUUID()
    const { error: parentError } = await supabase.from("parents").insert({
      id: parentId,
      userId: appUser.id,
      occupation: body?.occupation ?? null,
      isActive,
      createdAt: now,
      updatedAt: now,
    })

    if (parentError) {
      await cleanup()
      return json({ error: "failed_to_create_parent_profile", details: parentError.message }, 500)
    }

    const linkedStudents = Array.isArray(body?.linkedStudents) ? body.linkedStudents : []

    if (linkedStudents.length > 0) {
      const payload = linkedStudents
        .filter((student: any) => student?.studentId)
        .map((student: any) => ({
          id: crypto.randomUUID(),
          parentId,
          studentId: student.studentId,
          relationship: student.relationship ?? "Responsável Legal",
          isPrimary: student.isPrimary ?? false,
          notificacoes: student.notificacoes ?? true,
          podeRetirar: student.podeRetirar ?? false,
          createdAt: now,
        }))

      if (payload.length > 0) {
        const { error: linksError } = await supabase.from("student_parents").insert(payload)
        if (linksError) {
          await cleanup()
          return json({ error: "failed_to_link_parent_students", details: linksError.message }, 500)
        }
      }
    }
  }

  return json({ user: appUser }, 201)
})
