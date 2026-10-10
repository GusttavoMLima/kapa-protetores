import '../config/env';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { databaseConnectionConfig } from './connectionConfig';

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

    this.pool = new Pool(databaseConnectionConfig(connectionString, process.env.NODE_ENV));

    this.pool.on('error', () => {
      console.error(JSON.stringify({ event: 'database_idle_connection_error' }));
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
