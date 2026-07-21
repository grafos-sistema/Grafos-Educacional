import api from '@/lib/api';

export interface IDEBTarget {
  id: string;
  year: number;
  gradeLevel: string;
  target: number;
  nationalTarget?: number;
  stateTarget?: number;
  createdAt: string;
  updatedAt: string;
  institutionId: string;
}

export interface IDEBIndicator {
  id: string;
  year: number;
  gradeLevel: string;
  approvalRate: number;
  dropoutRate: number;
  repetitionRate: number;
  averageProficiency: number;
  mathProficiency?: number;
  portugueseProficiency?: number;
  idebScore: number;
  totalStudents: number;
  evaluatedStudents: number;
  calculatedAt: string;
  createdAt: string;
  updatedAt: string;
  institutionId: string;
}

export interface IDEBComparison {
  gradeLevel: string;
  idebScore: number;
  target: number | null;
  nationalTarget: number | null;
  stateTarget: number | null;
  difference: number | null;
  percentageAchieved: number | null;
  achieved: boolean | null;
}

export interface IDEBDashboard {
  year: number;
  indicators: IDEBIndicator[];
  targets: IDEBTarget[];
  comparison: IDEBComparison[];
  summary: {
    averageIDEB: number;
    totalGradeLevels: number;
    targetsSet: number;
    targetsAchieved: number;
    achievementRate: number;
  };
}

export interface CreateIDEBTargetDto {
  year: number;
  gradeLevel: string;
  target: number;
  nationalTarget?: number;
  stateTarget?: number;
}

export interface UpdateIDEBTargetDto {
  target?: number;
  nationalTarget?: number;
  stateTarget?: number;
}

export interface CalculateIDEBDto {
  year: number;
  gradeLevel: string;
}

const idebService = {
  // Metas IDEB
  async createTarget(data: CreateIDEBTargetDto): Promise<IDEBTarget> {
    const response = await api.post('/ideb/targets', data);
    return response.data;
  },

  async getTargets(year?: number, gradeLevel?: string): Promise<IDEBTarget[]> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (gradeLevel) params.append('gradeLevel', gradeLevel);

    const response = await api.get(`/ideb/targets?${params.toString()}`);
    return response.data;
  },

  async getTarget(id: string): Promise<IDEBTarget> {
    const response = await api.get(`/ideb/targets/${id}`);
    return response.data;
  },

  async updateTarget(id: string, data: UpdateIDEBTargetDto): Promise<IDEBTarget> {
    const response = await api.put(`/ideb/targets/${id}`, data);
    return response.data;
  },

  async deleteTarget(id: string): Promise<void> {
    await api.delete(`/ideb/targets/${id}`);
  },

  // Indicadores IDEB
  async calculateIndicator(data: CalculateIDEBDto): Promise<IDEBIndicator> {
    const response = await api.post('/ideb/indicators/calculate', data);
    return response.data;
  },

  async getIndicators(year?: number, gradeLevel?: string): Promise<IDEBIndicator[]> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (gradeLevel) params.append('gradeLevel', gradeLevel);

    const response = await api.get(`/ideb/indicators?${params.toString()}`);
    return response.data;
  },

  async getIndicator(id: string): Promise<IDEBIndicator> {
    const response = await api.get(`/ideb/indicators/${id}`);
    return response.data;
  },

  // Análises e comparações
  async compareWithTargets(year: number): Promise<IDEBComparison[]> {
    const response = await api.get(`/ideb/compare/${year}`);
    return response.data;
  },

  async getHistoricalTrend(gradeLevel: string, limit = 10): Promise<IDEBIndicator[]> {
    const response = await api.get(`/ideb/trend/${gradeLevel}?limit=${limit}`);
    return response.data;
  },

  async getDashboard(year: number): Promise<IDEBDashboard> {
    const response = await api.get(`/ideb/dashboard/${year}`);
    return response.data;
  },
};

export default idebService;
