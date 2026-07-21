export interface Institution {
  id: string;
  name: string;
  slug: string;
  city?: string;
  state?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInstitutionDto {
  name: string;
  slug: string;
  city?: string;
  state?: string;
  isActive?: boolean;
}

export interface UpdateInstitutionDto {
  name?: string;
  slug?: string;
  city?: string;
  state?: string;
  isActive?: boolean;
}

export interface InstitutionFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}
