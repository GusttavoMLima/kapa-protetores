import { normalizeApiBaseUrl } from '../../src/services/apiBaseUrl';

describe('normalizeApiBaseUrl', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com/api';
  });

  it('API URL requires explicit configuration', () => {
    expect(() => normalizeApiBaseUrl(undefined)).toThrow(/EXPO_PUBLIC_API_URL/);
    expect(() => normalizeApiBaseUrl('  ')).toThrow(/EXPO_PUBLIC_API_URL/);
  });

  it('API URL appends /api and removes trailing slashes', () => {
    expect(normalizeApiBaseUrl('https://api.example.com/v1///')).toBe('https://api.example.com/v1/api');
    expect(normalizeApiBaseUrl('https://api.example.com/api/')).toBe('https://api.example.com/api');
  });

  it('API URL rejects query strings and fragments', () => {
    expect(() => normalizeApiBaseUrl('https://api.example.com?token=secret')).toThrow(/query string/);
    expect(() => normalizeApiBaseUrl('https://api.example.com#fragment')).toThrow(/fragment/);
  });

  it('production API URL requires HTTPS', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      expect(() => normalizeApiBaseUrl('http://localhost:4000/api')).toThrow(/HTTPS in production/);
      expect(normalizeApiBaseUrl('https://api.example.com/api')).toBe('https://api.example.com/api');
    } finally {
      if (originalNodeEnv === undefined) {
        delete (process.env as Record<string, string | undefined>).NODE_ENV;
      } else {
        process.env.NODE_ENV = originalNodeEnv;
      }
    }
  });
});
