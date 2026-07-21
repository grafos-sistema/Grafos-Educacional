import api from '@/lib/api';

export interface ParentStudent {
  student: {
    id: string;
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
    const { data } = await api.get<ParentStudent[]>(`/parents/${parentId}/students`);
    return data;
  }

  /**
   * Busca dados de um responsável específico
   */
  async findOne(parentId: string) {
    const { data } = await api.get(`/parents/${parentId}`);
    return data;
  }
}

export const parentsService = new ParentsService();
