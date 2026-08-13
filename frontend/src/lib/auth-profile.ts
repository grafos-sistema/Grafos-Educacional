import { supabase } from '@/lib/supabase';
import { User, UserRole } from '@/types/user.types';

const PROFILE_CACHE_TTL_MS = 30_000;

let cachedProfile: User | null = null;
let cachedProfileAt = 0;
let inflightProfilePromise: Promise<User> | null = null;

// #region debug-point infinite-loading-local-auth-profile
const dbgUrl = process.env.NEXT_PUBLIC_DEBUG_SERVER_URL || '';
const dbgSession = process.env.NEXT_PUBLIC_DEBUG_SESSION_ID || 'infinite-loading-local';
const dbgEmit = (name: string, payload?: Record<string, unknown>) => {
  if (!dbgUrl) return;
  fetch(dbgUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ts: Date.now(),
      sessionId: dbgSession,
      source: 'frontend',
      scope: 'auth-profile',
      name,
      payload: payload ?? {},
    }),
  }).catch(() => {});
};
// #endregion debug-point infinite-loading-local-auth-profile

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
  rg?: string | null;
  rgEmissor?: string | null;
  rgEmissao?: string | null;
  socialName?: string | null;
  nacionalidade?: string | null;
  naturalidade?: string | null;
  isActive: boolean;
  emailVerified: boolean;
  requestedProfileType?: string | null;
  institutionId?: string | null;
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
    rg: row.rg ?? undefined,
    rgEmissor: row.rgEmissor ?? undefined,
    rgEmissao: row.rgEmissao ?? undefined,
    socialName: row.socialName ?? undefined,
    nacionalidade: row.nacionalidade ?? undefined,
    naturalidade: row.naturalidade ?? undefined,
    isActive: row.isActive,
    emailVerified: row.emailVerified,
    requestedProfileType: row.requestedProfileType ?? undefined,
    institutionId: row.institutionId ?? undefined,
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
    dbgEmit('fetchCurrentUserProfile:cacheHit');
    return cachedProfile as User;
  }

  if (!options?.forceRefresh && inflightProfilePromise) {
    dbgEmit('fetchCurrentUserProfile:inflightReuse');
    return inflightProfilePromise;
  }

  inflightProfilePromise = (async () => {
    const startedAt = Date.now();
    dbgEmit('fetchCurrentUserProfile:start');
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      clearCurrentUserProfileCache();
      dbgEmit('fetchCurrentUserProfile:authUser:failed', {
        hasAuthUser: Boolean(authUser),
        hasError: Boolean(authError),
        elapsedMs: Date.now() - startedAt,
      });
      throw authError ?? new Error('Usuário não autenticado');
    }

    dbgEmit('fetchCurrentUserProfile:authUser:ok', { elapsedMs: Date.now() - startedAt });

    const { data: appUser, error: appUserError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (appUserError || !appUser) {
      clearCurrentUserProfileCache();
      dbgEmit('fetchCurrentUserProfile:appUser:failed', {
        hasAppUser: Boolean(appUser),
        hasError: Boolean(appUserError),
        elapsedMs: Date.now() - startedAt,
      });
      throw appUserError ?? new Error('Perfil do usuário não encontrado ou sem permissão de leitura.');
    }

    dbgEmit('fetchCurrentUserProfile:appUser:ok', {
      role: (appUser as any)?.role,
      hasInstitutionId: Boolean((appUser as any)?.institutionId),
      elapsedMs: Date.now() - startedAt,
    });

    if (appUser.role === UserRole.SUPER_ADMIN_GLOBAL) {
      const profile = mapAppUser(appUser as AppUserRow, {
        mustChangePassword: Boolean(authUser.user_metadata?.mustChangePassword),
      });

      cachedProfile = profile;
      cachedProfileAt = Date.now();

      dbgEmit('fetchCurrentUserProfile:done:superAdminGlobal', {
        elapsedMs: Date.now() - startedAt,
      });
      return profile;
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

    dbgEmit('fetchCurrentUserProfile:profiles:ok', {
      elapsedMs: Date.now() - startedAt,
      ignoreTeacherError,
      ignoreStudentError,
      ignoreParentError,
    });

    const profile = mapAppUser(appUser as AppUserRow, {
      teacherProfile: ignoreTeacherError ? undefined : teacherResult.data ?? undefined,
      studentProfile: ignoreStudentError ? undefined : studentResult.data ?? undefined,
      parentProfile: ignoreParentError ? undefined : parentResult.data ?? undefined,
      mustChangePassword: Boolean(authUser.user_metadata?.mustChangePassword),
    });

    cachedProfile = profile;
    cachedProfileAt = Date.now();

    dbgEmit('fetchCurrentUserProfile:done', { elapsedMs: Date.now() - startedAt });
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

  const institutionIds = Array.from(
    new Set(
      [profile.institutionId, ...(links ?? []).map((link) => link.institutionId)].filter(
        (value): value is string => Boolean(value)
      )
    )
  );

  if (institutionIds.length === 0) {
    return [];
  }

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
