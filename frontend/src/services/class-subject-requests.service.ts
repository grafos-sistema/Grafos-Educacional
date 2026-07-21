import api from '@/lib/api';

export interface ClassSubjectRequest {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  message?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  classId: string;
  class: {
    id: string;
    name: string;
    grade: string;
    section?: string;
  };
  subjectId: string;
  subject: {
    id: string;
    name: string;
    code: string;
  };
  teacherId: string;
  teacher: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  reviewedById?: string;
  reviewedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateSubjectRequestDto {
  classId: string;
  subjectId: string;
  message?: string;
}

export interface RejectRequestDto {
  rejectionReason: string;
}

export interface ApproveRequestDto {
  weeklyHours?: number;
}

/**
 * Cria uma nova solicitação de disciplina (Professor)
 */
export const createSubjectRequest = async (
  data: CreateSubjectRequestDto
): Promise<ClassSubjectRequest> => {
  const response = await api.post('/class-subject-requests', data);
  return response.data;
};

/**
 * Lista solicitações de disciplinas com filtros
 */
export const listSubjectRequests = async (params?: {
  institutionId?: string;
  teacherId?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}): Promise<ClassSubjectRequest[]> => {
  const response = await api.get('/class-subject-requests', { params });
  return response.data;
};

/**
 * Busca uma solicitação por ID
 */
export const getSubjectRequestById = async (
  id: string
): Promise<ClassSubjectRequest> => {
  const response = await api.get(`/class-subject-requests/${id}`);
  return response.data;
};

/**
 * Aprova uma solicitação (Coordenador/Admin)
 */
export const approveSubjectRequest = async (
  id: string,
  data?: ApproveRequestDto
): Promise<ClassSubjectRequest> => {
  const response = await api.post(`/class-subject-requests/${id}/approve`, data);
  return response.data;
};

/**
 * Rejeita uma solicitação (Coordenador/Admin)
 */
export const rejectSubjectRequest = async (
  id: string,
  data: RejectRequestDto
): Promise<ClassSubjectRequest> => {
  const response = await api.post(`/class-subject-requests/${id}/reject`, data);
  return response.data;
};

/**
 * Cancela uma solicitação (Professor)
 */
export const cancelSubjectRequest = async (
  id: string
): Promise<void> => {
  await api.delete(`/class-subject-requests/${id}`);
};
