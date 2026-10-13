import { create } from 'axios';
import { apiBaseUrl } from './apiBaseUrl';

export const kapaService = create({ baseURL: apiBaseUrl });

const publicAuthenticationPaths = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/google',
]);

let onUnauthorizedCallback: (() => void) | null = null;

export function setOnUnauthorizedCallback(cb: (() => void) | null): void {
  onUnauthorizedCallback = cb;
}

function isPublicAuthenticationRequest(requestUrl: string | undefined): boolean {
  if (!requestUrl) return false;

  try {
    const pathname = new URL(requestUrl, 'https://kapa.local').pathname;
    const normalizedPath = pathname.startsWith('/api/')
      ? pathname.slice('/api'.length)
      : pathname;
    return publicAuthenticationPaths.has(normalizedPath);
  } catch {
    return false;
  }
}

export function shouldClearSession(
  status: number | undefined,
  errorMessage: string,
  requestUrl: string | undefined,
): boolean {
  if (isPublicAuthenticationRequest(requestUrl)) return false;

  return (
    status === 401 ||
    (status === 403 &&
      (errorMessage.includes('Invalid or expired token') ||
        errorMessage.toLowerCase().includes('expired') ||
        errorMessage.toLowerCase().includes('token')))
  );
}

kapaService.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const errorData = error.response?.data;
    const errorMessage =
      typeof errorData?.error === 'string'
        ? errorData.error
        : typeof errorData?.message === 'string'
          ? errorData.message
          : '';

    if (shouldClearSession(status, errorMessage, error.config?.url)) {
      onUnauthorizedCallback?.();
    }

    return Promise.reject(error);
  },
);
