import api from '@/lib/api';

export interface ParentStudent {
  student: {
    id: string;
    userId: string;
    registrationNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    isActive: boolean;
  };
  enrollments: Array<{
    id: string;
    class: {
      id: string;
      name: string;
      grade: string;
      section: string;
      course: {
        id: string;
        name: string;
      };
    };
  }>;
  subjectsCount: number;
  alerts: Array<{
    type: 'grade' | 'attendance';
    subjectName: string;
    value: string;
  }>;
  linkedAt: string;
}

class ParentsService {
  /**
   * Busca os filhos/alunos de um responsável
   */
  async getChildren(parentId: string): Promise<ParentStudent[]> {
    // O interceptor do cliente API já retorna response.data diretamente.
    // Desestruturar { data } aqui descartava a lista e fazia o portal exibir
    // "Nenhum filho cadastrado" mesmo quando o vínculo existia.
    const response = await api.get<ParentStudent[]>(`/parents/${parentId}/students`);
    return response as unknown as ParentStudent[];
  }

  /**
   * Busca dados de um responsável específico
   */
  async findOne(parentId: string) {
    const response = await api.get(`/parents/${parentId}`);
    return response as unknown;
  }
}

export const parentsService = new ParentsService();
