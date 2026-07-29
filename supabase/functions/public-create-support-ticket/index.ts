import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
}

type SupportImagePayload = {
  name?: string
  type?: string
  size?: number
  base64?: string
}

type CreateSupportTicketBody = {
  name?: string
  cpf?: string | null
  phone?: string | null
  email?: string
  description?: string
  requesterRole?: string | null
  source?: string | null
  images?: SupportImagePayload[]
}

type StoredAttachment = {
  path: string
  fileName: string
  contentType: string
  fileSize: number
}

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"])
const maxImageCount = 3
const maxImageBytes = 5 * 1024 * 1024

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  })
}

function normalizeString(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function sanitizeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
}

function decodeBase64(base64: string) {
  const cleanBase64 = base64.includes(",") ? base64.split(",").pop() ?? "" : base64
  const binary = atob(cleanBase64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405)
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "supabase_env_missing" }, 500)
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })

  try {
    const body = (await req.json()) as CreateSupportTicketBody
    const name = normalizeString(body?.name)
    const cpf = normalizeString(body?.cpf)
    const phone = normalizeString(body?.phone)
    const email = normalizeString(body?.email)?.toLowerCase() ?? ""
    const description = normalizeString(body?.description)
    const requesterRole = normalizeString(body?.requesterRole)
    const source = normalizeString(body?.source)
    const images = Array.isArray(body?.images) ? body.images : []

    if (!name) {
      return json({ error: "invalid_name", message: "Informe o nome para abrir o chamado." }, 400)
    }

    if (!email || !isEmail(email)) {
      return json({ error: "invalid_email", message: "Informe um email valido." }, 400)
    }

    if (!description || description.length < 10) {
      return json({ error: "invalid_description", message: "Descreva o problema com um pouco mais de detalhe." }, 400)
    }

    if (images.length > maxImageCount) {
      return json({ error: "too_many_images", message: "Envie no maximo 3 imagens por chamado." }, 400)
    }

    const ticketId = crypto.randomUUID()
    const uploadedPaths: string[] = []
    const attachments: StoredAttachment[] = []

    const { error: insertError } = await admin.from("support_tickets").insert({
      id: ticketId,
      status: "OPEN",
      name,
      cpf,
      phone,
      email,
      description,
      requesterRole,
      source,
      attachments: [],
    })

    if (insertError) {
      throw insertError
    }

    for (let index = 0; index < images.length; index += 1) {
      const image = images[index]
      const contentType = normalizeString(image?.type) ?? ""
      const rawFileName = normalizeString(image?.name) ?? `imagem-${index + 1}.png`
      const providedSize = image?.size ?? 0
      const base64 = normalizeString(image?.base64) ?? ""

      if (!allowedMimeTypes.has(contentType)) {
        throw new Error("Aceitamos apenas imagens JPG, PNG ou WEBP.")
      }

      if (!base64) {
        throw new Error("Uma das imagens enviadas esta vazia.")
      }

      const bytes = decodeBase64(base64)

      if (providedSize > maxImageBytes || bytes.byteLength > maxImageBytes) {
        throw new Error("Cada imagem pode ter no maximo 5MB.")
      }

      const safeFileName = sanitizeFileName(rawFileName || `imagem-${index + 1}`)
      const path = `${ticketId}/${Date.now()}-${index + 1}-${safeFileName}`

      const { error: uploadError } = await admin.storage
        .from("support-tickets")
        .upload(path, bytes, {
          contentType,
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      uploadedPaths.push(path)
      attachments.push({
        path,
        fileName: rawFileName,
        contentType,
        fileSize: bytes.byteLength,
      })
    }

    const { error: updateError } = await admin
      .from("support_tickets")
      .update({ attachments })
      .eq("id", ticketId)

    if (updateError) {
      throw updateError
    }

    return json({
      success: true,
      ticketId,
      message: "Chamado enviado com sucesso.",
    })
  } catch (error) {
    console.error("Erro ao criar chamado de suporte:", error)

    const message =
      error instanceof Error
        ? error.message
        : "Nao foi possivel abrir o chamado agora. Tente novamente."

    return json({ error: "support_ticket_creation_failed", message }, 400)
  }
})
