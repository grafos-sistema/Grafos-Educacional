export type SupportTicketStatus = 'OPEN' | 'RESOLVED';

export interface SupportTicketAttachment {
  path: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  signedUrl?: string | null;
}

export interface SupportTicket {
  id: string;
  status: SupportTicketStatus;
  name: string;
  cpf?: string | null;
  phone?: string | null;
  email: string;
  description: string;
  requesterRole?: string | null;
  source?: string | null;
  attachments: SupportTicketAttachment[];
  resolvedAt?: string | null;
  resolvedByUserId?: string | null;
  resolutionNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupportTicketInput {
  name: string;
  cpf?: string;
  phone?: string;
  email: string;
  description: string;
  requesterRole?: string;
  source?: string;
  images?: File[];
}
