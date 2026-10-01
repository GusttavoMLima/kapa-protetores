import { create } from 'axios';
import { apiBaseUrl } from './apiBaseUrl';

export const kapaService = create({ baseURL: apiBaseUrl });
