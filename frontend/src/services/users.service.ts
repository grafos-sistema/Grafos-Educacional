import api from '@/lib/api';
import { fetchCurrentUserProfile } from '@/lib/auth-profile';
import { getValidInstitutionIds, isUuid } from '@/lib/institution-filter';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import {
  User,
  CreateUserDto,
  UpdateUserData,
  ChangePasswordData,
  AdminResetPasswordData,
  UserRole,
  ParentStudent,
  CreateParentStudentDto,
  UpdateParentStudentDto,
} from '@/types/user.types';
import { PaginatedResponse } from '@/types/common.types';
import {
  STUDENT_DOCUMENT_DEFINITIONS,
  type PendingStudentDocumentUpload,
  type StudentDocumentKey,
} from '@/types/student-document.types';

export interface UsersFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  institutionId?: string;
  isActive?: boolean;
  hasTeacherProfile?: boolean;
  hasStudentProfile?: boolean;
  hasParentProfile?: boolean;
  hasProfile?: boolean; // Filtro para usuários com/sem perfil
}

type AppUserRow = {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  cpf?: string | null;
  phone?: string | null;
  telefoneFixo?: string | null;
  birthDate?: string | null;
  gender?: User['gender'] | null;
  avatar?: string | null;
  address?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  socialName?: string | null;
  isActive: boolean;
  emailVerified: boolean;
  requestedProfileType?: string | null;
  institutionId?: string | null;
  createdAt: string;
  updatedAt: string;
};

type TeacherProfileRow = User['teacherProfile'];
type StudentProfileRow = User['studentProfile'];
type ParentProfileRow = User['parentProfile'];

type StudentParentRow = {
  id: string;
  parentId: string;
  studentId: string;
  relationship: string;
  isPrimary: boolean;
  createdAt: string;
};

const USER_BASE_COLUMNS =
  'id, email, role, firstName, lastName, cpf, phone, telefoneFixo, birthDate, gender, avatar, address, numero, complemento, bairro, city, state, zipCode, isActive, emailVerified, requestedProfileType, institutionId, createdAt, updatedAt, socialName';

const TEACHER_LIST_PROFILE_COLUMNS = 'id, userId, specialization, registrationNumber, isActive';
const STUDENT_LIST_PROFILE_COLUMNS = 'id, userId, registrationNumber, isActive';
const PARENT_LIST_PROFILE_COLUMNS = 'id, userId, occupation, isActive';
const STUDENT_DOCUMENT_BUCKET = 'student-documents';

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  const unmasked = value.replace(/[_.\-\/()\s]/g, '');
  return unmasked === '' ? null : value;
}

function isSupabaseFunctionHttpError(error: unknown): error is { context: Response } {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'context' in error &&
      (error as { context?: unknown }).context instanceof Response
  );
}

async function parseSupabaseFunctionError(error: { context: Response }) {
  const fallbackMessage = `Erro na função (${error.context.status}).`;

  try {
    const payload = await error.context.json();
    const details =
      typeof payload?.details === 'string'
        ? payload.details
        : typeof payload?.error === 'string'
          ? payload.error
          : fallbackMessage;

    switch (payload?.error) {
      case 'cpf_already_registered':
        return 'Já existe um usuário com este CPF na instituição selecionada.';
      case 'missing_profile':
        return 'Seu perfil administrativo não foi encontrado no Supabase.';
      case 'institution_not_found':
        return 'A instituição selecionada não foi encontrada.';
      case 'institution_inactive':
        return 'A instituição selecionada está inativa.';
      case 'not_authorized_for_institution':
        return 'Você não tem permissão para cadastrar usuário nesta instituição.';
      case 'failed_to_create_auth_user':
        return details;
      case 'user_not_found':
        return 'Usuário não encontrado no Supabase Auth.';
      case 'invalid_new_password':
        return 'A nova senha informada é inválida.';
      case 'missing_userId':
        return 'O usuário para redefinição de senha não foi informado.';
      case 'missing_newPassword':
        return 'Informe a nova senha para concluir a redefinição.';
      case 'not_authorized':
        return 'Você não tem permissão para executar esta ação.';
      case 'failed_to_update_auth_user':
        return details;
      default:
        return details;
    }
  } catch {
    return fallbackMessage;
  }
}
const STUDENT_DETAIL_PROFILE_COLUMNS = '*';

function mapUser(row: AppUserRow, extras?: Partial<User>): User {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    firstName: row.firstName,
    lastName: row.lastName,
    cpf: row.cpf ?? undefined,
    phone: row.phone ?? undefined,
    telefoneFixo: row.telefoneFixo ?? undefined,
    birthDate: row.birthDate ?? undefined,
    gender: row.gender ?? undefined,
    avatar: row.avatar ?? undefined,
    address: row.address ?? undefined,
    numero: row.numero ?? undefined,
    complemento: row.complemento ?? undefined,
    bairro: row.bairro ?? undefined,
    city: row.city ?? undefined,
    state: row.state ?? undefined,
    zipCode: row.zipCode ?? undefined,
    socialName: row.socialName ?? undefined,
    isActive: row.isActive,
    emailVerified: row.emailVerified,
    requestedProfileType: row.requestedProfileType ?? undefined,
    institutionId: row.institutionId ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    ...extras,
  };
}

function unionSets(...sets: Set<string>[]) {
  const result = new Set<string>();
  for (const set of sets) {
    for (const value of set) {
      result.add(value);
    }
  }
  return result;
}

function intersectSets(a: Set<string>, b: Set<string>) {
  const result = new Set<string>();
  for (const value of a) {
    if (b.has(value)) {
      result.add(value);
    }
  }
  return result;
}

function formatInFilter(ids: string[]) {
  return `(${ids.map((id) => `"${id}"`).join(',')})`;
}

