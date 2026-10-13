import type { AxiosAdapter } from 'axios';
import {
  kapaService,
  setOnUnauthorizedCallback,
  shouldClearSession,
} from '../../src/services/kapaService';

function rejectingAdapter(
  status: number,
  data: { error?: string; message?: string },
): AxiosAdapter {
  return (config) =>
    Promise.reject(
      Object.assign(new Error('Request failed'), {
        config,
        response: { status, data },
      }),
    );
}

describe('shouldClearSession', () => {
  afterEach(() => setOnUnauthorizedCallback(null));

  it.each(['/auth/login', '/auth/register', '/auth/google'])(
    'keeps the authentication form mounted for a 401 from %s',
    (requestUrl) => {
      expect(
        shouldClearSession(401, 'E-mail ou senha inválidos.', requestUrl),
      ).toBe(false);
    },
  );

  it('recognizes an absolute public authentication URL', () => {
    expect(
      shouldClearSession(
        401,
        'Token do Google inválido ou expirado',
        'https://api.example.com/api/auth/google',
      ),
    ).toBe(false);
  });

  it('clears the session after a 401 from a protected endpoint', () => {
    expect(shouldClearSession(401, 'Não autorizado', '/users/me')).toBe(true);
  });

  it('clears the session after a token-related 403', () => {
    expect(
      shouldClearSession(403, 'Invalid or expired token', '/users/me'),
    ).toBe(true);
  });

  it('keeps the session for a permission-related 403', () => {
    expect(shouldClearSession(403, 'Acesso negado', '/animals/management')).toBe(
      false,
    );
  });

  it('does not invoke the logout callback after failed credentials', async () => {
    const onUnauthorized = jest.fn();
    setOnUnauthorizedCallback(onUnauthorized);

    await expect(
      kapaService.post('/auth/login', undefined, {
        adapter: rejectingAdapter(401, {
          message: 'E-mail ou senha inválidos.',
        }),
      }),
    ).rejects.toThrow('Request failed');

    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('invokes the logout callback after a protected request returns 401', async () => {
    const onUnauthorized = jest.fn();
    setOnUnauthorizedCallback(onUnauthorized);

    await expect(
      kapaService.get('/users/me', {
        adapter: rejectingAdapter(401, { error: 'UnauthorizedError' }),
      }),
    ).rejects.toThrow('Request failed');

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });
});
