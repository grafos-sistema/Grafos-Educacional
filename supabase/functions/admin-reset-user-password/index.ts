import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
}

type ResetPasswordBody = {
  userId?: string
  newPassword?: string
}

type CallerRow = {
  id: string
  role: string
  institutionId?: string | null
  auth_user_id?: string | null
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

// ================================================================
// TENTATIVAS de encontrar o profile do caller no app.users:
//  1) auth_user_id = auth.user.id                (mais comum)
//  2) id = auth.user.id                          (fallback)
//  3) email = auth.user.email                    (última chance)
// ================================================================
async function loadCaller(
  supabase: ReturnType<typeof createClient>,
  authUser: { id: string; email?: string | undefined },
): Promise<CallerRow | null> {
  const cols = 'id, role, "institutionId", auth_user_id'

  // 1) auth_user_id
  const byAuthId = await supabase
    .from("users")
    .select(cols)
    .eq("auth_user_id", authUser.id)
    .maybeSingle()
  if (byAuthId.error) throw byAuthId.error
  if (byAuthId.data) return byAuthId.data as CallerRow

  // 2) id = auth_user_id
  const byId = await supabase
    .from("users")
    .select(cols)
    .eq("id", authUser.id)
    .maybeSingle()
  if (byId.error) throw byId.error
  if (byId.data) return byId.data as CallerRow

  // 3) email = auth email
  if (authUser.email) {
    const byEmail = await supabase
      .from("users")
      .select(cols)
      .eq("email", authUser.email.toLowerCase())
      .limit(1)
      .maybeSingle()
    if (byEmail.error) throw byEmail.error
    if (byEmail.data) return byEmail.data as CallerRow
  }

  return null
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

  const { data: authUserData, error: authUserError } = await supabase.auth.getUser(jwt)
  if (authUserError || !authUserData.user) return json({ error: "invalid_token" }, 401)

  let caller: CallerRow | null = null
  try {
    caller = await loadCaller(supabase, authUserData.user)
  } catch (loadErr: any) {
    return json({ error: "failed_to_load_profile", details: loadErr?.message ?? String(loadErr) }, 500)
  }

  if (!caller) {
    return json({
      error: "missing_profile",
      details: `Nenhum usuário encontrado na tabela public.users para auth_user_id=${authUserData.user.id} email=${authUserData.user.email ?? "(sem email)"}`,
      authUserId: authUserData.user.id,
      authEmail: authUserData.user.email ?? null,
    }, 409)
  }

  const isGlobal = caller.role === "SUPER_ADMIN_GLOBAL"
  const isLocal = caller.role === "SUPER_ADMIN"
  if (!isGlobal && !isLocal) {
    return json({
      error: "not_authorized",
      details: `Esperava SUPER_ADMIN ou SUPER_ADMIN_GLOBAL, recebeu '${caller.role}' (callerId ${caller.id}).`,
      authUserId: authUserData.user.id,
      callerInstitutionId: caller.institutionId ?? null,
      callerAuthUserId: (caller.auth_user_id as string | null | undefined) ?? null,
    }, 403)
  }

  const body = await req.json().catch(() => null) as ResetPasswordBody | null
  const userId = body?.userId?.trim()
  const newPassword = body?.newPassword?.trim()

  if (!userId) return json({ error: "missing_userId" }, 400)
  if (!newPassword) return json({ error: "missing_newPassword" }, 400)
  if (newPassword.length < 6) return json({ error: "invalid_new_password" }, 400)

  const { data: targetUser, error: targetUserError } = await supabase
    .from("users")
    .select('id, auth_user_id, role, email, "institutionId"')
    .eq("id", userId)
    .maybeSingle()

  if (targetUserError) return json({ error: "failed_to_load_target_user", details: targetUserError.message }, 500)
  if (!targetUser) return json({ error: "user_not_found", details: `userId ${userId} não existe em public.users.` }, 404)

  // ----------------------------------------------------------------
  // REGRA ESPECÍFICA: SUPER_ADMIN LOCAL SÓ PODE RESETAR USUÁRIOS
  // DA MESMA INSTITUIÇÃO (ou vinculada via user_institutions)
  // SUPER_ADMIN_GLOBAL PODE RESETAR QUALQUER UM.
  // ----------------------------------------------------------------
  if (isLocal) {
    const targetInstitutionId = (targetUser as any).institutionId as string | null | undefined
    const callerInstitutionId = caller.institutionId

    const sameInstitution =
      callerInstitutionId && targetInstitutionId && callerInstitutionId === targetInstitutionId

    const hasInstitutionLink = !!(
      callerInstitutionId && targetInstitutionId &&
      (
        await supabase
          .from("user_institutions")
          .select("id")
          .eq("userId", caller.id)
          .eq("institutionId", targetInstitutionId)
          .eq("isActive", true)
          .maybeSingle()
      ).data
    )

    if (!sameInstitution && !hasInstitutionLink) {
      return json({
        error: "not_authorized_for_institution",
        details: `Super Admin Local (callerId ${caller.id}) não tem vínculo com a instituição do usuário alvo (institutionId ${targetInstitutionId ?? "(null)"}).`,
      }, 403)
    }
  }

  if (!targetUser.auth_user_id) {
    return json({
      error: "target_user_missing_auth_id",
      details: `Usuário ${userId} existe em public.users mas NÃO tem auth_user_id vinculado. Ele não foi criado pela edge function admin-create-user.`,
    }, 409)
  }

  const { error: updateAuthError } = await supabase.auth.admin.updateUserById(targetUser.auth_user_id, {
    password: newPassword,
  })

  if (updateAuthError) {
    return json({ error: "failed_to_update_auth_user", details: updateAuthError.message }, 500)
  }

  return json({
    message: "Senha redefinida com sucesso.",
    debug: {
      targetRole: (targetUser as any).role ?? null,
      targetEmail: (targetUser as any).email ?? null,
      callerRole: caller.role,
    },
  })
})
