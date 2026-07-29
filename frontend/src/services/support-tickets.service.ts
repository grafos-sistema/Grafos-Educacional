import { supabase } from '@/lib/supabase';
import type {
  CreateSupportTicketInput,
  SupportTicket,
  SupportTicketAttachment,
} from '@/types/support-ticket.types';

type SupportTicketRow = Omit<SupportTicket, 'attachments'> & {
  attachments?: SupportTicketAttachment[] | null;
};

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
    const ticketId = crypto.randomUUID();

    let attachments;
    try {
      attachments = await Promise.all(
        (input.images ?? []).map(async (file, index) => {
          const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
          const path = `${ticketId}/${Date.now()}-${index + 1}.${extension}`;

          const { error: uploadError } = await supabase.storage
            .from('support-tickets')
            .upload(path, file, {
              contentType: file.type,
              upsert: false,
            });

          if (uploadError) {
            const normalizedMessage = uploadError.message.toLowerCase();
            if (normalizedMessage.includes('bucket not found')) {
              throw new Error('O bucket de suporte ainda nao existe no Supabase. Aplique a migration de suporte no Supabase remoto antes de testar o envio.');
            }
            throw uploadError;
          }

          return {
            path,
            fileName: file.name,
            contentType: file.type,
            fileSize: file.size,
          };
        })
      );
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Nao foi possivel enviar os anexos do chamado.');
    }

    const { error } = await supabase.from('support_tickets').insert({
      id: ticketId,
      status: 'OPEN',
      name: input.name,
      cpf: input.cpf || null,
      phone: input.phone || null,
      email: input.email,
      description: input.description,
      requesterRole: input.requesterRole || null,
      source: input.source || null,
      attachments,
    });

    if (error) {
      throw error;
    }

    return { message: 'Chamado enviado com sucesso.' };
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
