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

export default function Home() {
  // URL do sistema (configurável via env)
  const sistemaUrl = process.env.NEXT_PUBLIC_SISTEMA_URL || 'http://localhost:3000';

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

  // Municípios cadastrados (mockado)
  const municipios = [
    {
      nome: 'Santa Cruz do Rio Pardo',
      estado: 'SP',
      escolas: 12,
      alunos: '8.500+',
      url: 'https://santacruz.grafoseducacional.com.br',
      logo: null,
    },
    {
      nome: 'Nova Friburgo',
      estado: 'RJ',
      escolas: 18,
      alunos: '12.000+',
      url: 'https://novafriburgo.grafoseducacional.com.br',
      logo: null,
    },
    {
      nome: 'Petrópolis',
      estado: 'RJ',
      escolas: 25,
      alunos: '18.500+',
      url: 'https://petropolis.grafoseducacional.com.br',
      logo: null,
    },
    {
      nome: 'Campos do Jordão',
      estado: 'SP',
      escolas: 8,
      alunos: '4.200+',
      url: 'https://camposdojordao.grafoseducacional.com.br',
      logo: null,
    },
    {
      nome: 'Cabo Frio',
      estado: 'RJ',
      escolas: 22,
      alunos: '15.800+',
      url: 'https://cabofrio.grafoseducacional.com.br',
      logo: null,
    },
    {
      nome: 'Teresópolis',
      estado: 'RJ',
      escolas: 16,
      alunos: '10.500+',
      url: 'https://teresopolis.grafoseducacional.com.br',
      logo: null,
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
            <Link href="/" className="flex items-center space-x-3 group" aria-label="Grafos - Voltar para página inicial">
              <Image
                src="/logo-grafos.png"
                alt="Grafos - Plataforma Educacional - Logo oficial com pontos conectados formando a letra G"
                width={50}
                height={50}
                className="transition-transform duration-300 group-hover:scale-105"
                priority
              />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-grafos-green to-grafos-teal bg-clip-text text-transparent">
                  Grafos
                </h1>
                <p className="text-xs text-gray-600">
                  Transformando a Educação no Brasil
                </p>
              </div>
            </Link>

            {/* Informações de Contato */}
            <div className="hidden md:flex items-center space-x-4">
              <a
                href="#municipios"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-grafos-green transition-colors"
              >
                Municípios
              </a>
              <a
                href="#funcionalidades"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-grafos-green transition-colors"
              >
                Funcionalidades
              </a>
              <a
                href="mailto:contato@grafoseducacional.com.br"
                className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-grafos-green to-grafos-teal rounded-lg hover:from-grafos-green-dark hover:to-grafos-teal-dark transition-all shadow-md"
              >
                Contato
              </a>
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <a
                href="mailto:contato@grafoseducacional.com.br"
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-grafos-green to-grafos-teal rounded-lg hover:from-grafos-green-dark hover:to-grafos-teal-dark transition-all shadow-md"
              >
                Contato
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32" aria-labelledby="hero-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 id="hero-heading" className="text-5xl sm:text-6xl font-extrabold text-gray-900 mb-6">
              Plataforma Educacional
              <span className="block bg-gradient-to-r from-grafos-green to-grafos-teal bg-clip-text text-transparent">
                Inovadora
              </span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Uma solução completa para <strong>prefeituras e escolas</strong> que prioriza a qualidade do ensino,
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
      <section id="funcionalidades" className="py-20 bg-white/50" aria-labelledby="features-heading">
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

      {/* Municípios Section */}
      <section id="municipios" className="py-20" aria-labelledby="municipios-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 id="municipios-heading" className="text-4xl font-bold text-gray-900 mb-4">
              Municípios Atendidos
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Transformando a educação em municípios de todo o Brasil
            </p>
          </div>

          {/* Municípios Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {municipios.map((municipio) => (
              <a
                key={municipio.nome}
                href={municipio.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative"
              >
                <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-2 border-transparent hover:border-grafos-green">
                  {/* Estado Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-grafos-green to-grafos-teal text-white">
                      {municipio.estado}
                    </span>
                  </div>

                  {/* Município Info */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 pr-16">
                      {municipio.nome}
                    </h3>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-2xl font-bold text-grafos-green">
                        {municipio.escolas}
                      </p>
                      <p className="text-sm text-gray-600">Escolas</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-grafos-teal">
                        {municipio.alunos}
                      </p>
                      <p className="text-sm text-gray-600">Alunos</p>
                    </div>
                  </div>

                  {/* Access Link */}
                  <div className="flex items-center text-sm font-semibold text-gray-900 group-hover:text-grafos-green transition-colors pt-4 border-t border-gray-200">
                    Acessar Sistema
                    <svg
                      className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* CTA para novos municípios */}
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-grafos-green to-grafos-teal rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">
                Leve o Grafos para seu município
              </h3>
              <p className="text-lg mb-6 opacity-90">
                Entre em contato e descubra como podemos transformar a educação na sua região
              </p>
              <a
                href="mailto:contato@grafoseducacional.com.br"
                className="inline-block px-8 py-3 bg-white text-grafos-green font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                Fale Conosco
              </a>
            </div>
          </div>
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
