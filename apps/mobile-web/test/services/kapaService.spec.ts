import { shouldClearSession } from '../../src/services/kapaService';

describe('shouldClearSession', () => {
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
});