async function getProfileUserIds(table: 'teachers' | 'students' | 'parents') {
  const { data, error } = await supabase.from(table).select('userId');
  if (error) throw error;
  return (data ?? []).map((row: any) => row.userId as string);
}

async function loadUserProfiles(
  userIds: string[],
  mode: 'summary' | 'detailed' = 'detailed'
) {
  if (userIds.length === 0) {
    return {
      teacherMap: new Map<string, NonNullable<User['teacherProfile']>>(),
      studentMap: new Map<string, NonNullable<User['studentProfile']>>(),
      parentMap: new Map<string, NonNullable<User['parentProfile']>>(),
    };
  }

  if (mode === 'summary') {
    const [teacherResult, studentResult, parentResult] = await Promise.all([
      supabase.from('teachers').select(TEACHER_LIST_PROFILE_COLUMNS).in('userId', userIds),
      supabase.from('students').select(STUDENT_LIST_PROFILE_COLUMNS).in('userId', userIds),
      supabase.from('parents').select(PARENT_LIST_PROFILE_COLUMNS).in('userId', userIds),
    ]);

    if (teacherResult.error) throw teacherResult.error;
    if (studentResult.error) throw studentResult.error;
    if (parentResult.error) throw parentResult.error;

    return {
      teacherMap: new Map(
        (teacherResult.data ?? []).map((row: any) => [row.userId as string, row as NonNullable<User['teacherProfile']>])
      ),
      studentMap: new Map(
        (studentResult.data ?? []).map((row: any) => [row.userId as string, row as NonNullable<User['studentProfile']>])
      ),
      parentMap: new Map(
        (parentResult.data ?? []).map((row: any) => [row.userId as string, row as NonNullable<User['parentProfile']>])
      ),
    };
  }

  const [teacherResult, studentResult, parentResult] = await Promise.all([
    supabase.from('teachers').select('*').in('userId', userIds),
    supabase.from('students').select(STUDENT_DETAIL_PROFILE_COLUMNS).in('userId', userIds),
    supabase.from('parents').select('*').in('userId', userIds),
  ]);

  if (teacherResult.error) throw teacherResult.error;
  if (studentResult.error) throw studentResult.error;
  if (parentResult.error) throw parentResult.error;

  const studentRows = (studentResult.data ?? []) as any[];
  const studentIds = studentRows.map((row) => row.id).filter(Boolean);

  const healthMap = new Map<string, any>();
  const transportMap = new Map<string, any>();
  const studentParentsMap = new Map<string, any[]>();

  if (studentIds.length > 0) {
    const [healthRes, transportRes, studentParentsRes] = await Promise.all([
      supabase.from('student_health_records').select('*').in('studentId', studentIds),
      supabase.from('student_transportation').select('*').in('studentId', studentIds),
      supabase
        .from('student_parents')
        .select(`
          id,
          studentId,
          parentId,
          relationship,
          isPrimary,
          isFinancialResponsible,
          receivesNotifications,
          canPickup,
          parents (
            id,
            userId,
            occupation,
            user:users (
              id,
              name,
              firstName,
              lastName,
              cpf,
              email,
              phone
            )
          )
        `)
        .in('studentId', studentIds),
    ]);

    if (healthRes.data) {
      for (const h of healthRes.data) {
        healthMap.set(h.studentId, h);
      }
    }
    if (transportRes.data) {
      for (const t of transportRes.data) {
        transportMap.set(t.studentId, t);
      }
    }
    if (studentParentsRes.data) {
      for (const sp of studentParentsRes.data) {
        const list = studentParentsMap.get(sp.studentId) || [];
        const parentUser = (sp as any).parents?.user;
        list.push({
          id: sp.id,
          studentId: sp.studentId,
          parentId: sp.parentId,
          relationship: sp.relationship,
          isPrimary: sp.isPrimary ?? (sp as any).isFinancialResponsible ?? false,
          receivesNotifications: sp.receivesNotifications ?? true,
          canPickup: sp.canPickup ?? false,
          user: parentUser,
        });
        studentParentsMap.set(sp.studentId, list);
      }
    }
  }

  return {
    teacherMap: new Map(
      (teacherResult.data ?? []).map((row: any) => [row.userId as string, row as NonNullable<User['teacherProfile']>])
    ),
    studentMap: new Map(
      studentRows.map((row: any) => {
        const studentProfile = {
          ...row,
          healthRecord: healthMap.get(row.id),
          transportation: transportMap.get(row.id),
          parents: studentParentsMap.get(row.id) || [],
        };
        return [row.userId as string, studentProfile as NonNullable<User['studentProfile']>];
      })
    ),
    parentMap: new Map(
      (parentResult.data ?? []).map((row: any) => [row.userId as string, row as NonNullable<User['parentProfile']>])
    ),
  };
}

async function mapUsers(
  rows: AppUserRow[],
  mode: 'summary' | 'detailed' = 'detailed'
) {
  const userIds = rows.map((row) => row.id);
  const { teacherMap, studentMap, parentMap } = await loadUserProfiles(userIds, mode);

  return rows.map((row) =>
    mapUser(row, {
      teacherProfile: teacherMap.get(row.id),
      studentProfile: studentMap.get(row.id),
      parentProfile: parentMap.get(row.id),
    })
  );
}

async function fetchUserFromSupabaseById(id: string): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .select(USER_BASE_COLUMNS)
    .eq('id', id)
    .single();

  if (error) throw error;

  const [mappedUser] = await mapUsers([data as AppUserRow], 'detailed');

  let institution: { id: string; name: string; slug: string } | null = null;

  if (mappedUser.institutionId) {
    const { data: institutionData, error: institutionError } = await supabase
      .from('institutions')
      .select('id, name, slug')
      .eq('id', mappedUser.institutionId)
      .maybeSingle();

    if (institutionError) throw institutionError;
    institution = institutionData;
  }

  return {
    ...mappedUser,
    ...(institution ? { institution } : {}),
  } as User;
}

