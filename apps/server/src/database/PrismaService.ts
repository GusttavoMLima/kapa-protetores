import '../config/env';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool, type PoolConfig } from 'pg';
import { logger } from '../config/logger';

export const DEFAULT_POSTGRES_POOL_MAX = 10;

export function createPostgresPoolConfig(
  connectionString: string,
  maxConnections = Number(process.env.DB_POOL_MAX) || DEFAULT_POSTGRES_POOL_MAX,
): PoolConfig {
  return {
    connectionString,
    max: maxConnections,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
  };
}

export class PrismaService {
  private static instance?: PrismaService;
  public readonly client: PrismaClient;
  private readonly pool: Pool;

  private constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        '[PrismaService] DATABASE_URL is not defined in environment variables.',
      );
    }

    // `pg` reads sslmode and sslrootcert from the connection string. Adding an
    // `ssl` object here would create a second, conflicting TLS configuration.
    this.pool = new Pool(createPostgresPoolConfig(connectionString));

    this.pool.on('error', (err) => {
      logger.error(
        { err },
        '[PrismaService] Unexpected error on idle PostgreSQL client',
      );
    });

    const adapter = new PrismaPg(this.pool);
    this.client = new PrismaClient({ adapter });
  }

  public static getInstance(): PrismaService {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService();
    }
    return PrismaService.instance;
  }

  public async connect(): Promise<void> {
    await this.client.$connect();
  }

  public async disconnect(): Promise<void> {
    await this.client.$disconnect();
    await this.pool.end();
  }
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = PrismaService.getInstance().client;
    const value = Reflect.get(client, prop, receiver);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
