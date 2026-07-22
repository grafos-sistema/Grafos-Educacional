import { redirect } from 'next/navigation';

export default async function StudentRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/users/${id}`);
}

