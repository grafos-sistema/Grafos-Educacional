import { redirect } from 'next/navigation';

/**
 * A antiga dashboard global foi removida do fluxo do Super Admin Global.
 * Mantemos a rota para redirecionar favoritos e links antigos.
 */
export default function SuperAdminDashboardRedirect() {
  redirect('/super-admin/institutions');
}
