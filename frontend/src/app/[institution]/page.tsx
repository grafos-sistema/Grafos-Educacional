import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import {
  AcademicCapIcon,
  ChartBarIcon,
  ClockIcon,
  UserGroupIcon,
  ArrowRightIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

type Institution = {
  id: string;
  name: string;
  slug: string;
  city?: string | null;
  state?: string | null;
  logo?: string | null;
  description?: string | null;
  address?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  email?: string | null;
};

// Buscar dados da instituição (será otimizado com cache)
async function getInstitution(slug: string): Promise<Institution | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabasePublishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabasePublishableKey) return null;

    const serverClient = createClient(supabaseUrl, supabasePublishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await serverClient
      .from('institutions')
      .select('id, name, slug, city, state, logo, description, address, postalCode, phone, email')
      .eq('slug', slug)
      .eq('isActive', true)
      .single();

    if (error || !data) return null;
    return data as Institution;
  } catch {
    return null;
  }
}

// Metadata dinâmica por instituição para SEO
export async function generateMetadata({ params }: { params: Promise<{ institution: string }> }): Promise<Metadata> {
  const { institution: institutionSlug } = await params;
  const institution = await getInstitution(institutionSlug);

  if (!institution) {
    return {
      title: 'Instituição não encontrada',
    };
  }

  const title = `${institution.name} - Sistema de Gestão Escolar`;
  const description = institution.description ||
    `Acesse o portal educacional da ${institution.name}. Acompanhe notas, frequência, calendário escolar e muito mais.`;

  return {
    title,
    description,
    keywords: [
      institution.name,
      `escola ${institution.city}`,
      `educação ${institution.city}`,
      'gestão escolar',
      'portal educacional',
      'diário online',
      institution.city,
      institution.state,
    ],
    openGraph: {
      title,
      description,
      url: `https://grafoseducacional.com.br/${institutionSlug}`,
      siteName: institution.name,
      locale: 'pt_BR',
      type: 'website',
      images: institution.logo ? [
        {
          url: institution.logo,
          width: 1200,
          height: 630,
          alt: institution.name,
        }
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: institution.logo ? [institution.logo] : [],
    },
    alternates: {
      canonical: `https://grafoseducacional.com.br/${institutionSlug}`,
    },
  };
}

// Página pública da instituição
export default async function InstitutionPage({ params }: { params: Promise<{ institution: string }> }) {
  const { institution: institutionSlug } = await params;
  const institution = await getInstitution(institutionSlug);

  if (!institution) {
    notFound();
  }

  // Schema.org JSON-LD para SEO
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: institution.name,
    description: institution.description,
    url: `https://grafoseducacional.com.br/${institutionSlug}`,
    logo: institution.logo,
    address: {
      '@type': 'PostalAddress',
      streetAddress: institution.address,
      addressLocality: institution.city,
      addressRegion: institution.state,
      postalCode: institution.postalCode,
      addressCountry: 'BR',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: institution.phone,
      email: institution.email,
      contactType: 'Secretaria',
    },
  };

  return (
    <>
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              {institution.logo && (
                <img
                  src={institution.logo}
                  alt={institution.name}
                  className="h-24 mx-auto mb-6"
                />
              )}
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {institution.name}
              </h1>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                {institution.description || 'Portal Educacional'}
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link
                  href={`/login/${institutionSlug}`}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 transition-colors"
                >
                  Acessar Portal
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  href={`/${institutionSlug}/sobre`}
                  className="inline-flex items-center px-6 py-3 border-2 border-white text-base font-medium rounded-md text-white hover:bg-blue-700 transition-colors"
                >
                  Saiba Mais
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Portal do Aluno e Responsáveis
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <AcademicCapIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Notas e Avaliações</h3>
              <p className="text-gray-600">
                Acompanhe o desempenho acadêmico em tempo real
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <ClockIcon className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Frequência</h3>
              <p className="text-gray-600">
                Controle de presença diário atualizado
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Boletim Online</h3>
              <p className="text-gray-600">
                Acesse boletins e histórico escolar
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <UserGroupIcon className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Comunicação</h3>
              <p className="text-gray-600">
                Notificações e avisos escolares
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Contato
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              {institution.phone && (
                <div className="flex items-start">
                  <PhoneIcon className="h-6 w-6 text-blue-600 mt-1 mr-3" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Telefone</h3>
                    <a href={`tel:${institution.phone}`} className="text-gray-600 hover:text-blue-600">
                      {institution.phone}
                    </a>
                  </div>
                </div>
              )}

              {institution.email && (
                <div className="flex items-start">
                  <EnvelopeIcon className="h-6 w-6 text-blue-600 mt-1 mr-3" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">E-mail</h3>
                    <a href={`mailto:${institution.email}`} className="text-gray-600 hover:text-blue-600">
                      {institution.email}
                    </a>
                  </div>
                </div>
              )}

              {institution.address && (
                <div className="flex items-start">
                  <MapPinIcon className="h-6 w-6 text-blue-600 mt-1 mr-3" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Endereço</h3>
                    <p className="text-gray-600">
                      {institution.address}
                      {institution.city && institution.state && (
                        <>, {institution.city} - {institution.state}</>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <p className="text-gray-400">
                © {new Date().getFullYear()} {institution.name}. Powered by{' '}
                <a href="https://grafoseducacional.com.br" className="text-blue-400 hover:text-blue-300">
                  Grafos Educação
                </a>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
