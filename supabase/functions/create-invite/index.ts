import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
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

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function generateInviteCode() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return bytesToHex(bytes)
}

function isAdminRole(role: string) {
  return role === "SUPER_ADMIN" || role === "INSTITUTION_ADMIN" || role === "COORDINATOR"
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

  const body = await req.json().catch(() => null) as
    | {
        institutionId?: string
        role?: string
        email?: string | null
        expiresAt?: string | null
      }
    | null

  const institutionId = body?.institutionId
  const role = body?.role
  if (!institutionId) return json({ error: "missing_institutionId" }, 400)
  if (!role) return json({ error: "missing_role" }, 400)

  const { data: appUser, error: appUserError } = await supabase
    .from("users")
    .select('id, role, "institutionId"')
    .eq("auth_user_id", userData.user.id)
    .maybeSingle()

  if (appUserError) return json({ error: "failed_to_load_profile" }, 500)
  if (!appUser) return json({ error: "missing_profile" }, 409)
  if (!isAdminRole(appUser.role)) return json({ error: "not_authorized" }, 403)

  let canAccess = appUser.role === "SUPER_ADMIN" || appUser.institutionId === institutionId
  if (!canAccess) {
    const { data: link, error: linkError } = await supabase
      .from("user_institutions")
      .select("id")
      .eq("userId", appUser.id)
      .eq("institutionId", institutionId)
      .eq("isActive", true)
      .maybeSingle()

    if (linkError) return json({ error: "failed_to_check_access" }, 500)
    canAccess = !!link
  }
  if (!canAccess) return json({ error: "not_authorized_for_institution" }, 403)

  const now = new Date().toISOString()
  const inviteCode = generateInviteCode()
  const expiresAt = body?.expiresAt ? new Date(body.expiresAt).toISOString() : null
  const email = body?.email ?? null

  const { data: invite, error: inviteError } = await supabase
    .from("institution_invites")
    .insert({
      id: crypto.randomUUID(),
      code: inviteCode,
      institutionId,
      role,
      email,
      expiresAt,
      usedAt: null,
      createdById: appUser.id,
      usedById: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
    .select("*")
    .single()

  if (inviteError) return json({ error: "failed_to_create_invite", details: inviteError.message }, 500)
  return json({ invite })
})

