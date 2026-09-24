import { create } from 'axios';

const api_url =
  (process.env.EXPO_PUBLIC_API_URL! as string) ?? 'http://localhost:4000';

export const kapaService = create({
  baseURL: api_url,
});
