import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
}

type SyncParentsBody = {
  studentId: string
  institutionId: string
  responsaveis: any[]
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  })
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
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
      }
    )

    const body: SyncParentsBody = await req.json()
    const { studentId, institutionId, responsaveis } = body

    if (!studentId || !institutionId || !Array.isArray(responsaveis)) {
      return json({ error: "Parâmetros inválidos" }, 400)
    }

    const now = new Date().toISOString()

    // 1. Get all current parents for this student
    const { data: existingLinks } = await supabase
      .from("student_parents")
      .select("id, parentId")
      .eq("studentId", studentId)

    const currentLinkIds = new Set((existingLinks || []).map(link => link.id))

    // 2. Processar array de responsáveis
    for (const resp of responsaveis) {
      if (!resp.nome?.trim()) continue

      const nomeCompleto = resp.nome.trim()
      const primeiroNome = nomeCompleto.split(' ')[0]
      const ultimoNome = nomeCompleto.split(' ').slice(1).join(' ') || 'Responsável'

      let parentUserId: string | null = null
      let parentProfileId: string | null = null

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

          // Atualizar dados do responsável existente
          await supabase.from("users").update({
            name: nomeCompleto,
            firstName: primeiroNome,
            lastName: ultimoNome,
            phone: resp.celular ?? null,
            whatsapp: resp.whatsapp ?? null,
            updatedAt: now,
          }).eq('id', parentUserId)
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
          user_metadata: { fullName: nomeCompleto, temEmailReal },
        })

        if (pAuthError) {
           console.error("Erro ao criar Auth do Responsável (Sync):", pAuthError)
           return json({ error: `Erro na criação do Auth: ${pAuthError.message}` }, 500)
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
            emailVerified: temEmailReal,
            createdAt: now,
            updatedAt: now,
          })
        }
      }

      if (parentUserId) {
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

        // Verificar se o vínculo já existe
        const { data: existingLink } = await supabase
          .from("student_parents")
          .select("id")
          .eq("studentId", studentId)
          .eq("parentId", parentProfileId)
          .maybeSingle()

        if (existingLink) {
          // Atualizar vínculo existente
          await supabase.from("student_parents").update({
            relationship: resp.parentesco ?? 'Responsável',
            isPrimary: resp.financeiro ?? false,
            notificacoes: resp.notificacoes ?? false,
            podeRetirar: resp.podeRetirar ?? false,
          }).eq("id", existingLink.id)
          currentLinkIds.delete(existingLink.id)
        } else {
          // Criar novo vínculo
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

    // 3. Remove links that were deleted in the UI
    if (currentLinkIds.size > 0) {
      const idsToDelete = Array.from(currentLinkIds)
      await supabase.from("student_parents").delete().in("id", idsToDelete)
    }

    return json({ success: true }, 200)

  } catch (error: any) {
    console.error("Error in admin-sync-student-parents:", error)
    return json({ error: error.message }, 500)
  }
})
