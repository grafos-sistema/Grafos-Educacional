import { supabase } from '@/lib/supabase';
import { User, UserRole } from '@/types/user.types';

const PROFILE_CACHE_TTL_MS = 30_000;

let cachedProfile: User | null = null;
let cachedProfileAt = 0;
let inflightProfilePromise: Promise<User> | null = null;

type AppUserRow = {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  cpf?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  gender?: User['gender'] | null;
  avatar?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  isActive: boolean;
  emailVerified: boolean;
  requestedProfileType?: string | null;
  institutionId: string;
  createdAt: string;
  updatedAt: string;
};

function mapAppUser(row: AppUserRow, extras?: Partial<User>): User {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    firstName: row.firstName,
    lastName: row.lastName,
    cpf: row.cpf ?? undefined,
    phone: row.phone ?? undefined,
    birthDate: row.birthDate ?? undefined,
    gender: row.gender ?? undefined,
    avatar: row.avatar ?? undefined,
    address: row.address ?? undefined,
    city: row.city ?? undefined,
    state: row.state ?? undefined,
    zipCode: row.zipCode ?? undefined,
    isActive: row.isActive,
    emailVerified: row.emailVerified,
    requestedProfileType: row.requestedProfileType ?? undefined,
    institutionId: row.institutionId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    ...extras,
  };
}

function isProfileCacheFresh() {
  return cachedProfile !== null && Date.now() - cachedProfileAt < PROFILE_CACHE_TTL_MS;
}

function shouldIgnoreProfileBootstrapError(
  error: { message?: string; code?: string } | null,
  role: UserRole,
  profileTable: 'teachers' | 'students' | 'parents'
) {
  if (!error) {
    return false;
  }

  const isExpectedOwnProfile =
    (profileTable === 'teachers' && role === UserRole.TEACHER) ||
    (profileTable === 'students' && role === UserRole.STUDENT) ||
    (profileTable === 'parents' && role === UserRole.PARENT);

  if (!isExpectedOwnProfile) {
    return false;
  }

  const message = error.message?.toLowerCase() ?? '';
  return error.code === '54001' || message.includes('stack depth limit exceeded');
}

export function clearCurrentUserProfileCache() {
  cachedProfile = null;
  cachedProfileAt = 0;
  inflightProfilePromise = null;
}

export async function fetchCurrentUserProfile(options?: {
  forceRefresh?: boolean;
}): Promise<User> {
  if (!options?.forceRefresh && isProfileCacheFresh()) {
    return cachedProfile as User;
  }

  if (!options?.forceRefresh && inflightProfilePromise) {
    return inflightProfilePromise;
  }

  inflightProfilePromise = (async () => {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      clearCurrentUserProfileCache();
      throw authError ?? new Error('Usuário não autenticado');
    }

    const { data: appUser, error: appUserError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authUser.id)
      .single();

    if (appUserError || !appUser) {
      clearCurrentUserProfileCache();
      throw appUserError ?? new Error('Perfil do usuário não encontrado');
    }

    const [teacherResult, studentResult, parentResult] = await Promise.all([
      supabase.from('teachers').select('*').eq('userId', appUser.id).maybeSingle(),
      supabase.from('students').select('*').eq('userId', appUser.id).maybeSingle(),
      supabase.from('parents').select('*').eq('userId', appUser.id).maybeSingle(),
    ]);

    const ignoreTeacherError = shouldIgnoreProfileBootstrapError(
      teacherResult.error as { message?: string; code?: string } | null,
      appUser.role,
      'teachers'
    );
    const ignoreStudentError = shouldIgnoreProfileBootstrapError(
      studentResult.error as { message?: string; code?: string } | null,
      appUser.role,
      'students'
    );
    const ignoreParentError = shouldIgnoreProfileBootstrapError(
      parentResult.error as { message?: string; code?: string } | null,
      appUser.role,
      'parents'
    );

    if (teacherResult.error && !ignoreTeacherError) throw teacherResult.error;
    if (studentResult.error && !ignoreStudentError) throw studentResult.error;
    if (parentResult.error && !ignoreParentError) throw parentResult.error;

    const profile = mapAppUser(appUser as AppUserRow, {
      teacherProfile: ignoreTeacherError ? undefined : teacherResult.data ?? undefined,
      studentProfile: ignoreStudentError ? undefined : studentResult.data ?? undefined,
      parentProfile: ignoreParentError ? undefined : parentResult.data ?? undefined,
      mustChangePassword: Boolean(authUser.user_metadata?.mustChangePassword),
    });

    cachedProfile = profile;
    cachedProfileAt = Date.now();

    return profile;
  })();

  try {
    return await inflightProfilePromise;
  } finally {
    inflightProfilePromise = null;
  }
}

export async function fetchUserInstitutions() {
  const profile = await fetchCurrentUserProfile();

  const { data: links, error: linksError } = await supabase
    .from('user_institutions')
    .select('institutionId, isPrimary, isActive')
    .eq('userId', profile.id)
    .eq('isActive', true);

  if (linksError) {
    throw linksError;
  }

  const institutionIds = Array.from(new Set([profile.institutionId, ...(links ?? []).map((link) => link.institutionId)]));

  const { data: institutions, error: institutionsError } = await supabase
    .from('institutions')
    .select('id, name, slug, logo, isActive')
    .in('id', institutionIds);

  if (institutionsError) {
    throw institutionsError;
  }

  return (institutions ?? []).map((institution) => {
    const link = links?.find((item) => item.institutionId === institution.id);
    return {
      ...institution,
      isPrimary: link?.isPrimary ?? institution.id === profile.institutionId,
      isCurrent: institution.id === profile.institutionId,
    };
  });
}
