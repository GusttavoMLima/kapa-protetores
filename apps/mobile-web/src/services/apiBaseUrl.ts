export function normalizeApiBaseUrl(configuredUrl: string | undefined): string {
  const value = configuredUrl?.trim();
  if (!value) {
    throw new Error('EXPO_PUBLIC_API_URL must be configured before starting the app.');
  }

  const parsedUrl = new URL(value);
  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
    throw new Error('EXPO_PUBLIC_API_URL must use a supported web protocol.');
  }
  if (process.env.NODE_ENV === 'production' && parsedUrl.protocol !== 'https:') {
    throw new Error('EXPO_PUBLIC_API_URL must use HTTPS in production.');
  }
  if (parsedUrl.search || parsedUrl.hash) {
    throw new Error('EXPO_PUBLIC_API_URL must not contain a query string or fragment.');
  }

  let pathname = parsedUrl.pathname;
  while (pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }

  const normalizedBaseUrl = `${parsedUrl.origin}${pathname}`;
  return normalizedBaseUrl.endsWith('/api')
    ? normalizedBaseUrl
    : `${normalizedBaseUrl}/api`;
}

export const apiBaseUrl = normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_URL);
