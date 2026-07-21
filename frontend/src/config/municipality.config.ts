/**
 * Configuração de customização do município
 * 
 * Este arquivo centraliza todas as configurações relacionadas à personalização
 * da interface para cada município específico.
 */

export interface MunicipalityConfig {
  // Informações básicas
  name: string;
  shortName: string;
  state: string;
  slogan: string;
  
  // Recursos visuais
  logo: string;
  coatOfArms?: string;
  
  // Cores
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  
  // Contato
  contact: {
    email?: string;
    phone?: string;
    address?: string;
    website?: string;
  };
  
  // Redes sociais
  social: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

/**
 * Valores padrão do Grafos (usados quando não há customização de município)
 */
const DEFAULT_CONFIG: MunicipalityConfig = {
  name: 'Grafos',
  shortName: 'Grafos',
  state: '',
  slogan: 'Sistema de Gestão Escolar',
  logo: '/logo-grafos.png',
  colors: {
    primary: '#10B981',
    secondary: '#14B8A6',
    accent: '#3B82F6',
  },
  contact: {
    email: 'contato@grafoseducacional.com.br',
    website: 'https://grafoseducacional.com.br',
  },
  social: {},
};

/**
 * Carrega a configuração do município a partir das variáveis de ambiente
 */
export function getMunicipalityConfig(): MunicipalityConfig {
  // Se não for deployment de município, retorna config padrão do Grafos
  const deploymentType = process.env.NEXT_PUBLIC_DEPLOYMENT_TYPE || 'MAIN';
  
  if (deploymentType !== 'MUNICIPALITY') {
    return DEFAULT_CONFIG;
  }

  // Monta config do município a partir das variáveis de ambiente
  return {
    name: process.env.NEXT_PUBLIC_MUNICIPALITY_NAME || DEFAULT_CONFIG.name,
    shortName: process.env.NEXT_PUBLIC_MUNICIPALITY_SHORT_NAME || DEFAULT_CONFIG.shortName,
    state: process.env.NEXT_PUBLIC_MUNICIPALITY_STATE || DEFAULT_CONFIG.state,
    slogan: process.env.NEXT_PUBLIC_MUNICIPALITY_SLOGAN || DEFAULT_CONFIG.slogan,
    logo: process.env.NEXT_PUBLIC_MUNICIPALITY_LOGO || DEFAULT_CONFIG.logo,
    coatOfArms: process.env.NEXT_PUBLIC_MUNICIPALITY_COAT_OF_ARMS,
    colors: {
      primary: process.env.NEXT_PUBLIC_PRIMARY_COLOR || DEFAULT_CONFIG.colors.primary,
      secondary: process.env.NEXT_PUBLIC_PRIMARY_COLOR || DEFAULT_CONFIG.colors.secondary,
      accent: process.env.NEXT_PUBLIC_ACCENT_COLOR || DEFAULT_CONFIG.colors.accent,
    },
    contact: {
      email: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
      phone: process.env.NEXT_PUBLIC_CONTACT_PHONE,
      address: process.env.NEXT_PUBLIC_CONTACT_ADDRESS,
      website: process.env.NEXT_PUBLIC_OFFICIAL_WEBSITE,
    },
    social: {
      facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL,
      instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL,
      twitter: process.env.NEXT_PUBLIC_TWITTER_URL,
    },
  };
}

/**
 * Hook para usar a configuração do município em componentes React
 */
export function useMunicipalityConfig() {
  return getMunicipalityConfig();
}

/**
 * Gera CSS variables para as cores customizadas
 * Use isso no root layout para aplicar as cores em todo o app
 */
export function getMunicipalityCSSVariables(): Record<string, string> {
  const config = getMunicipalityConfig();
  
  return {
    '--color-primary': config.colors.primary,
    '--color-secondary': config.colors.secondary,
    '--color-accent': config.colors.accent,
  };
}
