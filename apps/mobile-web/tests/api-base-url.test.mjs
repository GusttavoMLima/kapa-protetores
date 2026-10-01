import assert from 'node:assert/strict';
import test from 'node:test';

process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com/api';
const { normalizeApiBaseUrl } = await import('../src/services/apiBaseUrl.ts');

test('API URL requires explicit configuration', () => {
  assert.throws(() => normalizeApiBaseUrl(undefined), /EXPO_PUBLIC_API_URL/);
  assert.throws(() => normalizeApiBaseUrl('  '), /EXPO_PUBLIC_API_URL/);
});

test('API URL appends /api and removes trailing slashes', () => {
  assert.equal(normalizeApiBaseUrl('https://api.example.com/v1///'), 'https://api.example.com/v1/api');
  assert.equal(normalizeApiBaseUrl('https://api.example.com/api/'), 'https://api.example.com/api');
});

test('API URL rejects query strings and fragments', () => {
  assert.throws(() => normalizeApiBaseUrl('https://api.example.com?token=secret'), /query string/);
  assert.throws(() => normalizeApiBaseUrl('https://api.example.com#fragment'), /fragment/);
});

test('production API URL requires HTTPS', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    assert.throws(() => normalizeApiBaseUrl('http://localhost:4000/api'), /HTTPS in production/);
    assert.equal(normalizeApiBaseUrl('https://api.example.com/api'), 'https://api.example.com/api');
  } finally {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  }
});
