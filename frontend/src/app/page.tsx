'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  AcademicCapIcon,
  UserGroupIcon,
  UsersIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  BookOpenIcon,
  TrophyIcon,
  ClipboardDocumentCheckIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  CheckBadgeIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import { useMunicipalityConfig } from '@/config/municipality.config';

export default function Home() {
  const municipalityConfig = useMunicipalityConfig();
  // Schema.org structured data for SEO
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "Grafos",
    "description": "Plataforma educacional completa para prefeituras e escolas. Melhore o IDEB com banco de questões BNCC, diário online, simulados SAEB e gestão pedagógica integrada.",
    "url": "https://grafoseducacional.com.br",
    "logo": "https://grafoseducacional.com.br/logo-grafos.png",
    "sameAs": [
      "https://facebook.com/grafoseducacao",
      "https://instagram.com/grafoseducacao",
      "https://linkedin.com/company/grafoseducacao"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": "Portuguese"
    }
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Grafos - Plataforma Educacional",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "BRL"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "150"
    },
    "description": "Sistema completo de gestão escolar com banco de questões BNCC, diário online, simulados SAEB, rankings e relatórios para melhoria do IDEB."
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://grafoseducacional.com.br"
      }
    ]
  };

  const profiles = [
    {
      title: 'Gestão',
      description: 'Administradores e Coordenadores',
      details: 'Controle total do IDEB e relatórios',
      icon: ShieldCheckIcon,
      href: '/login/admin',
      color: 'from-grafos-teal to-grafos-green',
      hoverColor: 'hover:from-grafos-teal-dark hover:to-grafos-green-dark',
    },
    {
      title: 'Professores',
      description: 'Área Docente Completa',
      details: 'Diário online, provas e banco de questões',
      icon: AcademicCapIcon,
      href: '/login/professor',
      color: 'from-grafos-green to-grafos-teal',
      hoverColor: 'hover:from-grafos-green-dark hover:to-grafos-teal-dark',
    },
    {
      title: 'Alunos',
      description: 'Portal do Estudante',
      details: 'Notas, atividades e rankings',
      icon: UsersIcon,
      href: '/login/aluno',
      color: 'from-grafos-lime to-grafos-green',
      hoverColor: 'hover:from-grafos-lime-dark hover:to-grafos-green-dark',
    },
    {
      title: 'Família',
      description: 'Responsáveis e Pais',
      details: 'Acompanhamento em tempo real',
      icon: UserGroupIcon,
      href: '/login/responsaveis',
      color: 'from-grafos-blue to-grafos-teal',
      hoverColor: 'hover:from-grafos-blue-dark hover:to-grafos-teal-dark',
    },
  ];

  const stats = [
    { label: 'Questões BNCC', value: '10.000+', icon: BookOpenIcon },
    { label: 'Taxa de Aprovação', value: '95%', icon: ChartBarIcon },
    { label: 'Escolas Atendidas', value: '150+', icon: AcademicCapIcon },
    { label: 'Alunos Ativos', value: '50mil+', icon: UsersIcon },
  ];

  const features = [
    {
      title: 'Banco de Questões BNCC',
      description: 'Milhares de questões alinhadas à Base Nacional Comum Curricular para todos os anos do ensino fundamental.',
      icon: BookOpenIcon,
      gradient: 'from-grafos-green to-grafos-teal',
    },
    {
      title: 'Melhoria do IDEB',
      description: 'Acompanhamento e análises que contribuem para o aumento do Índice de Desenvolvimento da Educação Básica.',
      icon: ArrowTrendingUpIcon,
      gradient: 'from-grafos-teal to-grafos-lime',
    },
    {
      title: 'Diário Online Completo',
      description: 'Registro de frequência, conteúdos, notas e observações em uma plataforma única e integrada.',
      icon: ClipboardDocumentCheckIcon,
      gradient: 'from-grafos-blue to-grafos-green',
    },
    {
      title: 'Rankings e Premiações',
      description: 'Sistema de incentivo ao desempenho com rankings por escola, turma e aluno, promovendo competitividade saudável.',
      icon: TrophyIcon,
      gradient: 'from-grafos-lime to-grafos-teal',
    },
    {
      title: 'Gráficos de Desempenho',
      description: 'Visualize a evolução dos alunos com gráficos interativos e relatórios detalhados em tempo real.',
      icon: ChartBarIcon,
      gradient: 'from-grafos-green to-grafos-blue',
    },
    {
      title: 'Simulados SAEB',
      description: 'Prepare seus alunos para avaliações oficiais com simulados específicos alinhados à matriz SAEB.',
      icon: CheckBadgeIcon,
      gradient: 'from-grafos-teal to-grafos-green',
    },
  ];

  const differentials = [
    {
      text: 'Integração completa de todas as disciplinas',
      icon: SparklesIcon,
    },
    {
      text: 'Assistência pedagógica contextualizada',
      icon: LightBulbIcon,
    },
    {
      text: 'Alinhamento com BNCC e SAEB',
      icon: CheckBadgeIcon,
    },
  ];

  return (
    <>
      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 group" aria-label={`${municipalityConfig.shortName} - Voltar para página inicial`}>
              <Image
                src={municipalityConfig.logo}
                alt={`${municipalityConfig.shortName} - Logo oficial`}
                width={50}
                height={50}
                className="transition-transform duration-300 group-hover:scale-105"
                priority
              />
              <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                  {municipalityConfig.shortName}
                </h1>
                <p className="text-xs text-gray-600">
                  {municipalityConfig.slogan}
                </p>
              </div>
            </Link>

            {/* Login Shortcuts */}
            <div className="hidden md:flex items-center space-x-2">
              <Link
                href="/login/admin"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-grafos-green transition-colors"
              >
                Gestão
              </Link>
              <Link
                href="/login/professor"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-grafos-green transition-colors"
              >
                Professor
              </Link>
              <Link
                href="/login/aluno"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-grafos-green transition-colors"
              >
                Aluno
              </Link>
              <Link
                href="/login/responsaveis"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-grafos-green transition-colors"
              >
                Família
              </Link>
              <Link
                href="/register"
                className="ml-4 px-5 py-2 text-sm font-semibold text-gray-700 border-2 border-grafos-green rounded-lg hover:bg-grafos-green hover:text-white transition-all"
              >
                Criar Conta
              </Link>
              <Link
                href="/login"
                className="px-5 py-2 ml-4 text-sm font-semibold text-white bg-gradient-to-r border-2 border-grafos-green-dark from-grafos-green to-grafos-teal rounded-lg hover:from-grafos-green-dark hover:to-grafos-teal-dark transition-all shadow-md"
              >
                Entrar
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <Link
                href="/register"
                className="px-3 py-2 text-xs font-semibold text-gray-700 border border-grafos-green rounded-lg hover:bg-grafos-green hover:text-white transition-all"
              >
                Criar Conta
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-grafos-green to-grafos-teal rounded-lg hover:from-grafos-green-dark hover:to-grafos-teal-dark transition-all shadow-md"
              >
                Entrar
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32" aria-labelledby="hero-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 id="hero-heading" className="text-5xl sm:text-6xl font-extrabold text-gray-900 mb-6">
              Sistema de Gestão Escolar
              <span className="block" style={{ background: `linear-gradient(to right, var(--color-primary), var(--color-secondary))`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {municipalityConfig.name}
              </span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Plataforma completa de gestão educacional da <strong>{municipalityConfig.shortName}</strong> que prioriza a qualidade do ensino,
              o desempenho dos alunos e o aumento do <strong>IDEB</strong>, alinhada aos princípios da <strong>BNCC</strong>.
            </p>

            {/* Differentials Pills */}
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              {differentials.map((diff, idx) => {
                const Icon = diff.icon;
                return (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md"
                  >
                    <Icon className="h-5 w-5 text-grafos-green" />
                    <span className="text-sm font-medium text-gray-700">{diff.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="mt-20 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg text-center"
                >
                  <Icon className="h-8 w-8 text-grafos-green mx-auto mb-3" />
                  <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50" aria-labelledby="features-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 id="features-heading" className="text-3xl font-bold text-gray-900 mb-4">
              Funcionalidades Principais
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Tudo o que você precisa para transformar a educação em uma única plataforma
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <article
                  key={idx}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4`} aria-hidden="true">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Access Portal Section */}
      <section className="py-20" aria-labelledby="access-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 id="access-heading" className="text-4xl font-bold text-gray-900 mb-4">
              Acesse o Portal
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Selecione seu perfil para começar a usar a plataforma Grafos
            </p>
          </div>

          {/* Profile Cards Grid */}
          <nav className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-label="Perfis de acesso">
            {profiles.map((profile) => {
              const Icon = profile.icon;
              return (
                <Link
                  key={profile.href}
                  href={profile.href}
                  className="group relative"
                  aria-label={`Acessar portal de ${profile.title} - ${profile.description}`}
                >
                  <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
                    {/* Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${profile.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} aria-hidden="true" />

                    {/* Icon */}
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${profile.color} ${profile.hoverColor} transition-all duration-300 mb-4`} aria-hidden="true">
                      <Icon className="w-7 h-7 text-white" />
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {profile.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">
                      {profile.description}
                    </p>
                    <p className="text-gray-500 text-xs mb-4">
                      {profile.details}
                    </p>

                    {/* Arrow Icon */}
                    <div className="flex items-center text-sm font-semibold text-gray-900 group-hover:text-grafos-green transition-colors">
                      Acessar Portal
                      <svg
                        className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-gradient-to-br from-grafos-green to-grafos-teal text-white" aria-labelledby="mission-heading">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 id="mission-heading" className="text-3xl font-bold mb-6">Nossa Missão</h2>
          <p className="text-lg leading-relaxed opacity-90">
            Promover o desenvolvimento de competências alinhadas à Base Nacional Comum Curricular (BNCC)
            e adaptadas à realidade local, por meio de uma plataforma educacional inovadora.
            Buscamos garantir um aprendizado eficaz e integral, capacitando professores e gestores
            a monitorarem as ações pedagógicas e mensurar resultados de forma contínua e eficaz.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Image
                  src="/logo-grafos.png"
                  alt="Grafos - Plataforma Educacional"
                  className='rounded-xl'
                  width={32}
                  height={32}
                  loading="lazy"
                />
                <span className="text-xl font-bold">Grafos</span>
              </div>
              <p className="text-gray-400 text-sm">
                Transformando a educação no Brasil através da tecnologia e inovação pedagógica.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produtos</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Plataforma Educacional</li>
                <li>Banco de Questões BNCC</li>
                <li>Simulados SAEB</li>
                <li>Diário Online</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Central de Ajuda
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Documentação
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contato
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 Grafos - Plataforma Educacional. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}
