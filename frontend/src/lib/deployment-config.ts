/**
 * Deployment Configuration
 *
 * This module handles the configuration for different deployment types:
 * - MAIN: Grafos main site with landing page (grafoseducacional.com.br)
 * - MUNICIPALITY: Municipality-specific deployment without landing page
 *
 * Each municipality deployment is a separate instance of the system where
 * institutions/schools are created and managed independently.
 */

export type DeploymentType = 'MAIN' | 'MUNICIPALITY';

export interface DeploymentConfig {
  type: DeploymentType;
  defaultInstitutionSlug?: string;
  hasLandingPage: boolean;
  defaultLoginRoute: string;
  defaultRootRoute: string;
}

/**
 * Get the current deployment configuration
 */
export function getDeploymentConfig(): DeploymentConfig {
  const deploymentType = (process.env.NEXT_PUBLIC_DEPLOYMENT_TYPE || 'MAIN') as DeploymentType;
  const defaultInstitutionSlug = process.env.NEXT_PUBLIC_DEFAULT_INSTITUTION_SLUG;

  if (deploymentType === 'MUNICIPALITY') {
    return {
      type: 'MUNICIPALITY',
      defaultInstitutionSlug,
      hasLandingPage: false,
      defaultLoginRoute: defaultInstitutionSlug ? `/login/${defaultInstitutionSlug}` : '/login',
      defaultRootRoute: '/institutions',
    };
  }

  // MAIN deployment (default)
  return {
    type: 'MAIN',
    hasLandingPage: true,
    defaultLoginRoute: '/login',
    defaultRootRoute: '/',
  };
}

/**
 * Check if this is the main Grafos site
 */
export function isMainSite(): boolean {
  return getDeploymentConfig().type === 'MAIN';
}

/**
 * Check if this is a municipality-specific deployment
 */
export function isMunicipalityDeployment(): boolean {
  return getDeploymentConfig().type === 'MUNICIPALITY';
}

/**
 * Get the default route for the root path
 */
export function getDefaultRootRoute(): string {
  return getDeploymentConfig().defaultRootRoute;
}

/**
 * Get the default login route
 */
export function getDefaultLoginRoute(): string {
  return getDeploymentConfig().defaultLoginRoute;
}
