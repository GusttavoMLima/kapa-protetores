import { createPostgresPoolConfig } from '../../src/database/PrismaService';

describe('PrismaService PostgreSQL pool configuration', () => {
  it('leaves verified TLS parameters in the connection string for pg to process', () => {
    const connectionString =
      'postgresql://user:password@aws-0-region.pooler.supabase.com:5432/postgres' +
      '?sslmode=verify-full&sslrootcert=/etc/secrets/supabase-ca.crt';

    const config = createPostgresPoolConfig(connectionString);

    expect(config).toEqual({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
    });
    expect(config).not.toHaveProperty('ssl');
  });

  it('keeps local PostgreSQL connections free of forced TLS options', () => {
    const connectionString =
      'postgresql://docker:docker@localhost:5432/kapa?schema=public';

    const config = createPostgresPoolConfig(connectionString);

    expect(config.connectionString).toBe(connectionString);
    expect(config).not.toHaveProperty('ssl');
  });
});
