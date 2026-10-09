import { JwtService } from '../../src/security/JwtService';

describe('JwtService', () => {
  const service = new JwtService(
    'test-secret-with-at-least-thirty-two-characters',
    'test-issuer',
    'test-audience',
    60,
  );

  it('JwtService signs and verifies required claims', () => {
    const token = service.sign({
      sub: '2e76e5cc-8e1f-4f4e-a94f-e7e527203680',
      email: 'voluntario@example.com',
      role: 'volunteer',
    });
    const payload = service.verify(token);
    expect(payload.email).toBe('voluntario@example.com');
    expect(payload.role).toBe('volunteer');
  });

  it('JwtService rejects a modified token', () => {
    const token = service.sign({
      sub: '2e76e5cc-8e1f-4f4e-a94f-e7e527203680',
      email: 'voluntario@example.com',
      role: 'volunteer',
    });
    expect(() => service.verify(`${token.slice(0, -1)}x`)).toThrow();
  });
});
