const LOCAL_API_URL = 'http://localhost:3333';
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1']);

function normalizeApiUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function isLocalBrowserHost(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return LOCAL_HOSTNAMES.has(window.location.hostname);
}

export function getApiBaseUrl(): string | undefined {
  const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (configuredApiUrl) {
    return normalizeApiUrl(configuredApiUrl);
  }

  if (isLocalBrowserHost()) {
    return LOCAL_API_URL;
  }

  return undefined;
}

export function getApiConfigurationMessage(): string {
  return 'A API backend ainda nao esta configurada para este ambiente. Publique a API e defina NEXT_PUBLIC_API_URL antes de usar o cadastro.';
}
