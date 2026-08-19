import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

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

type PreparedImage = {
  bytes: Uint8Array
  contentType: string
  fileName: string
  fileSize: number
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
const maxRequestBytes = 18 * 1024 * 1024
const defaultAllowedOrigins = [
  "https://grafoseducacional.com.br",
  "https://www.grafoseducacional.com.br",
  "http://localhost:3000",
]

function allowedOrigins() {
  const configured = Deno.env.get("SUPPORT_ALLOWED_ORIGINS")
  return configured
    ? configured.split(",").map((value) => value.trim()).filter(Boolean)
    : defaultAllowedOrigins
}

function corsHeaders(origin: string | null) {
  const origins = allowedOrigins()
  return {
    "Access-Control-Allow-Origin": origin && origins.includes(origin) ? origin : origins[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  }
}

function json(data: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(origin),
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

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

function prepareImages(images: SupportImagePayload[]) {
  return images.map<PreparedImage>((image, index) => {
    const contentType = normalizeString(image?.type) ?? ""
    const fileName = normalizeString(image?.name) ?? `imagem-${index + 1}.png`
    const base64 = normalizeString(image?.base64) ?? ""

    if (!allowedMimeTypes.has(contentType)) {
      throw new Error("Aceitamos apenas imagens JPG, PNG ou WEBP.")
    }
    if (!base64) {
      throw new Error("Uma das imagens enviadas está vazia.")
    }

    const bytes = decodeBase64(base64)
    if ((image?.size ?? 0) > maxImageBytes || bytes.byteLength > maxImageBytes) {
      throw new Error("Cada imagem pode ter no máximo 5 MB.")
    }

    return { bytes, contentType, fileName, fileSize: bytes.byteLength }
  })
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin")
  const origins = allowedOrigins()

  if (origin && !origins.includes(origin)) {
    return new Response(JSON.stringify({ error: "origin_not_allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json", "Vary": "Origin" },
    })
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405, origin)
  }

  const contentLength = Number(req.headers.get("content-length") || 0)
  if (contentLength > maxRequestBytes) {
    return json({ error: "request_too_large", message: "Os anexos excedem o limite permitido." }, 413, origin)
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "service_unavailable", message: "O suporte está temporariamente indisponível." }, 503, origin)
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
      return json({ error: "invalid_name", message: "Informe o nome para abrir o chamado." }, 400, origin)
    }
    if (!email || !isEmail(email)) {
      return json({ error: "invalid_email", message: "Informe um e-mail válido." }, 400, origin)
    }
    if (!description || description.length < 10 || description.length > 10_000) {
      return json({ error: "invalid_description", message: "A descrição deve ter entre 10 e 10.000 caracteres." }, 400, origin)
    }
    if (images.length > maxImageCount) {
      return json({ error: "too_many_images", message: "Envie no máximo 3 imagens por chamado." }, 400, origin)
    }

    const preparedImages = prepareImages(images)
    const remoteAddress =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-real-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown"
    const rateKey = await sha256(`${remoteAddress}|${email}`)
    const { data: rateAllowed, error: rateError } = await admin.rpc(
      "claim_support_ticket_rate_limit",
      { p_key_hash: rateKey, p_window_seconds: 900, p_limit: 5 },
    )

    if (rateError) throw rateError
    if (!rateAllowed) {
      return json(
        { error: "rate_limited", message: "Muitas solicitações foram enviadas. Aguarde alguns minutos e tente novamente." },
        429,
        origin,
      )
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
    if (insertError) throw insertError

    try {
      for (let index = 0; index < preparedImages.length; index += 1) {
        const image = preparedImages[index]
        const safeFileName = sanitizeFileName(image.fileName) || `imagem-${index + 1}.png`
        const path = `${ticketId}/${Date.now()}-${index + 1}-${safeFileName}`
        const { error: uploadError } = await admin.storage
          .from("support-tickets")
          .upload(path, image.bytes, { contentType: image.contentType, upsert: false })

        if (uploadError) throw uploadError
        uploadedPaths.push(path)
        attachments.push({
          path,
          fileName: image.fileName,
          contentType: image.contentType,
          fileSize: image.fileSize,
        })
      }

      const { error: updateError } = await admin
        .from("support_tickets")
        .update({ attachments })
        .eq("id", ticketId)
      if (updateError) throw updateError
    } catch (error) {
      if (uploadedPaths.length > 0) {
        await admin.storage.from("support-tickets").remove(uploadedPaths)
      }
      await admin.from("support_tickets").delete().eq("id", ticketId)
      throw error
    }

    return json(
      { success: true, ticketId, message: "Chamado enviado com sucesso." },
      200,
      origin,
    )
  } catch (error) {
    console.error("Erro ao criar chamado de suporte:", error)
    return json(
      {
        error: "support_ticket_creation_failed",
        message: "Não foi possível abrir o chamado agora. Tente novamente em alguns instantes.",
      },
      500,
      origin,
    )
  }
})
