const mockPoolOn = jest.fn();
const mockPoolEnd = jest.fn().mockResolvedValue(undefined);
const mockPoolConstructor = jest.fn(() => ({
  on: mockPoolOn,
  end: mockPoolEnd,
}));
const mockPrismaConnect = jest.fn().mockResolvedValue(undefined);
const mockPrismaDisconnect = jest.fn().mockResolvedValue(undefined);
const mockPrismaClientConstructor = jest.fn(() => ({
  $connect: mockPrismaConnect,
  $disconnect: mockPrismaDisconnect,
}));
const mockPrismaPgConstructor = jest.fn(() => ({}));

jest.mock('pg', () => ({ Pool: mockPoolConstructor }));
jest.mock('@prisma/client', () => ({
  PrismaClient: mockPrismaClientConstructor,
}));
jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: mockPrismaPgConstructor,
}));

import {
  createPostgresPoolConfig,
  PrismaService,
} from '../../src/database/PrismaService';

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

  it('passes the connection-string TLS configuration to the PostgreSQL pool', () => {
    const connectionString =
      'postgresql://user:password@aws-0-region.pooler.supabase.com:5432/postgres' +
      '?sslmode=verify-full&sslrootcert=/etc/secrets/supabase-ca.crt';
    process.env.DATABASE_URL = connectionString;

    PrismaService.getInstance();

    expect(mockPoolConstructor).toHaveBeenCalledWith(
      createPostgresPoolConfig(connectionString),
    );
  });
});
