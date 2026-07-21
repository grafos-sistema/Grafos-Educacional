import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

type SitemapInstitution = {
  slug: string;
  createdAt: string;
  updatedAt: string;
};

async function getInstitutions() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabasePublishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabasePublishableKey) return [];

    const serverClient = createClient(supabaseUrl, supabasePublishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await serverClient
      .from('institutions')
      .select('slug, createdAt, updatedAt')
      .eq('isActive', true)
      .order('updatedAt', { ascending: false })
      .range(0, 999);

    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://grafoseducacional.com.br';
  const currentDate = new Date();
  const institutions = await getInstitutions();

  // Páginas estáticas
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login/admin`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/login/professor`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/login/aluno`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/login/responsaveis`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // Páginas dinâmicas por instituição (SEO multi-tenant)
  const institutionPages: MetadataRoute.Sitemap = (institutions as SitemapInstitution[]).flatMap((institution) => [
    {
      url: `${baseUrl}/${institution.slug}`,
      lastModified: new Date(institution.updatedAt || institution.createdAt),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login/${institution.slug}`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
  ]);

  return [...staticPages, ...institutionPages];
}
