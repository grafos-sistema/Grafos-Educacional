import { UserRole } from '@/types/user.types';

export function getUserListRouteByRole(role?: string | null) {
  switch (role) {
    case UserRole.STUDENT:
      return '/admin/alunos';
    case UserRole.TEACHER:
      return '/admin/professores';
    case UserRole.COORDINATOR:
      return '/admin/coordenadores';
    default:
      return '/admin/users';
  }
}

export function getUserCreateRouteByRole(role?: string | null) {
  switch (role) {
    case UserRole.STUDENT:
      return '/admin/alunos/new';
    case UserRole.TEACHER:
      return '/admin/professores/new';
    case UserRole.COORDINATOR:
      return '/admin/coordenadores/new';
    default:
      return '/admin/users/new';
  }
}

export function getUserEditRouteByRole(userId: string, role?: string | null) {
  switch (role) {
    case UserRole.STUDENT:
      return `/admin/alunos/${userId}/edit`;
    case UserRole.TEACHER:
      return `/admin/professores/${userId}/edit`;
    case UserRole.COORDINATOR:
      return `/admin/coordenadores/${userId}/edit`;
    default:
      return `/admin/users/${userId}/edit`;
  }
}
