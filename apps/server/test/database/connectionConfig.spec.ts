import { databaseConnectionConfig } from '../../src/database/connectionConfig';

describe('shared database connection security', () => {
  it('keeps local development compatible with PostgreSQL in Docker', () => {
    expect(databaseConnectionConfig('postgresql://localhost/kapa').ssl).toBeUndefined();
  });
  it('requires verified TLS for remote hosts, including require URLs', () => {
    const config = databaseConnectionConfig('postgresql://example.com/kapa?sslmode=require');
    expect(config.ssl).toEqual({ rejectUnauthorized: true });
    expect(config.connectionString).not.toContain('sslmode');
    expect(config.max).toBe(5);
  });
  it.each(['disable', 'no-verify', 'prefer', 'allow'])('rejects insecure TLS mode %s', (mode) => {
    expect(() => databaseConnectionConfig(`postgresql://example.com/kapa?sslmode=${mode}`)).toThrow();
  });
  it('does not mistake a supabase substring in credentials for the hostname', () => {
    expect(databaseConnectionConfig('postgresql://supabase:password@localhost/kapa').ssl).toBeUndefined();
  });
  it('rejects invalid URLs without disclosing them', () => {
    expect(() => databaseConnectionConfig('secret-invalid-url')).toThrow('DATABASE_URL must be a valid PostgreSQL URL.');
  });
});
