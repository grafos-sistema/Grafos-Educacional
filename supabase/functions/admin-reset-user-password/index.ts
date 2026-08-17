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

  const { data: caller, error: callerError } = await supabase
    .from("users")
    .select('id, role, "institutionId", auth_user_id')
    .eq("auth_user_id", authUserData.user.id)
    .maybeSingle()

  if (callerError) return json({ error: "failed_to_load_profile", details: callerError.message }, 500)
  if (!caller) {
    // Tentativa 2: talvez o auth_user_id nao esteja preenchido, use fallback por id
    const { data: fallbackCaller, error: fbErr } = await supabase
      .from("users")
      .select('id, role, "institutionId", auth_user_id')
      .eq("id", authUserData.user.id)
      .maybeSingle()
    if (fbErr) return json({ error: "failed_to_load_profile_fallback", details: fbErr.message }, 500)
    if (!fallbackCaller) return json({ error: "missing_profile", authUserId: authUserData.user.id }, 409)
    ;(caller as any) = fallbackCaller
  }

  if (caller.role !== "SUPER_ADMIN" && caller.role !== "SUPER_ADMIN_GLOBAL") {
    return json({
      error: "not_authorized",
      details: `Expected SUPER_ADMIN or SUPER_ADMIN_GLOBAL, got '${caller.role}' (callerId ${caller.id})`,
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
    .select('id, auth_user_id')
    .eq("id", userId)
    .maybeSingle()

  if (targetUserError) return json({ error: "failed_to_load_target_user", details: targetUserError.message }, 500)
  if (!targetUser?.auth_user_id) return json({ error: "user_not_found" }, 404)

  const { error: updateAuthError } = await supabase.auth.admin.updateUserById(targetUser.auth_user_id, {
    password: newPassword,
  })

  if (updateAuthError) {
    return json({ error: "failed_to_update_auth_user", details: updateAuthError.message }, 500)
  }

  return json({ message: "Senha redefinida com sucesso." })
})
