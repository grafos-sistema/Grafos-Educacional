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

function toIsoOrNull(value: unknown) {
  if (typeof value !== "string" || !value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
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
        inviteCode?: string
        firstName?: string
        lastName?: string
        requestedProfileType?: string | null
        cpf?: string | null
        phone?: string | null
        teacher?: { specialization?: string | null; degree?: string | null; registrationNumber?: string | null } | null
        student?: { registrationNumber?: string | null; enrollmentNumber?: string | null } | null
        parent?: { occupation?: string | null } | null
      }
    | null

  const inviteCode = body?.inviteCode?.trim()
  const firstName = body?.firstName?.trim()
  const lastName = body?.lastName?.trim()
  if (!inviteCode) return json({ error: "missing_inviteCode" }, 400)
  if (!firstName) return json({ error: "missing_firstName" }, 400)
  if (!lastName) return json({ error: "missing_lastName" }, 400)

  const { data: invite, error: inviteError } = await supabase
    .from("institution_invites")
    .select("*")
    .eq("code", inviteCode)
    .maybeSingle()

  if (inviteError) return json({ error: "failed_to_load_invite" }, 500)
  if (!invite) return json({ error: "invalid_invite" }, 404)
  if (!invite.isActive) return json({ error: "invite_inactive" }, 400)
  if (invite.usedAt) return json({ error: "invite_already_used" }, 400)

  const now = new Date()
  if (invite.expiresAt && new Date(invite.expiresAt).getTime() <= now.getTime()) {
    return json({ error: "invite_expired" }, 400)
  }

  const email = userData.user.email ?? null
  if (invite.email && email && invite.email.toLowerCase() !== email.toLowerCase()) {
    return json({ error: "invite_email_mismatch" }, 403)
  }
  if (invite.email && !email) return json({ error: "missing_user_email" }, 400)

  const institutionId = invite.institutionId as string
  const role = invite.role as string

  const { data: institution, error: institutionError } = await supabase
    .from("institutions")
    .select('id, "isActive"')
    .eq("id", institutionId)
    .maybeSingle()

  if (institutionError) return json({ error: "failed_to_load_institution" }, 500)
  if (!institution) return json({ error: "invalid_institution" }, 400)
  if (!institution.isActive) return json({ error: "institution_inactive" }, 400)

  const updatedAt = now.toISOString()
  const appUserId = userData.user.id
  const emailVerified = !!userData.user.email_confirmed_at

  const { data: userRow, error: upsertUserError } = await supabase
    .from("users")
    .upsert(
      {
        id: appUserId,
        auth_user_id: appUserId,
        email: email ?? `${appUserId}@no-email.local`,
        password: null,
        role,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        institutionId,
        requestedProfileType: body?.requestedProfileType ?? null,
        cpf: body?.cpf ?? null,
        phone: body?.phone ?? null,
        isActive: true,
        emailVerified,
        updatedAt,
      },
      { onConflict: "auth_user_id" },
    )
    .select("*")
    .single()

  if (upsertUserError) return json({ error: "failed_to_upsert_user", details: upsertUserError.message }, 500)

  await supabase
    .from("user_institutions")
    .upsert(
      {
        id: crypto.randomUUID(),
        userId: userRow.id,
        institutionId,
        isActive: true,
        isPrimary: true,
        updatedAt,
      },
      { onConflict: "userId,institutionId" },
    )

  if (role === "TEACHER") {
    const teacherPayload = {
      id: crypto.randomUUID(),
      userId: userRow.id,
      specialization: body?.teacher?.specialization ?? null,
      degree: body?.teacher?.degree ?? null,
      registrationNumber: body?.teacher?.registrationNumber ?? null,
      hireDate: toIsoOrNull(null),
      isActive: true,
      updatedAt,
    }
    const { error: teacherError } = await supabase.from("teachers").upsert(teacherPayload, { onConflict: "userId" })
    if (teacherError) return json({ error: "failed_to_upsert_teacher", details: teacherError.message }, 500)
  }

  if (role === "STUDENT") {
    const registrationNumber = body?.student?.registrationNumber?.trim() || `REG-${crypto.randomUUID()}`
    const studentPayload = {
      id: crypto.randomUUID(),
      userId: userRow.id,
      registrationNumber,
      enrollmentNumber: body?.student?.enrollmentNumber ?? null,
      isActive: true,
      updatedAt,
    }
    const { error: studentError } = await supabase.from("students").upsert(studentPayload, { onConflict: "userId" })
    if (studentError) return json({ error: "failed_to_upsert_student", details: studentError.message }, 500)
  }

  if (role === "PARENT") {
    const parentPayload = {
      id: crypto.randomUUID(),
      userId: userRow.id,
      occupation: body?.parent?.occupation ?? null,
      isActive: true,
      updatedAt,
    }
    const { error: parentError } = await supabase.from("parents").upsert(parentPayload, { onConflict: "userId" })
    if (parentError) return json({ error: "failed_to_upsert_parent", details: parentError.message }, 500)
  }

  const { error: markUsedError } = await supabase
    .from("institution_invites")
    .update({ usedAt: updatedAt, usedById: userRow.id, updatedAt })
    .eq("id", invite.id)

  if (markUsedError) return json({ error: "failed_to_mark_invite_used", details: markUsedError.message }, 500)

  return json({ user: userRow, role, institutionId })
})

