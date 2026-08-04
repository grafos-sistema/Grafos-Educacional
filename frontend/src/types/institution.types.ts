export interface Institution {
  id: string;
  name: string;
  slug: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  numero?: string;
  complemento?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  logo?: string;
  isActive: boolean;
  units?: InstitutionUnit[];
  documents?: InstitutionDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface InstitutionUnit {
  id: string;
  institutionId: string;
  name: string;
  code?: string;
  slug?: string;
  type?: string;
  managerName?: string;
  directorUserId?: string;
  address?: string;
  numero?: string;
  complemento?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInstitutionUnitDto {
  id?: string;
  name: string;
  code?: string;
  slug?: string;
  type?: string;
  managerName?: string;
  directorUserId?: string;
  address?: string;
  numero?: string;
  complemento?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  isActive?: boolean;
}

export interface InstitutionDocument {
  id: string;
  institutionId: string;
  unitId?: string;
  type: string;
  title: string;
  filePath: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInstitutionDto {
  name: string;
  slug: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  numero?: string;
  complemento?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  logo?: string;
  isActive?: boolean;
  units?: CreateInstitutionUnitDto[];
}

export interface UpdateInstitutionDto {
  name?: string;
  slug?: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  numero?: string;
  complemento?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  logo?: string;
  isActive?: boolean;
  units?: CreateInstitutionUnitDto[];
}

export interface InstitutionFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}
