import { redirect } from 'next/navigation';

export default async function SuperAdminInstitutionRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/super-admin/institutions/${id}/edit`);
}