function shouldUseSupabaseAsPrimarySource(_role?: UserRole) {
  // As telas administrativas precisam consultar a API, que aplica a
  // autorização por instituição. A leitura direta do Supabase é limitada
  // pelo RLS ao próprio usuário e faria as listas mostrarem apenas o Diretor.
  return false;
}

async function loadParentStudentLinks(
  rows: StudentParentRow[],
  relation: 'parent' | 'student'
): Promise<ParentStudent[]> {
  if (rows.length === 0) {
    return [];
  }

  if (relation === 'student') {
    const studentIds = Array.from(new Set(rows.map((row) => row.studentId)));
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, userId')
      .in('id', studentIds);

    if (studentsError) throw studentsError;

    const studentRows = students ?? [];
    const userIds = studentRows.map((row: any) => row.userId as string);
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(USER_BASE_COLUMNS)
      .in('id', userIds);

    if (usersError) throw usersError;

    const userMap = new Map((users ?? []).map((row: any) => [row.id as string, row as AppUserRow]));
    const studentMap = new Map(studentRows.map((row: any) => [row.id as string, row]));

    return rows.map((row) => {
      const student = studentMap.get(row.studentId);
      const user = student ? userMap.get(student.userId) : undefined;

      return {
        id: row.id,
        parentId: row.parentId,
        studentId: row.studentId,
        relationship: row.relationship,
        isPrimary: row.isPrimary,
        createdAt: row.createdAt,
        updatedAt: row.createdAt,
        student: student && user
          ? {
              id: student.id,
              userId: student.userId,
              user: mapUser(user),
            }
          : undefined,
      };
    });
  }

  const parentIds = Array.from(new Set(rows.map((row) => row.parentId)));
  const { data: parents, error: parentsError } = await supabase
    .from('parents')
    .select('id, userId')
    .in('id', parentIds);

  if (parentsError) throw parentsError;

  const parentRows = parents ?? [];
  const userIds = parentRows.map((row: any) => row.userId as string);
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select(USER_BASE_COLUMNS)
    .in('id', userIds);

  if (usersError) throw usersError;

  const userMap = new Map((users ?? []).map((row: any) => [row.id as string, row as AppUserRow]));
  const parentMap = new Map(parentRows.map((row: any) => [row.id as string, row]));

  return rows.map((row) => {
    const parent = parentMap.get(row.parentId);
    const user = parent ? userMap.get(parent.userId) : undefined;

    return {
      id: row.id,
      parentId: row.parentId,
      studentId: row.studentId,
      relationship: row.relationship,
      isPrimary: row.isPrimary,
      createdAt: row.createdAt,
      updatedAt: row.createdAt,
      parent: parent && user
        ? {
            id: parent.id,
            userId: parent.userId,
            user: mapUser(user),
          }
        : undefined,
    };
  });
}

