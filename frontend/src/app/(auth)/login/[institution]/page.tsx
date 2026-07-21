import { notFound } from 'next/navigation';
import InstitutionLoginForm from './InstitutionLoginForm';
import { createClient } from '@supabase/supabase-js';

interface Institution {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  logo?: string;
}

// Buscar dados da instituição no servidor
async function getInstitution(slug: string): Promise<Institution | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabasePublishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabasePublishableKey) {
      return null;
    }

    const serverClient = createClient(supabaseUrl, supabasePublishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await serverClient
      .from('institutions')
      .select('id, name, slug, email, phone, city, state, logo')
      .eq('slug', slug)
      .eq('isActive', true)
      .single();

    if (error || !data) return null;
    return data as Institution;
  } catch (_error) {
    return null;
  }
}

export default async function InstitutionLoginPage({
  params,
}: {
  params: Promise<{ institution: string }>;
}) {
  const { institution: institutionSlug } = await params;
  const institution = await getInstitution(institutionSlug);

  if (!institution) {
    notFound();
  }

  return <InstitutionLoginForm institution={institution} />;
}
