import { supabase } from '@/lib/supabase';
import type {
  CreateSupportTicketInput,
  SupportTicket,
  SupportTicketAttachment,
} from '@/types/support-ticket.types';

type SupportTicketRow = Omit<SupportTicket, 'attachments'> & {
  attachments?: SupportTicketAttachment[] | null;
};

async function fileToBase64(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';

  for (let offset = 0; offset < bytes.length; offset += 32_768) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 32_768));
  }

  return btoa(binary);
}

async function withSignedUrls(row: SupportTicketRow): Promise<SupportTicket> {
  const attachments = Array.isArray(row.attachments) ? row.attachments : [];
  const enrichedAttachments = await Promise.all(
    attachments.map(async (attachment) => {
      if (!attachment.path) return { ...attachment, signedUrl: null };

      const { data, error } = await supabase.storage
        .from('support-tickets')
        .createSignedUrl(attachment.path, 60 * 60);

      if (error) {
        return { ...attachment, signedUrl: null };
      }

      return { ...attachment, signedUrl: data.signedUrl };
    })
  );

  return {
    ...row,
    attachments: enrichedAttachments,
  };
}

export const supportTicketsService = {
  async createPublic(input: CreateSupportTicketInput) {
    const images = await Promise.all(
      (input.images ?? []).map(async (file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
        base64: await fileToBase64(file),
      })),
    );

    const { data, error } = await supabase.functions.invoke(
      'public-create-support-ticket',
      {
        body: {
          ...input,
          images,
        },
      },
    );

    if (error) {
      throw new Error(
        (data as { message?: string } | null)?.message ||
          'Não foi possível enviar o chamado agora. Tente novamente.',
      );
    }

    if (!(data as { success?: boolean } | null)?.success) {
      throw new Error(
        (data as { message?: string } | null)?.message ||
          'Não foi possível enviar o chamado agora. Tente novamente.',
      );
    }

    return data;
  },

  async listAll() {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      throw error;
    }

    return Promise.all(((data ?? []) as SupportTicketRow[]).map(withSignedUrls));
  },

  async resolve(ticketId: string, resolvedByUserId: string, resolutionNotes?: string) {
    const { data, error } = await supabase
      .from('support_tickets')
      .update({
        status: 'RESOLVED',
        resolvedAt: new Date().toISOString(),
        resolvedByUserId,
        resolutionNotes: resolutionNotes?.trim() || null,
      })
      .eq('id', ticketId)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return withSignedUrls(data as SupportTicketRow);
  },
};