export const usersService = {
  /**
   * Listar todos os usuÃ¡rios com paginaÃ§Ã£o e filtros
   */
  async findAll(params: UsersFilterParams = {}): Promise<PaginatedResponse<User>> {
    const viewer = useAuthStore.getState().user;
    const viewerRole = (viewer?.activeProfile ?? viewer?.role) as UserRole | undefined;
    const excludeGlobalAdmins = viewerRole === UserRole.SUPER_ADMIN_GLOBAL;
    const useSupabaseAsPrimary = shouldUseSupabaseAsPrimarySource(viewerRole);

    const apiParams = new URLSearchParams();
    if (params.page) apiParams.append('page', String(params.page));
    if (params.limit) apiParams.append('limit', String(params.limit));
    if (params.search) apiParams.append('search', params.search);
    if (params.role) apiParams.append('role', params.role);
    if (typeof params.isActive === 'boolean') apiParams.append('isActive', String(params.isActive));
    if (typeof params.hasTeacherProfile === 'boolean') {
      apiParams.append('hasTeacherProfile', String(params.hasTeacherProfile));
    }
    if (typeof params.hasStudentProfile === 'boolean') {
      apiParams.append('hasStudentProfile', String(params.hasStudentProfile));
    }
    if (typeof params.hasParentProfile === 'boolean') {
      apiParams.append('hasParentProfile', String(params.hasParentProfile));
    }
    if (typeof params.hasProfile === 'boolean') {
      apiParams.append('hasProfile', String(params.hasProfile));
    }

    const { institutionFilterAll, institutionFilterIds, institutionUnitFilterId } =
      useAuthStore.getState();
    const effectiveIds = institutionFilterAll ? [] : getValidInstitutionIds(institutionFilterIds);

    if (effectiveIds.length > 1) {
      apiParams.append('institutionIds', effectiveIds.join(','));
    } else if (effectiveIds.length === 1) {
      apiParams.append('institutionId', effectiveIds[0]);
    } else if (isUuid(params.institutionId)) {
      apiParams.append('institutionId', params.institutionId);
    }

    if (!useSupabaseAsPrimary) {
      try {
        const response = await api.get<PaginatedResponse<User>>(`/users?${apiParams.toString()}`, {
          headers: { 'x-skip-error-toast': '1' },
        });
        const payload = response as unknown as PaginatedResponse<User>;
        if (!excludeGlobalAdmins) {
          return payload;
        }

        const filtered = payload.data.filter((item) => item.role !== UserRole.SUPER_ADMIN_GLOBAL);
        return {
          ...payload,
          data: filtered,
          meta: {
            ...payload.meta,
            total: Math.max(0, payload.meta.total - (payload.data.length - filtered.length)),
          },
        };
      } catch (error) {
        // A API é a fonte oficial das listagens administrativas. Não faça
        // fallback silencioso para o Supabase, pois o RLS direto pode
        // devolver apenas o usuário autenticado e mascarar um erro real do
        // Railway como uma lista vazia/incompleta.
        console.error('[usersService.findAll] Falha ao listar usuários pela API', error);
        throw error;
      }
    }

    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const needsProfileIds =
      params.hasProfile !== undefined ||
      params.hasTeacherProfile !== undefined ||
      params.hasStudentProfile !== undefined ||
      params.hasParentProfile !== undefined;

    let teacherSet = new Set<string>();
    let studentSet = new Set<string>();
    let parentSet = new Set<string>();

    if (needsProfileIds) {
      const [teacherIds, studentIds, parentIds] = await Promise.all([
        getProfileUserIds('teachers'),
        getProfileUserIds('students'),
        getProfileUserIds('parents'),
      ]);

      teacherSet = new Set(teacherIds);
      studentSet = new Set(studentIds);
      parentSet = new Set(parentIds);
    }

    let includeIds: Set<string> | null = null;
    const excludeIds = new Set<string>();

    const effectiveInstitutionIds = effectiveIds;
    const effectiveUnitId = institutionUnitFilterId;

    if (params.hasProfile === true) {
      includeIds = unionSets(teacherSet, studentSet, parentSet);
    } else if (params.hasProfile === false) {
      for (const id of unionSets(teacherSet, studentSet, parentSet)) {
        excludeIds.add(id);
      }
    }

    if (params.hasTeacherProfile === true) {
      includeIds = includeIds ? intersectSets(includeIds, teacherSet) : new Set(teacherSet);
    } else if (params.hasTeacherProfile === false) {
      for (const id of teacherSet) excludeIds.add(id);
    }

    if (params.hasStudentProfile === true) {
      includeIds = includeIds ? intersectSets(includeIds, studentSet) : new Set(studentSet);
    } else if (params.hasStudentProfile === false) {
      for (const id of studentSet) excludeIds.add(id);
    }

    if (params.hasParentProfile === true) {
      includeIds = includeIds ? intersectSets(includeIds, parentSet) : new Set(parentSet);
    } else if (params.hasParentProfile === false) {
      for (const id of parentSet) excludeIds.add(id);
    }

    if (includeIds && includeIds.size === 0) {
      return {
        data: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: page > 1,
        },
      };
    }

    if (effectiveUnitId) {
      const primaryUserIds: string[] = [];
      const { data: unitDirectorRows, error: unitDirectorError } = await supabase
        .from('institution_units')
        .select('directorUserId')
        .eq('id', effectiveUnitId)
        .eq('isActive', true);

      if (unitDirectorError) throw unitDirectorError;

      for (const row of unitDirectorRows ?? []) {
        const directorUserId = (row as any).directorUserId as string | undefined | null;
        if (directorUserId) primaryUserIds.push(directorUserId);
      }

      let unitUserIds = new Set<string>(primaryUserIds);

      try {
        const { data: unitRows } = await supabase
          .from('user_units')
          .select('userId')
          .eq('unitId', effectiveUnitId)
          .eq('isActive', true);

        for (const row of unitRows ?? []) {
          const uid = (row as any).userId as string | undefined;
          if (uid) unitUserIds.add(uid);
        }
      } catch (_error) {
        // Ignore missing relation table
      }

      if (unitUserIds.size === 0) {
        return {
          data: [],
          meta: {
            total: 0,
            page,
            limit,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: page > 1,
          },
        };
      }

      includeIds = includeIds ? intersectSets(includeIds, unitUserIds) : unitUserIds;

      if (includeIds.size === 0) {
        return {
          data: [],
          meta: {
            total: 0,
            page,
            limit,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: page > 1,
          },
        };
      }
    }

    let query = supabase
      .from('users')
      .select(USER_BASE_COLUMNS, { count: 'exact' })
      .order('createdAt', { ascending: false })
      .range(from, to);

    if (excludeGlobalAdmins) {
      query = query.neq('role', UserRole.SUPER_ADMIN_GLOBAL);
    }

    if (params.search) {
      const sanitized = params.search.replace(/,/g, ' ').trim();
      query = query.or(
        `email.ilike.%${sanitized}%,firstName.ilike.%${sanitized}%,lastName.ilike.%${sanitized}%,cpf.ilike.%${sanitized}%`
      );
    }

    if (params.role) query = query.eq('role', params.role);
    if (params.institutionId) {
      query = query.eq('institutionId', params.institutionId);
    } else if (effectiveInstitutionIds.length === 1) {
      query = query.eq('institutionId', effectiveInstitutionIds[0]);
    } else if (effectiveInstitutionIds.length > 1) {
      query = query.in('institutionId', effectiveInstitutionIds);
    }
    if (typeof params.isActive === 'boolean') query = query.eq('isActive', params.isActive);
    if (includeIds) query = query.in('id', Array.from(includeIds));
    if (excludeIds.size > 0) {
      query = query.not('id', 'in', formatInFilter(Array.from(excludeIds)));
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const users = await mapUsers((data ?? []) as AppUserRow[], 'summary');
    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  },

  /**
   * Buscar usuÃ¡rio por ID
   */
  async findOne(id: string): Promise<User> {
    const viewer = useAuthStore.getState().user;
    const viewerRole = (viewer?.activeProfile ?? viewer?.role) as UserRole | undefined;

    if (!shouldUseSupabaseAsPrimarySource(viewerRole)) {
      try {
        const response = await api.get<User>(`/users/${id}`, {
          headers: { 'x-skip-error-toast': '1' },
        });
        return response as unknown as User;
      } catch (apiError) {
        try {
          return await fetchUserFromSupabaseById(id);
        } catch {
          throw apiError;
        }
      }
    }

    return fetchUserFromSupabaseById(id);
  },

  /**
   * Criar novo usuÃ¡rio
   */
  async create(data: CreateUserDto): Promise<User> {
    try {
      // Converte strings vazias ou apenas com caracteres de máscara para null para evitar erros de UNIQUE constraint
      const sanitizedData = Object.keys(data).reduce((acc, key) => {
        const val = normalizeOptionalString((data as any)[key]);
        (acc as any)[key] = val;
        return acc;
      }, {} as any);

      const { data: result, error } = await supabase.functions.invoke('admin-create-user', {
        body: sanitizedData,
      });

      if (error) {
        if (isSupabaseFunctionHttpError(error)) {
          const functionMessage = await parseSupabaseFunctionError(error);
          throw new Error(functionMessage);
        }
        throw error;
      }

      // A Edge Function cria o usuário com a service role e já devolve a linha
      // criada. Não faça uma nova consulta em public.users aqui: o RLS permite
      // que cada usuário leia apenas o próprio registro, então o cadastro feito
      // por um diretor para outra pessoa pode retornar PGRST116/406 mesmo tendo
      // sido concluído com sucesso.
      const createdUser = (result as { user?: AppUserRow | null } | null)?.user;
      if (!createdUser?.id) {
        throw new Error('Resposta inválida ao criar usuário');
      }

      return mapUser({
        ...createdUser,
        // A função sempre define estes campos, mesmo sem repetir todas as
        // colunas de public.users na resposta compacta.
        firstName: createdUser.firstName ?? '',
        lastName: createdUser.lastName ?? '',
        isActive: createdUser.isActive ?? true,
        emailVerified: createdUser.emailVerified ?? true,
        requestedProfileType: createdUser.requestedProfileType ?? null,
        createdAt: createdUser.createdAt ?? new Date().toISOString(),
        updatedAt: createdUser.updatedAt ?? new Date().toISOString(),
      });
    } catch (error) {
      if (isSupabaseFunctionHttpError(error) || error instanceof Error) {
        throw error;
      }
      const response = await api.post<User>('/users', data);
      return response as unknown as User;
    }
  },

  /**
   * Atualizar usuÃ¡rio
   */
  async update(id: string, data: UpdateUserData): Promise<User> {
    const {
      institutionId,
      institutionIds,
      specialization,
      degree,
      registrationNumber,
      hireDate,
      occupation,
      subjectIds,
      linkedStudents,
      // Student profile fields
      situacao,
      escola,
      unidade,
      anoLetivo,
      curso,
      serie,
      turma,
      modalidade,
      turno,
      dataMatricula,
      observacoes,

      // Health
      healthInfo,

      // Transportation
      transportInfo,
      
      // Responsaveis
      responsaveis,
      documents,

      // The rest goes to users
      ...userData
    } = data;

    const readonlyColumns = ['id', 'createdAt', 'updatedAt'];
    const validUsersColumns = USER_BASE_COLUMNS.split(',').map((c) => c.trim());
    const filteredUserData = Object.keys(userData)
      .filter(
        (key) =>
          validUsersColumns.includes(key) &&
          !readonlyColumns.includes(key) &&
          key !== 'password'
      )
      .reduce<Record<string, any>>((obj, key) => {
        const val = normalizeOptionalString((userData as any)[key]);
        if (key === 'birthDate') {
          if (typeof val === 'string' && val.trim()) {
            const trimmed = val.trim();
            if (trimmed.includes('/')) {
              const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
              obj[key] = match ? `${match[3]}-${match[2]}-${match[1]}` : trimmed;
            } else if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
              obj[key] = trimmed.split('T')[0];
            } else {
              obj[key] = trimmed;
            }
          } else {
            obj[key] = null;
          }
        } else if (key === 'gender') {
          const normalizedGender = typeof val === 'string' ? val : '';
          obj[key] = ['MALE', 'FEMALE', 'OTHER', 'NOT_INFORMED'].includes(normalizedGender)
            ? normalizedGender
            : null;
        } else if (key === 'state') {
          if (typeof val === 'string' && val.trim()) {
            const uf = val.trim().toUpperCase().slice(0, 2);
            obj[key] = /^[A-Z]{2}$/.test(uf) ? uf : null;
          } else {
            obj[key] = null;
          }
        } else {
          obj[key] = val;
        }
        return obj;
      }, {});

    const apiPayload = {
      ...filteredUserData,
      ...(institutionId !== undefined ? { institutionId } : {}),
      ...(institutionIds !== undefined ? { institutionIds } : {}),
    };

    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug('[usersService.update] Payload enviado para a API:', {
        userId: id,
        columns: Object.keys(apiPayload),
        birthDate_in: (apiPayload as any).birthDate ?? null,
        state_in: (apiPayload as any).state ?? null,
      });
    }

    await api.patch<User>(`/users/${id}`, apiPayload, {
      headers: { 'x-skip-error-toast': '1' },
    });

    const user = await usersService.findOne(id);

    if (user.role === 'TEACHER') {
      const teacherPayload = {
        specialization: normalizeOptionalString(specialization) ?? null,
        degree: normalizeOptionalString(degree) ?? null,
        registrationNumber: normalizeOptionalString(registrationNumber) ?? null,
        hireDate: normalizeOptionalString(hireDate) ?? null,
        isActive: filteredUserData.isActive ?? user.isActive,
        updatedAt: new Date().toISOString(),
      };

      if (user.teacherProfile) {
        const { error: teacherUpdateError } = await supabase
          .from('teachers')
          .update(teacherPayload)
          .eq('id', user.teacherProfile.id);

        if (teacherUpdateError) throw teacherUpdateError;
      } else {
        const { error: teacherInsertError } = await supabase
          .from('teachers')
          .insert({
            id: crypto.randomUUID(),
            userId: id,
            ...teacherPayload,
            createdAt: new Date().toISOString(),
          });

        if (teacherInsertError) throw teacherInsertError;
      }

      const refreshedUser = await usersService.findOne(id);
      // `subjectIds` é opcional no modo de edição. Quando o solicitante é
      // Diretor, os vínculos professor-disciplina ficam apenas para consulta;
      // não sincronize com [] e não tente apagar vínculos por engano.
      if (refreshedUser.teacherProfile && subjectIds !== undefined) {
        await import('@/services/teacher-subjects.service').then(({ teacherSubjectsService }) =>
          teacherSubjectsService.syncTeacherSubjects(refreshedUser.teacherProfile!.id, subjectIds ?? [])
        );
      }
    }

    if (user.role === 'PARENT') {
      const now = new Date().toISOString();
      if (user.parentProfile) {
        const { error: parentUpdateError } = await supabase
          .from('parents')
          .update({ occupation: occupation ?? null, isActive: filteredUserData.isActive ?? user.isActive, updatedAt: now })
          .eq('id', user.parentProfile.id);

        if (parentUpdateError) throw parentUpdateError;

        const { error: deleteLinksError } = await supabase
          .from('student_parents')
          .delete()
          .eq('parentId', user.parentProfile.id);

        if (deleteLinksError) throw deleteLinksError;

        if (Array.isArray(linkedStudents) && linkedStudents.length > 0) {
          const payload = linkedStudents
            .filter((item) => item.studentId)
            .map((item) => ({
              id: crypto.randomUUID(),
              parentId: user.parentProfile!.id,
              studentId: item.studentId,
              relationship: item.relationship ?? 'Responsável Legal',
              isPrimary: item.isPrimary ?? false,
              notificacoes: item.notificacoes ?? true,
              podeRetirar: item.podeRetirar ?? false,
              createdAt: now,
            }));

          if (payload.length > 0) {
            const { error: insertLinksError } = await supabase.from('student_parents').insert(payload);
            if (insertLinksError) throw insertLinksError;
          }
        }
      }
    }

    if (user.role === 'STUDENT' && user.studentProfile) {
      const studentId = user.studentProfile.id;

      // Update student profile
      const { error: studentUpdateError } = await supabase
        .from('students')
        .update({
          situacao,
          escola,
          unidade,
          anoLetivo,
          curso,
          serie,
          turma,
          modalidade,
          turno,
          enrollmentDate: dataMatricula || user.studentProfile.enrollmentDate,
          observacoes,
        })
        .eq('id', studentId);

      if (studentUpdateError) throw studentUpdateError;

      // Update health record if healthInfo is provided
      if (healthInfo && Object.keys(healthInfo).length > 0) {
        const { error: healthError } = await supabase
          .from('student_health_records')
          .upsert({
            studentId: studentId,
            ...healthInfo,
          }, { onConflict: 'studentId' });
        if (healthError) throw healthError;
      }

      // Update transportation if transportInfo is provided
      if (transportInfo && Object.keys(transportInfo).length > 0) {
        const { error: transportError } = await supabase
          .from('student_transportation')
          .upsert({
            studentId: studentId,
            ...transportInfo,
          }, { onConflict: 'studentId' });
        if (transportError) throw transportError;
      }

      // Sync responsaveis
      if (responsaveis && Array.isArray(responsaveis)) {
        const { data: syncData, error: syncError } = await supabase.functions.invoke('admin-sync-student-parents', {
          body: {
            studentId,
            institutionId: user.institutionId,
            responsaveis,
          },
        });
        
        if (syncError) {
          let errorBody = "";
          try {
            if (syncError.context && typeof syncError.context.json === 'function') {
              const errData = await syncError.context.json();
              errorBody = errData.error || JSON.stringify(errData);
            }
          } catch (e) {}
          
          console.error("Failed to sync responsaveis:", syncError, errorBody);
          throw new Error("Falha ao sincronizar responsáveis: " + (errorBody || syncError.message || JSON.stringify(syncError)));
        }
        if (syncData?.error) {
          console.error("Function returned error:", syncData.error);
          throw new Error("Erro na função: " + syncData.error);
        }
      }
    }

    return usersService.findOne(id);
  },

  /**
   * Remover usuÃ¡rio (soft delete)
   */
  async remove(id: string): Promise<User> {
    const response = await api.delete<User>(`/users/${id}`);
    return response as unknown as User;
  },

  /**
   * Excluir usuário permanentemente
   */
  async removePermanently(id: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/users/${id}/permanent`);
    return response as unknown as { message: string };
  },

  /**
   * Alterar senha do usuÃ¡rio
   */
  async changePassword(id: string, data: ChangePasswordData): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(`/users/${id}/change-password`, data);
    return response as unknown as { message: string };
  },

  async adminResetPassword(id: string, data: AdminResetPasswordData): Promise<{ message: string }> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      throw new Error('Sessão do Supabase não encontrada ou expirada. Faça login novamente.');
    }

    const { data: result, error } = await supabase.functions.invoke('admin-reset-user-password', {
      body: {
        userId: id,
        newPassword: data.newPassword,
      },
      // Deixa explícito que a Edge Function deve autorizar o usuário atual,
      // evitando qualquer ambiguidade com tokens armazenados por integrações.
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      if (isSupabaseFunctionHttpError(error)) {
        const status = error.context.status;
        let payload: any = null;
        try {
          payload = await error.context.clone().json();
        } catch (_) {
          // ignore
        }
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.error('[usersService.adminResetPassword] HTTP error context:', {
            status,
            payload,
          });
        }

        // Mensagem amigável para erro de permissão
        if (status === 403) {
          const errCode = payload && typeof payload.error === 'string' ? payload.error : '';
          const details = payload && typeof payload.details === 'string' ? payload.details : '';

          if (errCode === 'not_authorized') {
            throw new Error(
              `Apenas Super Admin Global pode resetar senhas. ${details}`
            );
          }
          if (errCode === 'missing_profile') {
            throw new Error(
              `Seu usuário autenticado não tem perfil vinculado no banco. ${details}`
            );
          }
          if (errCode === 'target_user_missing_auth_id') {
            throw new Error(
              `O usuário alvo não tem auth_user_id vinculado (não foi criado pela nova edge function). ${details}`
            );
          }
          const generic =
            status === 403
              ? `Você não tem permissão para resetar esta senha.${details ? ` Detalhes: ${details}` : ''}`
              : `HTTP ${status} na função admin-reset-user-password.${details ? ` Detalhes: ${details}` : ''}`;
          throw new Error(generic);
        }

        const functionMessage = await parseSupabaseFunctionError(error);
        const contextMsg =
          payload && typeof payload.error === 'string'
            ? ` (${payload.error}${payload.details ? ` — ${payload.details}` : ''})`
            : '';
        throw new Error(functionMessage + contextMsg);
      }
      throw error;
    }

    return { message: (result as { message?: string } | null)?.message ?? 'Senha redefinida com sucesso.' };
  },

  /**
   * Upload de avatar
   */
  async uploadAvatar(id: string, file: File): Promise<{ message: string; avatar: string }> {
    const profile = await fetchCurrentUserProfile();

    if (profile.id === id) {
      const safeFileName = sanitizeFileName(file.name || 'avatar.file');
      const basePath = profile.institutionId ? `institutions/${profile.institutionId}` : 'global';
      const storagePath = `${basePath}/users/${id}/avatar-${Date.now()}-${safeFileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(storagePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || undefined,
      });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl: avatarUrl },
      } = supabase.storage.from('avatars').getPublicUrl(storagePath);

      const { error: updateError } = await supabase
        .from('users')
        .update({
          avatar: avatarUrl,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      return { message: 'Avatar atualizado com sucesso', avatar: avatarUrl };
    }

    const formData = new FormData();
    formData.append('avatar', file);

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    const response = await api.post<{ message: string; avatar: string }>(
      `/users/${id}/avatar`,
      formData,
      accessToken
        ? {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'x-skip-error-toast': '1',
            },
          }
        : { headers: { 'x-skip-error-toast': '1' } }
    );

    // Avatares de terceiros precisam passar pelo backend, que usa a credencial
    // administrativa do Storage. O cliente não pode fazer fallback para gravar
    // diretamente no caminho de outro usuário, pois a política RLS bloqueia isso.
    return response as unknown as { message: string; avatar: string };
  },

  async uploadStudentDocument(
    studentProfileId: string,
    documentType: StudentDocumentKey,
    file: File
  ): Promise<PendingStudentDocumentUpload[]> {
    const definition = STUDENT_DOCUMENT_DEFINITIONS.find((item) => item.key === documentType);
    if (!definition) {
      throw new Error('Tipo de documento inválido.');
    }

    const { data: studentRow, error: studentError } = await supabase
      .from('students')
      .select('id, documents')
      .eq('id', studentProfileId)
      .single();

    if (studentError) throw studentError;

    const existingDocuments = Array.isArray(studentRow.documents)
      ? (studentRow.documents as PendingStudentDocumentUpload[])
      : [];
    const existingDocument = existingDocuments.find((item) => item.key === documentType);

    const safeFileName = sanitizeFileName(file.name || `${documentType}.file`);
    const storagePath = `${studentProfileId}/${documentType}-${Date.now()}-${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from(STUDENT_DOCUMENT_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || undefined,
      });

    if (uploadError) {
      throw uploadError;
    }

    if (existingDocument?.path) {
      await supabase.storage.from(STUDENT_DOCUMENT_BUCKET).remove([existingDocument.path]);
    }

    const nextDocument: PendingStudentDocumentUpload = {
      key: documentType,
      label: definition.label,
      fileName: file.name,
      path: storagePath,
      mimeType: file.type || undefined,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      status: 'UPLOADED',
    };

    const nextDocuments = [
      ...existingDocuments.filter((item) => item.key !== documentType),
      nextDocument,
    ];

    const { error: updateError } = await supabase
      .from('students')
      .update({
        documents: nextDocuments.map(({ file: _file, ...document }) => document),
      })
      .eq('id', studentProfileId);

    if (updateError) {
      if (
        typeof updateError === 'object' &&
        updateError !== null &&
        'code' in updateError &&
        updateError.code === 'PGRST204'
      ) {
        throw new Error(
          'A estrutura de documentos do aluno ainda nao foi aplicada no Supabase. Atualize as migrations do banco para liberar os anexos.'
        );
      }

      throw updateError;
    }

    return nextDocuments;
  },

  async uploadStudentDocuments(
    studentProfileId: string,
    documents: PendingStudentDocumentUpload[]
  ): Promise<PendingStudentDocumentUpload[]> {
    let currentDocuments: PendingStudentDocumentUpload[] = [];

    for (const document of documents) {
      if (!document.file || !document.key) continue;
      currentDocuments = await this.uploadStudentDocument(studentProfileId, document.key, document.file);
    }

    return currentDocuments;
  },

  /**
   * Obter perfil do usuÃ¡rio autenticado
   */
  async getProfile(): Promise<User> {
    return fetchCurrentUserProfile();
  },

  /**
   * Listar relacionamentos de um pai (seus filhos)
   */
  async getParentChildren(parentId: string): Promise<ParentStudent[]> {
    const { data: parent, error: parentError } = await supabase
      .from('parents')
      .select('id, userId')
      .eq('userId', parentId)
      .maybeSingle();

    if (parentError) throw parentError;
    if (!parent) {
      throw new Error('Responsável não encontrado');
    }

    const { data, error } = await supabase
      .from('student_parents')
      .select('id, parentId, studentId, relationship, isPrimary, createdAt')
      .eq('parentId', parent.id);

    if (error) throw error;
    return loadParentStudentLinks((data ?? []) as StudentParentRow[], 'student');
  },

  /**
   * Listar relacionamentos de um aluno (seus responsáveis)
   */
  async getStudentParents(studentId: string): Promise<ParentStudent[]> {
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, userId')
      .eq('userId', studentId)
      .maybeSingle();

    if (studentError) throw studentError;
    if (!student) {
      throw new Error('Aluno não encontrado');
    }

    const { data, error } = await supabase
      .from('student_parents')
      .select('id, parentId, studentId, relationship, isPrimary, createdAt')
      .eq('studentId', student.id);

    if (error) throw error;
    return loadParentStudentLinks((data ?? []) as StudentParentRow[], 'parent');
  },

  /**
   * Criar relacionamento pai-filho
   */
  async linkParentStudent(data: CreateParentStudentDto): Promise<ParentStudent> {
    const [{ data: parent, error: parentError }, { data: student, error: studentError }] =
      await Promise.all([
        supabase.from('parents').select('id, userId').eq('userId', data.parentId).maybeSingle(),
        supabase.from('students').select('id, userId').eq('userId', data.studentId).maybeSingle(),
      ]);

    if (parentError) throw parentError;
    if (studentError) throw studentError;
    if (!parent) throw new Error('Usuário não é um responsável válido');
    if (!student) throw new Error('Usuário não é um aluno válido');

    const payload = {
      id: crypto.randomUUID(),
      parentId: parent.id,
      studentId: student.id,
      relationship: data.relationship,
      isPrimary: data.isPrimaryContact ?? false,
      createdAt: new Date().toISOString(),
    };

    const { data: created, error } = await supabase
      .from('student_parents')
      .insert(payload)
      .select('id, parentId, studentId, relationship, isPrimary, createdAt')
      .single();

    if (error) throw error;
    const [link] = await loadParentStudentLinks([created as StudentParentRow], 'parent');
    return link;
  },

  /**
   * Atualizar relacionamento pai-filho
   */
  async updateParentStudent(
    id: string,
    data: UpdateParentStudentDto
  ): Promise<ParentStudent> {
    const payload: Record<string, unknown> = {};
    if (typeof data.relationship === 'string') {
      payload.relationship = data.relationship;
    }
    if (typeof data.isPrimaryContact === 'boolean') {
      payload.isPrimary = data.isPrimaryContact;
    }

    const { data: updated, error } = await supabase
      .from('student_parents')
      .update(payload)
      .eq('id', id)
      .select('id, parentId, studentId, relationship, isPrimary, createdAt')
      .single();

    if (error) throw error;
    const [link] = await loadParentStudentLinks([updated as StudentParentRow], 'parent');
    return link;
  },

  /**
   * Remover relacionamento pai-filho
   */
  async unlinkParentStudent(id: string): Promise<void> {
    const { error } = await supabase.from('student_parents').delete().eq('id', id);
    if (error) throw error;
  },

  /**
   * Adicionar perfil de professor
   */
  async addTeacherProfile(userId: string, data?: { specialization?: string; degree?: string; registrationNumber?: string }): Promise<any> {
    const response = await api.post(`/users/${userId}/profiles/teacher`, data);
    return response as unknown as any;
  },

  /**
   * Adicionar perfil de aluno
   */
  async addStudentProfile(userId: string, data?: { registrationNumber?: string; enrollmentNumber?: string; enrollmentDate?: string }): Promise<any> {
    const response = await api.post(`/users/${userId}/profiles/student`, data);
    return response as unknown as any;
  },

  /**
   * Adicionar perfil de responsável
   */
  async addParentProfile(userId: string, data?: { occupation?: string }): Promise<any> {
    const response = await api.post(`/users/${userId}/profiles/parent`, data);
    return response as unknown as any;
  },

  /**
   * Remover perfil de professor
   */
  async removeTeacherProfile(userId: string): Promise<void> {
    await api.delete(`/users/${userId}/profiles/teacher`);
  },

  /**
   * Remover perfil de aluno
   */
  async removeStudentProfile(userId: string): Promise<void> {
    await api.delete(`/users/${userId}/profiles/student`);
  },

  /**
   * Remover perfil de responsável
   */
  async removeParentProfile(userId: string): Promise<void> {
    await api.delete(`/users/${userId}/profiles/parent`);
  },

  /**
   * Aprovação rápida de usuário pendente
   */
  async quickApprove(
    userId: string,
    profileType: 'TEACHER' | 'STUDENT' | 'PARENT',
    profileData?: any
  ): Promise<{ message: string; user: User; profile: any }> {
    const response = await api.post(`/users/${userId}/quick-approve`, {
      profileType,
      profileData,
    });
    return response as unknown as { message: string; user: User; profile: any };
  },

  /**
   * Aprovação em massa de usuários pendentes
   */
  async bulkApprove(
    approvals: Array<{
      userId: string;
      profileType: 'TEACHER' | 'STUDENT' | 'PARENT';
      profileData?: any;
    }>
  ): Promise<{ approved: any[]; failed: any[] }> {
    const response = await api.post('/users/bulk-approve', { approvals });
    return response as unknown as { approved: any[]; failed: any[] };
  },
};
