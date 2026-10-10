import { create } from 'axios';
import { apiBaseUrl } from './apiBaseUrl';

export const kapaService = create({ baseURL: apiBaseUrl });

let onUnauthorizedCallback: (() => void) | null = null;

export function setOnUnauthorizedCallback(cb: (() => void) | null): void {
  onUnauthorizedCallback = cb;
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

    if (
      status === 401 ||
      (status === 403 &&
        (errorMessage.includes('Invalid or expired token') ||
          errorMessage.toLowerCase().includes('expired') ||
          errorMessage.toLowerCase().includes('token')))
    ) {
      onUnauthorizedCallback?.();
    }

    return Promise.reject(error);
  },
);
