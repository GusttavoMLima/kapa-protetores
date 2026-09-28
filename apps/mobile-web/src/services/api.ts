import { Platform } from 'react-native';

const defaultBaseUrl = Platform.OS === 'android'
  ? 'http://10.0.2.2:4000/api'
  : 'http://localhost:4000/api';

const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? defaultBaseUrl;
let accessToken: string | undefined;

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export function setAccessToken(token?: string): void {
  accessToken = token;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('accept', 'application/json');
  if (typeof options.body === 'string') headers.set('content-type', 'application/json');
  if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);

  const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
  const body = await response.json() as ApiEnvelope<T>;
  if (!response.ok || !body.success || body.data === undefined) {
    throw new ApiError(body.error ?? 'Não foi possível concluir a solicitação.', response.status);
  }
  return body.data;
}
