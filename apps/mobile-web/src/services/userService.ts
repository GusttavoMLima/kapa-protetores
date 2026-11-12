import { apiRequest } from './api';
import type { User } from '@kapa/shared';

export interface UpdateUserProfileInput {
  birthDate?: string;
  phone?: string;
  username?: string;
  email?: string;
  avatar?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

function extensionForMime(mimeType: string): string {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

export async function uploadUserAvatar(uri: string): Promise<string> {
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }

  const form = new FormData();
  if (typeof window !== 'undefined') {
    const blob = await fetch(uri).then((response) => response.blob());
    const ext = extensionForMime(blob.type);
    form.append('avatar', blob, `avatar.${ext}`);
  } else {
    const extension = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const type =
      extension === 'png'
        ? 'image/png'
        : extension === 'webp'
          ? 'image/webp'
          : 'image/jpeg';
    form.append('avatar', {
      uri,
      name: `avatar.${extensionForMime(type)}`,
      type,
    } as unknown as Blob);
  }

  const result = await apiRequest<{ avatarUrl: string; user: User }>(
    '/users/me/avatar',
    {
      method: 'POST',
      body: form,
    },
  );

  return result.avatarUrl;
}

export async function updateUserProfile(
  data: UpdateUserProfileInput,
): Promise<User> {
  return apiRequest<User>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
