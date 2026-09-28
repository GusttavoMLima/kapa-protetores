import { create } from 'axios';
import { Platform } from 'react-native';

const defaultUrl = Platform.OS === 'android' ? 'http://10.0.2.2:4000/api' : 'http://localhost:4000/api';
const configuredUrl = (process.env.EXPO_PUBLIC_API_URL ?? defaultUrl).replace(/\/+$/, '');
export const kapaService = create({ baseURL: configuredUrl.endsWith('/api') ? configuredUrl : `${configuredUrl}/api` });
